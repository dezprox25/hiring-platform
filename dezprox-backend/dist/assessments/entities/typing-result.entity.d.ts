import { Assessment } from './assessment.entity';
export declare class TypingResult {
    id: string;
    assessmentId: string;
    assessment: Assessment;
    passage: string;
    typedText: string;
    timeTakenSeconds: number;
    wpm: number;
    accuracy: number;
    mistakes: number;
    createdAt: Date;
}
