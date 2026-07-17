import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

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

@Injectable()
export class OpenAiService {
  private openai: OpenAI;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    
    if (!apiKey || apiKey === 'sk-xxxx') {
      console.warn('OPENAI_API_KEY is missing or using default. AI Evaluation features will be disabled.');
      // Don't instantiate OpenAI if key is missing to avoid crash
      return;
    }

    this.openai = new OpenAI({
      apiKey,
    });
  }

  /**
   * Calls GPT-4 to evaluate a candidate based on provided prompts.
   * Validates and returns structured JSON response.
   */
  async evaluate(
    systemPrompt: string,
    userMessage: string,
  ): Promise<GptEvaluationResponse> {
    if (!this.openai) {
      throw new InternalServerErrorException('OpenAI service is not configured. Please set a valid OPENAI_API_KEY.');
    }
    try {
      const model = this.configService.get<string>('OPENAI_MODEL', 'gpt-4');
      const response = await this.openai.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature: 0,
      });

      let content = response.choices[0].message.content || '';

      // Strip markdown code fences if GPT-4 added them
      content = content.replace(/^```json\n?/, '').replace(/\n?```$/, '');

      try {
        const parsed: GptEvaluationResponse = JSON.parse(content);

        // Basic validation of recommendation enum
        const validRecommendations = ['hire', 'reject', 'hold'];
        if (!validRecommendations.includes(parsed.recommendation)) {
          throw new Error(`Invalid recommendation: ${parsed.recommendation}`);
        }

        return parsed;
      } catch (err) {
        throw new InternalServerErrorException('AI service returned malformed JSON');
      }
    } catch (err) {
      if (err instanceof InternalServerErrorException) throw err;
      const message = err instanceof Error ? err.message : 'Unknown error';
      throw new InternalServerErrorException(`OpenAI Error: ${message}`);
    }
  }
}
