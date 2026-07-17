import { 
  Controller, 
  Get, 
  Post, 
  Patch, 
  Delete, 
  Body, 
  Param, 
  Query, 
  UseGuards 
} from '@nestjs/common';
import { CandidatesService } from './candidates.service';
import { CreateCandidateDto } from './dto/create-candidate.dto';
import { UpdateCandidateDto } from './dto/update-candidate.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { Role } from '../common/enums/role.enum';
import { 
  ADMIN_HR, 
  ADMIN_HR_MANAGER, 
  ADMIN_ONLY, 
  ALL_ROLES 
} from '../common/constants/permissions.constant';
import { CandidateStatus } from './enums/candidate-status.enum';

@Controller('candidates')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CandidatesController {
  constructor(private readonly candidatesService: CandidatesService) {}

  @Post()
  @Roles(...ADMIN_HR)
  create(@Body() createCandidateDto: CreateCandidateDto, @CurrentUser() user: JwtPayload) {
    return this.candidatesService.create(createCandidateDto, user);
  }

  @Post(':id/invite')
  @Roles(...ADMIN_HR)
  resendInvite(@Param('id') id: string) {
    return this.candidatesService.resendInvite(id);
  }

  @Get()
  @Roles(...ADMIN_HR_MANAGER)
  findAll(
    @Query('status') status?: CandidateStatus,
    @Query('roleApplied') roleApplied?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @CurrentUser() user?: JwtPayload,
  ) {
    return this.candidatesService.findAll({
      status,
      roleApplied,
      search,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    }, user!);
  }

  @Get('me')
  @Roles(Role.CANDIDATE)
  findMe(@CurrentUser() user: JwtPayload) {
    return this.candidatesService.findMe(user);
  }

  @Get('me/assessment')
  @Roles(Role.CANDIDATE)
  async getMyAssessment(@CurrentUser() user: JwtPayload) {
    const candidate = await this.candidatesService.findMe(user);
    return { assessmentId: candidate.assessment?.id ?? null };
  }

  @Get('me/result')
  @Roles(Role.CANDIDATE)
  getMyResult() {
    // Stub for now
    return { message: 'Results not yet released', result: null };
  }

  @Get(':id')
  @Roles(...ALL_ROLES)
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.candidatesService.findOne(id, user);
  }

  @Patch(':id')
  @Roles(...ADMIN_HR)
  update(
    @Param('id') id: string, 
    @Body() updateCandidateDto: UpdateCandidateDto,
    @CurrentUser() user: JwtPayload
  ) {
    return this.candidatesService.update(id, updateCandidateDto, user);
  }

  @Patch(':id/status')
  @Roles(...ADMIN_HR_MANAGER)
  updateStatus(
    @Param('id') id: string, 
    @Body() updateStatusDto: UpdateStatusDto,
    @CurrentUser() user: JwtPayload
  ) {
    return this.candidatesService.updateStatus(id, updateStatusDto, user);
  }

  @Delete(':id')
  @Roles(...ADMIN_ONLY)
  remove(@Param('id') id: string) {
    return this.candidatesService.softDelete(id);
  }
}
