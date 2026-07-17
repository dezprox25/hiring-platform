import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { User } from '../../users/entities/user.entity';
import { QuestionType } from '../enums/question-type.enum';

export enum QuestionDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
}

@Entity('questions')
export class Question {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: QuestionType })
  type: QuestionType;

  @Column()
  category: string;

  @Column({ type: 'enum', enum: QuestionDifficulty })
  difficulty: QuestionDifficulty;

  @Column({ type: 'text' })
  text: string;

  @Column({ type: 'json', nullable: true })
  options: string[] | null;

  @Exclude()
  @Column({ nullable: true })
  correctAnswer: string | null;

  @Column({ type: 'text', nullable: true })
  codeStarter: string | null;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'uuid', name: 'created_by_id' })
  createdById: string;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'created_by_id' })
  createdBy: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
