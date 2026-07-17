import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssessmentsController } from './assessments.controller';
import { AssessmentsService } from './assessments.service';
import { McqService } from './mcq.service';
import { TypingService } from './typing.service';
import { CodingService } from './coding.service';
import { Assessment } from './entities/assessment.entity';
import { Candidate } from '../candidates/entities/candidate.entity';
import { Question } from './entities/question.entity';
import { McqAnswer } from './entities/mcq-answer.entity';
import { TypingResult } from './entities/typing-result.entity';
import { CodingSubmission } from './entities/coding-submission.entity';
import { ReportsModule } from '../reports/reports.module';
import { AiEvaluationModule } from '../ai-evaluation/ai-evaluation.module';
import { QuestionBankModule } from '../question-bank/question-bank.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Assessment,
      Candidate,
      Question,
      McqAnswer,
      TypingResult,
      CodingSubmission,
    ]),
    ReportsModule,
    forwardRef(() => AiEvaluationModule),
    QuestionBankModule,
  ],
  controllers: [AssessmentsController],
  providers: [
    AssessmentsService,
    McqService,
    TypingService,
    CodingService,
  ],
  exports: [AssessmentsService, McqService, TypingService, CodingService],
})
export class AssessmentsModule {}
