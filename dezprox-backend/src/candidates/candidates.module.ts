import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CandidatesService } from './candidates.service';
import { CandidatesController } from './candidates.controller';
import { Candidate } from './entities/candidate.entity';
import { UsersModule } from '../users/users.module';
import { MailModule } from '../mail/mail.module';
import { GatewayModule } from '../gateway/gateway.module';
import { AssessmentsModule } from '../assessments/assessments.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Candidate]),
    UsersModule,
    MailModule,
    forwardRef(() => GatewayModule),
    forwardRef(() => AssessmentsModule),
  ],
  controllers: [CandidatesController],
  providers: [CandidatesService],
  exports: [CandidatesService],
})
export class CandidatesModule {}
