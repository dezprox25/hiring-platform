"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var TimerProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimerProcessor = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const assessments_service_1 = require("../assessments/assessments.service");
const assessment_gateway_1 = require("./assessment.gateway");
const gateway_service_1 = require("./gateway.service");
let TimerProcessor = TimerProcessor_1 = class TimerProcessor extends bullmq_1.WorkerHost {
    constructor(assessmentsService, gateway, gatewayService) {
        super();
        this.assessmentsService = assessmentsService;
        this.gateway = gateway;
        this.gatewayService = gatewayService;
        this.logger = new common_1.Logger(TimerProcessor_1.name);
    }
    async process(job) {
        const { assessmentId, userId, round } = job.data;
        this.logger.log(`Processing timer check for assessment ${assessmentId}, round ${round}`);
        try {
            const mockUser = { sub: userId, role: 'candidate' };
            const assessment = await this.assessmentsService.getAssessmentForUser(assessmentId, mockUser);
            if (assessment.status !== round) {
                this.logger.log(`Assessment ${assessmentId} round has already changed. Skipping force submit.`);
                return;
            }
            const remaining = this.gatewayService.getSecondsRemaining(assessment);
            if (remaining <= 0) {
                this.logger.warn(`Time is up for assessment ${assessmentId}. Triggering server-authoritative round advance and force submit.`);
                this.gateway.emitForceSubmit(assessmentId, round);
                try {
                    await this.assessmentsService.advanceRound(assessmentId);
                }
                catch (advanceErr) {
                    const advMsg = advanceErr instanceof Error ? advanceErr.message : 'Unknown error';
                    this.logger.warn(`Could not advance round automatically for ${assessmentId}: ${advMsg}`);
                }
            }
            else {
                this.logger.log(`Assessment ${assessmentId} still has ${remaining}s left. Re-queueing check.`);
                const queue = job.queue;
                await queue.add('check-timer', job.data, {
                    delay: remaining * 1000,
                    jobId: `timer-${assessmentId}-${round}`,
                });
            }
        }
        catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            this.logger.error(`Error in timer processor for ${assessmentId}: ${message}`);
            throw err;
        }
    }
};
exports.TimerProcessor = TimerProcessor;
exports.TimerProcessor = TimerProcessor = TimerProcessor_1 = __decorate([
    (0, bullmq_1.Processor)('assessment-timer'),
    __metadata("design:paramtypes", [assessments_service_1.AssessmentsService,
        assessment_gateway_1.AssessmentGateway,
        gateway_service_1.GatewayService])
], TimerProcessor);
//# sourceMappingURL=timer.processor.js.map