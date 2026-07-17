import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Assessment } from './assessment.entity';

@Entity('typing_results')
export class TypingResult {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true, name: 'assessment_id' })
  assessmentId: string;

  @OneToOne(() => Assessment, (a) => a.typingResult, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'assessment_id' })
  assessment: Assessment;


  @Column({ type: 'text', nullable: true })
  passage: string;

  @Column({ type: 'text', nullable: true })
  typedText: string;

  @Column({ type: 'int', name: 'time_taken_seconds' })
  timeTakenSeconds: number;

  @Column({ type: 'int' })
  wpm: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  accuracy: number;

  @Column({ type: 'int', default: 0 })
  mistakes: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
