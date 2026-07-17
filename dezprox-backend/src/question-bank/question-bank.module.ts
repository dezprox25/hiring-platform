import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { McqQuestion } from './entities/mcq-question.entity';
import { CodingQuestion } from './entities/coding-question.entity';
import { McqQuestionService } from './mcq-question.service';
import { CodingQuestionService } from './coding-question.service';
import { QuestionBankController } from './question-bank.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      McqQuestion,
      CodingQuestion,
    ]),
  ],
  controllers: [QuestionBankController],
  providers: [
    McqQuestionService,
    CodingQuestionService,
  ],
  exports: [
    McqQuestionService,
    CodingQuestionService,
  ],
})
export class QuestionBankModule {}
