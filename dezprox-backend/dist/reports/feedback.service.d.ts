import { Repository } from 'typeorm';
import { Feedback } from './entities/feedback.entity';
import { Report } from './entities/report.entity';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
export declare class FeedbackService {
    private readonly feedbackRepository;
    private readonly reportsRepository;
    constructor(feedbackRepository: Repository<Feedback>, reportsRepository: Repository<Report>);
    create(reportId: string, dto: CreateFeedbackDto, manager: JwtPayload): Promise<Feedback>;
    findByReport(reportId: string): Promise<Feedback[]>;
}
