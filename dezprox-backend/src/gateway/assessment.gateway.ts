import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards, Logger, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Sentry from '@sentry/nestjs';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { WsJwtGuard } from '../common/guards/ws-jwt.guard';
import { AssessmentsService } from '../assessments/assessments.service';
import { CodingService } from '../assessments/coding.service';
import { GatewayService } from './gateway.service';
import { MetricsService } from '../metrics/metrics.service';
import { AssessmentStatus } from '../assessments/enums/assessment-status.enum';
import { Role } from '../common/enums/role.enum';
import { CandidateStatus } from '../candidates/enums/candidate-status.enum';

@WebSocketGateway({
  namespace: '/assessment',
})
@UseGuards(WsJwtGuard)
export class AssessmentGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(AssessmentGateway.name);

  constructor(
    @Inject(forwardRef(() => AssessmentsService))
    private readonly assessmentsService: AssessmentsService,
    private readonly codingService: CodingService,
    private readonly gatewayService: GatewayService,
    private readonly configService: ConfigService,
    private readonly metricsService: MetricsService,
    @InjectQueue('assessment-timer') private readonly timerQueue: Queue,
  ) {}

  /**
   * Configures CORS from environment variables after initialization.
   */
  afterInit(server: Server) {
    const origin = this.configService.get<string>('FRONTEND_URL');
    const corsConfig = {
      origin: origin || true,
      credentials: true,
    };
    if (server.engine?.opts) {
      server.engine.opts.cors = corsConfig;
    }
    this.logger.log('WebSocket Gateway initialized');
  }

  /**
   * Logs new connections. Authentication is handled by WsJwtGuard.
   */
  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id} (User: ${client.data.user?.email})`);
    this.metricsService.activeConnections.inc();
    this.metricsService.websocketEventsTotal.inc({ event: 'connect', type: 'in' });
  }

  /**
   * Logs disconnections.
   */
  handleDisconnect(client: Socket) {
    const reason = client.conn.transport.name;
    this.logger.log(`Client disconnected: ${client.id} (Reason: ${reason})`);
    this.metricsService.activeConnections.dec();
    this.metricsService.websocketEventsTotal.inc({ event: 'disconnect', type: 'in' });
  }

  /**
   * Joins a candidate to their assessment room and starts the distributed timer check.
   */
  @SubscribeMessage('assessment:join')
  async handleJoin(client: Socket, payload: { assessmentId: string }) {
    this.metricsService.websocketEventsTotal.inc({ event: 'assessment:join', type: 'in' });
    try {
      const user = client.data.user;
      
      this.logger.log(`User ${user.email} joining assessment ${payload.assessmentId}`);
      const assessment = await this.assessmentsService.getAssessmentForUser(payload.assessmentId, user);
      
      // Clear any existing rooms except the private client ID room
      const rooms = Array.from(client.rooms);
      rooms.forEach(room => {
        if (room !== client.id && room !== `candidate:${user.sub}`) {
          client.leave(room);
        }
      });

      client.join(payload.assessmentId);
      
      // Join room for targeting this specific candidate
      client.join(`candidate:${client.data.user.sub}`);

      const secondsRemaining = this.gatewayService.getSecondsRemaining(assessment);

      client.emit('assessment:joined', {
        status: assessment.status,
        secondsRemaining,
      });

      this.metricsService.websocketEventsTotal.inc({ event: 'assessment:joined', type: 'out' });
      this.logger.log(`User ${user.email} successfully joined assessment ${payload.assessmentId}`);

      // Schedule distributed timer check if round is active
      if (secondsRemaining > 0) {
        await this.timerQueue.add('check-timer', {
          assessmentId: payload.assessmentId,
          userId: user.sub,
          round: assessment.status,
        }, {
          delay: secondsRemaining * 1000,
          jobId: `timer-${payload.assessmentId}-${assessment.status}`, // Unique per assessment round
        });
      }

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      const stack = err instanceof Error ? err.stack : '';
      this.logger.error(`Error joining assessment: ${message}`, stack);
      Sentry.captureException(err, { extra: { payload, user: client.data.user } });
      client.emit('error', { message: 'Failed to join assessment room' });
    }
  }

  /**
   * Reports suspicious activity from the frontend (anti-cheat).
   */
  @SubscribeMessage('anticheat:violation')
  async handleViolation(client: Socket, payload: { assessmentId: string; type: string; detail?: string }) {
    const user = client.data.user;
    this.logger.warn(`Anti-cheat violation by user ${user.sub} (${user.email}): ${payload.type} - ${payload.detail}`);
    
    // Broadcast to HR/Admin room
    this.server.to('hr-room').emit('candidate:violation', {
      candidateId: user.sub,
      email: user.email,
      assessmentId: payload.assessmentId,
      type: payload.type,
      detail: payload.detail,
      timestamp: new Date(),
    });
  }

  /**
   * Handles code autosave requests from the client.
   */
  @SubscribeMessage('code:autosave')
  async handleAutosave(client: Socket, payload: { assessmentId: string; draftCode: string }) {
    try {
      await this.codingService.autosave(payload.assessmentId, { draftCode: payload.draftCode }, client.data.user);
      client.emit('code:autosaved', { savedAt: new Date() });
    } catch (err) {
      // Log silently as requested
      const message = err instanceof Error ? err.message : 'Unknown error';
      this.logger.warn(`Autosave failed for client ${client.id}: ${message}`);
    }
  }

  /**
   * Returns current timer status to the requesting client.
   */
  @SubscribeMessage('timer:request')
  async handleTimerRequest(client: Socket, payload: { assessmentId: string }) {
    try {
      const assessment = await this.assessmentsService.getAssessmentForUser(payload.assessmentId, client.data.user);
      const secondsRemaining = this.gatewayService.getSecondsRemaining(assessment);

      client.emit('timer:tick', {
        round: assessment.status,
        secondsRemaining,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      this.logger.error(`Timer request error: ${message}`);
    }
  }

  /**
   * Joins HR/Admin users to a global monitoring room.
   */
  @SubscribeMessage('hr:join')
  async handleHrJoin(client: Socket) {
    const user = client.data.user;
    if (user.role === Role.HR || user.role === Role.ADMIN) {
      client.join('hr-room');
      client.emit('hr:joined');
    }
  }

  // --- Public methods for other services ---

  /**
   * Pushes round advance notification to candidate.
   */
  emitRoundAdvanced(assessmentId: string, newRound: AssessmentStatus) {
    this.server.to(assessmentId).emit('round:advanced', { newRound });
  }

  /**
   * Pushes status update to HR monitoring room.
   */
  emitStatusUpdate(candidateId: string, status: CandidateStatus) {
    this.server.to('hr-room').emit('candidate:statusUpdated', {
      candidateId,
      status,
    });
  }

  /**
   * Pushes assessment completion event to candidate.
   */
  emitAssessmentCompleted(assessmentId: string) {
    this.server.to(assessmentId).emit('assessment:forcesubmit', { round: 'completed' });
  }

  /**
   * Emits a force-submit signal for a specific assessment room (e.g. timer expiry).
   */
  emitForceSubmit(assessmentId: string, round: string) {
    this.server.to(assessmentId).emit('assessment:forcesubmit', { round });
  }
}
