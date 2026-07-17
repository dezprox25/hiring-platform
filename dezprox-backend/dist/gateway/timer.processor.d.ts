import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { AssessmentsService } from '../assessments/assessments.service';
import { AssessmentGateway } from './assessment.gateway';
import { GatewayService } from './gateway.service';
export declare class TimerProcessor extends WorkerHost {
    private readonly assessmentsService;
    private readonly gateway;
    private readonly gatewayService;
    private readonly logger;
    constructor(assessmentsService: AssessmentsService, gateway: AssessmentGateway, gatewayService: GatewayService);
    process(job: Job<any, any, string>): Promise<any>;
}
