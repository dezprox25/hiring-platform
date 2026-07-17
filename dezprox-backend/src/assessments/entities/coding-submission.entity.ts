import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Assessment } from './assessment.entity';
import { Question } from './question.entity';
import { ProgrammingLanguage } from '../enums/programming-language.enum';

@Entity('coding_submissions')
export class CodingSubmission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true, name: 'assessment_id' })
  assessmentId: string;

  @OneToOne(() => Assessment, (a) => a.codingSubmission, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'assessment_id' })
  assessment: Assessment;


  @Column({ type: 'uuid', name: 'question_id' })
  questionId: string;

  @ManyToOne(() => Question, { nullable: false })
  @JoinColumn({ name: 'question_id' })
  question: Question;

  @Column({ type: 'text', default: '' })
  code: string;

  @Column({ type: 'enum', enum: ProgrammingLanguage, default: ProgrammingLanguage.TYPESCRIPT })
  language: ProgrammingLanguage;

  @Column({ type: 'int', default: 0, name: 'time_taken_seconds' })
  timeTakenSeconds: number;

  @Column({ type: 'text', nullable: true, name: 'draft_code' })
  draftCode: string | null;

  @Column({ type: 'int', nullable: true, name: 'manager_score' })
  managerScore: number | null;

  @Column({ type: 'text', nullable: true, name: 'manager_feedback' })
  managerFeedback: string | null;

  @Column({ type: 'timestamp', nullable: true, name: 'manager_reviewed_at' })
  managerReviewedAt: Date | null;

  @Column({ type: 'int', nullable: true, name: 'ai_score' })
  aiScore: number | null;

  @Column({ type: 'json', nullable: true, name: 'ai_analysis' })
  aiAnalysis: {
    overallScore: number;
    recommendation: string;
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
    summary?: string;
    generatedAt: string;
  } | null;

  @Column({ type: 'timestamp', nullable: true, name: 'ai_analysed_at' })
  aiAnalysedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true, name: 'submitted_at' })
  submittedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
