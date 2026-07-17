import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import { AssessmentsService } from '../assessments/assessments.service';
import { CodingService } from '../assessments/coding.service';
import { GatewayService } from './gateway.service';
import { MetricsService } from '../metrics/metrics.service';
import { AssessmentStatus } from '../assessments/enums/assessment-status.enum';
import { CandidateStatus } from '../candidates/enums/candidate-status.enum';
export declare class AssessmentGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
    private readonly assessmentsService;
    private readonly codingService;
    private readonly gatewayService;
    private readonly configService;
    private readonly metricsService;
    private readonly timerQueue;
    server: Server;
    private readonly logger;
    constructor(assessmentsService: AssessmentsService, codingService: CodingService, gatewayService: GatewayService, configService: ConfigService, metricsService: MetricsService, timerQueue: Queue);
    afterInit(server: Server): void;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleJoin(client: Socket, payload: {
        assessmentId: string;
    }): Promise<void>;
    handleViolation(client: Socket, payload: {
        assessmentId: string;
        type: string;
        detail?: string;
    }): Promise<void>;
    handleAutosave(client: Socket, payload: {
        assessmentId: string;
        draftCode: string;
    }): Promise<void>;
    handleTimerRequest(client: Socket, payload: {
        assessmentId: string;
    }): Promise<void>;
    handleHrJoin(client: Socket): Promise<void>;
    emitRoundAdvanced(assessmentId: string, newRound: AssessmentStatus): void;
    emitStatusUpdate(candidateId: string, status: CandidateStatus): void;
    emitAssessmentCompleted(assessmentId: string): void;
    emitForceSubmit(assessmentId: string, round: string): void;
}
