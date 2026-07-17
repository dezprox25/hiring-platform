"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AssessmentGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssessmentGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const Sentry = __importStar(require("@sentry/nestjs"));
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
const ws_jwt_guard_1 = require("../common/guards/ws-jwt.guard");
const assessments_service_1 = require("../assessments/assessments.service");
const coding_service_1 = require("../assessments/coding.service");
const gateway_service_1 = require("./gateway.service");
const metrics_service_1 = require("../metrics/metrics.service");
const role_enum_1 = require("../common/enums/role.enum");
let AssessmentGateway = AssessmentGateway_1 = class AssessmentGateway {
    constructor(assessmentsService, codingService, gatewayService, configService, metricsService, timerQueue) {
        this.assessmentsService = assessmentsService;
        this.codingService = codingService;
        this.gatewayService = gatewayService;
        this.configService = configService;
        this.metricsService = metricsService;
        this.timerQueue = timerQueue;
        this.logger = new common_1.Logger(AssessmentGateway_1.name);
    }
    afterInit(server) {
        const origin = this.configService.get('FRONTEND_URL');
        const corsConfig = {
            origin: origin || true,
            credentials: true,
        };
        if (server.engine?.opts) {
            server.engine.opts.cors = corsConfig;
        }
        this.logger.log('WebSocket Gateway initialized');
    }
    handleConnection(client) {
        this.logger.log(`Client connected: ${client.id} (User: ${client.data.user?.email})`);
        this.metricsService.activeConnections.inc();
        this.metricsService.websocketEventsTotal.inc({ event: 'connect', type: 'in' });
    }
    handleDisconnect(client) {
        const reason = client.conn.transport.name;
        this.logger.log(`Client disconnected: ${client.id} (Reason: ${reason})`);
        this.metricsService.activeConnections.dec();
        this.metricsService.websocketEventsTotal.inc({ event: 'disconnect', type: 'in' });
    }
    async handleJoin(client, payload) {
        this.metricsService.websocketEventsTotal.inc({ event: 'assessment:join', type: 'in' });
        try {
            const user = client.data.user;
            this.logger.log(`User ${user.email} joining assessment ${payload.assessmentId}`);
            const assessment = await this.assessmentsService.getAssessmentForUser(payload.assessmentId, user);
            const rooms = Array.from(client.rooms);
            rooms.forEach(room => {
                if (room !== client.id && room !== `candidate:${user.sub}`) {
                    client.leave(room);
                }
            });
            client.join(payload.assessmentId);
            client.join(`candidate:${client.data.user.sub}`);
            const secondsRemaining = this.gatewayService.getSecondsRemaining(assessment);
            client.emit('assessment:joined', {
                status: assessment.status,
                secondsRemaining,
            });
            this.metricsService.websocketEventsTotal.inc({ event: 'assessment:joined', type: 'out' });
            this.logger.log(`User ${user.email} successfully joined assessment ${payload.assessmentId}`);
            if (secondsRemaining > 0) {
                await this.timerQueue.add('check-timer', {
                    assessmentId: payload.assessmentId,
                    userId: user.sub,
                    round: assessment.status,
                }, {
                    delay: secondsRemaining * 1000,
                    jobId: `timer-${payload.assessmentId}-${assessment.status}`,
                });
            }
        }
        catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            const stack = err instanceof Error ? err.stack : '';
            this.logger.error(`Error joining assessment: ${message}`, stack);
            Sentry.captureException(err, { extra: { payload, user: client.data.user } });
            client.emit('error', { message: 'Failed to join assessment room' });
        }
    }
    async handleViolation(client, payload) {
        const user = client.data.user;
        this.logger.warn(`Anti-cheat violation by user ${user.sub} (${user.email}): ${payload.type} - ${payload.detail}`);
        this.server.to('hr-room').emit('candidate:violation', {
            candidateId: user.sub,
            email: user.email,
            assessmentId: payload.assessmentId,
            type: payload.type,
            detail: payload.detail,
            timestamp: new Date(),
        });
    }
    async handleAutosave(client, payload) {
        try {
            await this.codingService.autosave(payload.assessmentId, { draftCode: payload.draftCode }, client.data.user);
            client.emit('code:autosaved', { savedAt: new Date() });
        }
        catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            this.logger.warn(`Autosave failed for client ${client.id}: ${message}`);
        }
    }
    async handleTimerRequest(client, payload) {
        try {
            const assessment = await this.assessmentsService.getAssessmentForUser(payload.assessmentId, client.data.user);
            const secondsRemaining = this.gatewayService.getSecondsRemaining(assessment);
            client.emit('timer:tick', {
                round: assessment.status,
                secondsRemaining,
            });
        }
        catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            this.logger.error(`Timer request error: ${message}`);
        }
    }
    async handleHrJoin(client) {
        const user = client.data.user;
        if (user.role === role_enum_1.Role.HR || user.role === role_enum_1.Role.ADMIN) {
            client.join('hr-room');
            client.emit('hr:joined');
        }
    }
    emitRoundAdvanced(assessmentId, newRound) {
        this.server.to(assessmentId).emit('round:advanced', { newRound });
    }
    emitStatusUpdate(candidateId, status) {
        this.server.to('hr-room').emit('candidate:statusUpdated', {
            candidateId,
            status,
        });
    }
    emitAssessmentCompleted(assessmentId) {
        this.server.to(assessmentId).emit('assessment:forcesubmit', { round: 'completed' });
    }
    emitForceSubmit(assessmentId, round) {
        this.server.to(assessmentId).emit('assessment:forcesubmit', { round });
    }
};
exports.AssessmentGateway = AssessmentGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], AssessmentGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('assessment:join'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], AssessmentGateway.prototype, "handleJoin", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('anticheat:violation'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], AssessmentGateway.prototype, "handleViolation", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('code:autosave'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], AssessmentGateway.prototype, "handleAutosave", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('timer:request'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], AssessmentGateway.prototype, "handleTimerRequest", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('hr:join'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], AssessmentGateway.prototype, "handleHrJoin", null);
exports.AssessmentGateway = AssessmentGateway = AssessmentGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        namespace: '/assessment',
    }),
    (0, common_1.UseGuards)(ws_jwt_guard_1.WsJwtGuard),
    __param(0, (0, common_1.Inject)((0, common_1.forwardRef)(() => assessments_service_1.AssessmentsService))),
    __param(5, (0, bullmq_1.InjectQueue)('assessment-timer')),
    __metadata("design:paramtypes", [assessments_service_1.AssessmentsService,
        coding_service_1.CodingService,
        gateway_service_1.GatewayService,
        config_1.ConfigService,
        metrics_service_1.MetricsService,
        bullmq_2.Queue])
], AssessmentGateway);
//# sourceMappingURL=assessment.gateway.js.map