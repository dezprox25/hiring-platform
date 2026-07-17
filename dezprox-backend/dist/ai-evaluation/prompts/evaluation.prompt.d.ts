export interface EvaluationInputData {
    candidateName: string;
    roleApplied: string;
    mcq: {
        totalQuestions: number;
        correctAnswers: number;
        percentage: number;
        topicBreakdown: Record<string, {
            correct: number;
            total: number;
            percentage: number;
        }>;
    };
    typing: {
        wpm: number;
        accuracy: number;
        timeTakenSeconds: number;
    };
    coding: {
        question: string;
        submittedCode: string;
        language: string;
        managerScore: number | null;
        managerReview: string | null;
    };
}
export declare function buildEvaluationPrompt(data: EvaluationInputData): {
    systemPrompt: string;
    userMessage: string;
};
