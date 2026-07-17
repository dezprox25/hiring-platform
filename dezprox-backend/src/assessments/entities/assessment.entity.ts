import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  Index,
} from 'typeorm';
import { Candidate } from '../../candidates/entities/candidate.entity';
import { AssessmentStatus } from '../enums/assessment-status.enum';
import { CodingSubmission } from './coding-submission.entity';
import { McqAnswer } from './mcq-answer.entity';
import { TypingResult } from './typing-result.entity';
import { Report } from '../../reports/entities/report.entity';
import { AiEvaluation } from '../../ai-evaluation/entities/ai-evaluation.entity';

@Entity('assessments')
export class Assessment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid', name: 'candidate_id' })
  candidateId: string;

  @OneToOne(() => Candidate, (c) => c.assessment)
  @JoinColumn({ name: 'candidate_id' })
  candidate: Candidate;

  @OneToOne(() => CodingSubmission, (c) => c.assessment, { cascade: true })
  codingSubmission: CodingSubmission;

  @OneToMany(() => McqAnswer, (a) => a.assessment, { cascade: true })
  mcqAnswers: McqAnswer[];

  @OneToOne(() => TypingResult, (t) => t.assessment, { cascade: true })
  typingResult: TypingResult;

  @OneToOne(() => Report, (r) => r.assessment)
  report: Report;

  @OneToOne(() => AiEvaluation, (a) => a.assessment)
  aiEvaluation: AiEvaluation;

  @Index()
  @Column({
    type: 'varchar',
    length: 30,
    default: AssessmentStatus.NOT_STARTED,
  })
  status: AssessmentStatus;

  @Column({ type: 'timestamp', nullable: true, name: 'started_at' })
  startedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true, name: 'round2_started_at' })
  round2StartedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true, name: 'round3_started_at' })
  round3StartedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true, name: 'completed_at' })
  completedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
