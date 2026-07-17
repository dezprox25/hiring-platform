import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn, Index } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Assessment } from '../../assessments/entities/assessment.entity';
import { CandidateStatus } from '../enums/candidate-status.enum';
import { Report } from '../../reports/entities/report.entity';
import { AiEvaluation } from '../../ai-evaluation/entities/ai-evaluation.entity';

@Entity('candidates')
export class Candidate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'full_name' })
  fullName: string;

  @Column({ nullable: true })
  phone: string;

  @Index()
  @Column({ name: 'role_applied' })
  roleApplied: string;

  @Index()
  @Column({
    type: 'varchar',
    length: 30,
    default: CandidateStatus.INVITED,
  })
  status: CandidateStatus;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Index()
  @Column({ default: false, name: 'is_deleted' })
  isDeleted: boolean;

  @Index()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToOne(() => User, (u) => u.candidate)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToOne(() => Assessment, (a) => a.candidate)
  assessment: Assessment;

  @OneToOne(() => Report, (r) => r.candidate)
  report: Report;

  @OneToOne(() => AiEvaluation, (a) => a.candidate)
  aiEvaluation: AiEvaluation;
}
