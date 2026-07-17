import { Recommendation } from '../enums/recommendation.enum';
export declare class CreateFeedbackDto {
    overallRating: number;
    technicalComment?: string;
    communicationComment?: string;
    recommendation: Recommendation;
}
