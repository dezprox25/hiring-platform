import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Difficulty } from '../enums/difficulty.enum';
import { QuestionStatus } from '../enums/question-status.enum';
import { Exclude } from 'class-transformer';

@Entity('mcq_questions')
export class McqQuestion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  questionText: string;

  @Column({ type: 'text', array: true })
  options: string[];

  @Exclude()
  @Column({ type: 'text' })
  correctAnswer: string;

  @Column()
  topic: string;

  @Column()
  roleApplied: string;

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
