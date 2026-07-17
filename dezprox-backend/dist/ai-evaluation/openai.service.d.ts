import { ConfigService } from '@nestjs/config';
export interface GptEvaluationResponse {
    overallScore: number;
    recommendation: 'hire' | 'reject' | 'hold';
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
    summary: string;
}
export declare class OpenAiService {
    private readonly configService;
    private openai;
    constructor(configService: ConfigService);
    evaluate(systemPrompt: string, userMessage: string): Promise<GptEvaluationResponse>;
}
