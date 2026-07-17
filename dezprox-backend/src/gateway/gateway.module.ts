import { Module, Global } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { BullModule } from '@nestjs/bullmq';
import { AssessmentsModule } from '../assessments/assessments.module';
import { AssessmentGateway } from './assessment.gateway';
import { GatewayService } from './gateway.service';
import { TimerProcessor } from './timer.processor';

@Global()
@Module({
  imports: [
    JwtModule,
    BullModule.registerQueue({
      name: 'assessment-timer',
    }),
    AssessmentsModule,
  ],
  providers: [AssessmentGateway, GatewayService, TimerProcessor],
  exports: [AssessmentGateway],
})
export class GatewayModule {}
