import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { AiEvaluationService } from './ai-evaluation.service';
import { RetriggerEvaluationDto } from './dto/retrigger-evaluation.dto';
import { ADMIN_MANAGER, ALL_STAFF } from '../common/constants/permissions.constant';

@Controller('ai-evaluations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AiEvaluationController {
  constructor(private readonly aiEvaluationService: AiEvaluationService) {}

  @Get(':candidateId')
  @Roles(...ALL_STAFF)
  async findByCandidateId(@Param('candidateId') candidateId: string) {
    return this.aiEvaluationService.findByCandidateId(candidateId);
  }

  @Get(':candidateId/status')
  @Roles(...ALL_STAFF)
  async getStatus(@Param('candidateId') candidateId: string) {
    return this.aiEvaluationService.getStatus(candidateId);
  }

  @Post(':candidateId/trigger')
  @Roles(...ADMIN_MANAGER)
  async retrigger(
    @Param('candidateId') candidateId: string,
    @Body() dto: RetriggerEvaluationDto,
  ) {
    return this.aiEvaluationService.retrigger(candidateId, dto);
  }
}
