import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Difficulty } from '../enums/difficulty.enum';
import { QuestionStatus } from '../enums/question-status.enum';
import { ProgrammingLanguage } from '../../assessments/enums/programming-language.enum';

@Entity('coding_questions')
export class CodingQuestion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  prompt: string;

  @Column({
    type: 'enum',
    enum: ProgrammingLanguage,
  })
  language: ProgrammingLanguage;

  @Column({
    type: 'enum',
    enum: Difficulty,
    default: Difficulty.MEDIUM,
  })
  difficulty: Difficulty;

  @Column({
    type: 'enum',
    enum: QuestionStatus,
    default: QuestionStatus.ACTIVE,
  })
  status: QuestionStatus;

  @Column({ default: false })
  isDeleted: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
