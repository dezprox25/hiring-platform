export interface AiEvaluationResponse {
    overallScore: number;
    recommendation: string;
    strengths: string[];
    weaknesses: string[];
    codingAnalysis: {
        logic: number;
        readability: number;
        structure: number;
    };
    communicationAnalysis: {
        clarity: number;
        confidence: number;
    };
    summary?: string;
    generatedAt: string;
}
