import { Assessment } from './assessment.entity';
export declare class McqAnswer {
    id: string;
    assessmentId: string;
    assessment: Assessment;
    questionId: string;
    topic: string;
    selectedOption: string;
    isCorrect: boolean;
    answeredAt: Date;
}
