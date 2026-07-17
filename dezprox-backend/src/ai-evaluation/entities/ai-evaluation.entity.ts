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
import { Candidate } from '../../candidates/entities/candidate.entity';
import { AiEvaluationStatus } from '../enums/ai-evaluation-status.enum';
import { Recommendation } from '../../reports/enums/recommendation.enum';
import { Assessment } from '../../assessments/entities/assessment.entity';

@Entity('ai_evaluations')
export class AiEvaluation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true, name: 'candidate_id' })
  candidateId: string;

  @OneToOne(() => Candidate, (c) => c.aiEvaluation, { nullable: false, cascade: false })
  @JoinColumn({ name: 'candidate_id' })
  candidate: Candidate;

  @Column({ type: 'uuid', unique: true, name: 'assessment_id' })
  assessmentId: string;

  @ManyToOne(() => Assessment, (a) => a.aiEvaluation, { nullable: false, cascade: false })
  @JoinColumn({ name: 'assessment_id' })
  assessment: Assessment;


  @Column({
    type: 'enum',
    enum: AiEvaluationStatus,
    default: AiEvaluationStatus.PENDING,
  })
  status: AiEvaluationStatus;

  @Column({ type: 'text', array: true, nullable: true })
  strengths: string[] | null;

  @Column({ type: 'text', array: true, nullable: true })
  weaknesses: string[] | null;

  @Column({ type: 'jsonb', nullable: true })
  codingAnalysis: { logic: number; readability: number; structure: number } | null;

  @Column({ type: 'jsonb', nullable: true })
  communicationAnalysis: { clarity: number; confidence: number } | null;

  @Column({ type: 'text', nullable: true })
  summary: string | null;

  @Column({
    type: 'enum',
    enum: Recommendation,
    nullable: true,
  })
  recommendation: Recommendation | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  overallScore: number | null;

  @Column({ type: 'text', nullable: true })
  rawResponse: string | null;

  @Column({ type: 'text', nullable: true })
  errorMessage: string | null;

  @Column({ type: 'timestamp', nullable: true })
  lastEvaluatedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
