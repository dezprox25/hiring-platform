import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { Report } from '../reports/entities/report.entity';
import { Candidate } from '../candidates/entities/candidate.entity';
import { Assessment } from '../assessments/entities/assessment.entity';
import { McqAnswer } from '../assessments/entities/mcq-answer.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Report,
      Candidate,
      Assessment,
      McqAnswer,
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
