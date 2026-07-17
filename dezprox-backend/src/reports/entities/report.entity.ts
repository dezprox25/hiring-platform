import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Candidate } from '../../candidates/entities/candidate.entity';
import { Assessment } from '../../assessments/entities/assessment.entity';
import { Feedback } from './feedback.entity';

@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid', unique: true, name: 'candidate_id' })
  candidateId: string;

  @ManyToOne(() => Candidate, (c) => c.report, { nullable: false })
  @JoinColumn({ name: 'candidate_id' })
  candidate: Candidate;

  @Index()
  @Column({ type: 'uuid', unique: true, name: 'assessment_id' })
  assessmentId: string;

  @ManyToOne(() => Assessment, (a) => a.report, { nullable: false })
  @JoinColumn({ name: 'assessment_id' })
  assessment: Assessment;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0, name: 'mcq_percentage' })
  mcqPercentage: number;

  @Column({ type: 'int', default: 0, name: 'mcq_correct' })
  mcqCorrect: number;

  @Column({ type: 'int', default: 0, name: 'mcq_total' })
  mcqTotal: number;

  @Column({ type: 'jsonb', default: {}, name: 'mcq_topic_breakdown' })
  mcqTopicBreakdown: Record<
    string,
    { correct: number; total: number; percentage: number }
  >;

  @Column({ type: 'int', default: 0, name: 'typing_wpm' })
  typingWpm: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0, name: 'typing_accuracy' })
  typingAccuracy: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true, name: 'coding_manager_score' })
  codingManagerScore: number | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true, name: 'coding_ai_score' })
  codingAiScore: number | null;

  @Index()
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0, name: 'total_score' })
  totalScore: number;

  @Column({ default: false, name: 'is_result_released' })
  isResultReleased: boolean;

  @Index()
  @Column({ default: false, name: 'is_shortlisted' })
  isShortlisted: boolean;

  @Column({ type: 'varchar', length: 10, nullable: true })
  recommendation: 'hire' | 'reject' | 'hold' | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Index()
  @CreateDateColumn({ name: 'generated_at' })
  generatedAt: Date;

  @OneToMany(() => Feedback, (feedback) => feedback.report)
  feedbacks: Feedback[];
}
