import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { ReportsService } from './reports.service';
import { FeedbackService } from './feedback.service';
import { ReleaseResultDto } from './dto/release-result.dto';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
export declare class ReportsController {
    private readonly reportsService;
    private readonly feedbackService;
    constructor(reportsService: ReportsService, feedbackService: FeedbackService);
    findMyReport(user: JwtPayload): Promise<any>;
    findAll(roleApplied?: string, isShortlisted?: string, minScore?: string, maxScore?: string, page?: string, limit?: string, user?: JwtPayload): Promise<{
        data: any[];
        total: number;
    }>;
    findByCandidateId(candidateId: string, user: JwtPayload): Promise<any>;
    findById(id: string, user: JwtPayload): Promise<any>;
    releaseResult(id: string, dto: ReleaseResultDto, user: JwtPayload): Promise<import("./entities/report.entity").Report>;
    toggleShortlist(id: string, isShortlisted: boolean): Promise<import("./entities/report.entity").Report>;
    addFeedback(id: string, dto: CreateFeedbackDto, user: JwtPayload): Promise<import("./entities/feedback.entity").Feedback>;
    getFeedback(id: string): Promise<import("./entities/feedback.entity").Feedback[]>;
}
