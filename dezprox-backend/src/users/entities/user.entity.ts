import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, OneToMany } from 'typeorm';
import { Exclude } from 'class-transformer';
import { Role } from '../../common/enums/role.enum';
import { Candidate } from '../../candidates/entities/candidate.entity';
import { Feedback } from '../../reports/entities/feedback.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Exclude()
  @Column()
  password_hash: string;

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.CANDIDATE,
  })
  role: Role;

  @Column({ default: true })
  is_active: boolean;

  @Exclude()
  @Column({ nullable: true })
  refresh_token_hash: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToOne(() => Candidate, (c) => c.user)
  candidate: Candidate;

  @OneToMany(() => Feedback, (f) => f.manager)
  feedbacks: Feedback[];
}

