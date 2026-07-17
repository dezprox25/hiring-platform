import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Report } from './report.entity';
import { Recommendation } from '../enums/recommendation.enum';

@Entity('feedbacks')
export class Feedback {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  reportId: string;

  @ManyToOne(() => Report, (r) => r.feedbacks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'report_id' })
  report: Report;

  @Column({ type: 'uuid' })
  managerId: string;

  @ManyToOne(() => User, (u) => u.feedbacks, { nullable: false })
  @JoinColumn({ name: 'manager_id' })
  manager: User;


  @Column({ type: 'int' })
  overallRating: number; // 1-5

  @Column({ type: 'text', nullable: true })
  technicalComment: string | null;

  @Column({ type: 'text', nullable: true })
  communicationComment: string | null;

  @Column({
    type: 'enum',
    enum: Recommendation,
  })
  recommendation: Recommendation;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
