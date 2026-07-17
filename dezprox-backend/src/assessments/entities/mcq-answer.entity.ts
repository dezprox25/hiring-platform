import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Assessment } from './assessment.entity';

@Entity('mcq_answers')
export class McqAnswer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'assessment_id' })
  assessmentId: string;

  @ManyToOne(() => Assessment, (a) => a.mcqAnswers, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'assessment_id' })
  assessment: Assessment;

  @Column({ type: 'uuid', name: 'question_id' })
  questionId: string;

  @Column()
  topic: string;

  @Column({ name: 'selected_option' })
  selectedOption: string;

  @Column({ name: 'is_correct' })
  isCorrect: boolean;

  @CreateDateColumn({ name: 'answered_at' })
  answeredAt: Date;
}
