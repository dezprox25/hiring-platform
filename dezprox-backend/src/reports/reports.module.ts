import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { FeedbackService } from './feedback.service';
import { Report } from './entities/report.entity';
import { Feedback } from './entities/feedback.entity';
import { Assessment } from '../assessments/entities/assessment.entity';
import { McqAnswer } from '../assessments/entities/mcq-answer.entity';
import { TypingResult } from '../assessments/entities/typing-result.entity';
import { CodingSubmission } from '../assessments/entities/coding-submission.entity';
import { Candidate } from '../candidates/entities/candidate.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Report,
      Feedback,
      Assessment,
      McqAnswer,
      TypingResult,
      CodingSubmission,
      Candidate,
    ]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService, FeedbackService],
  exports: [ReportsService],
})
export class ReportsModule {}
