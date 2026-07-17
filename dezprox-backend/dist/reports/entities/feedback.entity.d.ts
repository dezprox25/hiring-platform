import { User } from '../../users/entities/user.entity';
import { Report } from './report.entity';
import { Recommendation } from '../enums/recommendation.enum';
export declare class Feedback {
    id: string;
    reportId: string;
    report: Report;
    managerId: string;
    manager: User;
    overallRating: number;
    technicalComment: string | null;
    communicationComment: string | null;
    recommendation: Recommendation;
    createdAt: Date;
    updatedAt: Date;
}
