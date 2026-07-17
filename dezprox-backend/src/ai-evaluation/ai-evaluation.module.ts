import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { AiEvaluationService } from './ai-evaluation.service';
import { AiEvaluationController } from './ai-evaluation.controller';
import { AiEvaluation } from './entities/ai-evaluation.entity';
import { CodingSubmission } from '../assessments/entities/coding-submission.entity';
import { CandidatesModule } from '../candidates/candidates.module';
import { ReportsModule } from '../reports/reports.module';
import { OpenAiService } from './openai.service';
import { AiEvaluationProcessor } from './ai-evaluation.processor';

@Module({
  imports: [
    TypeOrmModule.forFeature([AiEvaluation, CodingSubmission]),
    BullModule.registerQueue({
      name: 'ai-evaluation',
    }),
    forwardRef(() => CandidatesModule),
    ReportsModule,
  ],
  providers: [AiEvaluationService, OpenAiService, AiEvaluationProcessor],
  controllers: [AiEvaluationController],
  exports: [AiEvaluationService],
})
export class AiEvaluationModule {}
