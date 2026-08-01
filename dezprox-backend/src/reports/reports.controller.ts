import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CacheInterceptor, CacheKey, CacheTTL } from '@nestjs/cache-manager';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { ReportsService } from './reports.service';
import { FeedbackService } from './feedback.service';
import { ReleaseResultDto } from './dto/release-result.dto';
import { CreateFeedbackDto } from './dto/create-feedback.dto';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly feedbackService: FeedbackService,
  ) {}

  @Get('me')
  @Roles(Role.CANDIDATE)
  async findMyReport(@CurrentUser() user: JwtPayload) {
    return this.reportsService.findByCandidateId(user.sub, user);
  }

  @Get()
  @Roles(Role.ADMIN, Role.HR, Role.MANAGER)
  async findAll(
    @Query('roleApplied') roleApplied?: string,
    @Query('isShortlisted') isShortlisted?: string,
    @Query('minScore') minScore?: string,
    @Query('maxScore') maxScore?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @CurrentUser() user?: JwtPayload,
  ) {
    return this.reportsService.findAll({
      roleApplied,
      isShortlisted: isShortlisted === 'true' ? true : isShortlisted === 'false' ? false : undefined,
      minScore: minScore ? Number(minScore) : undefined,
      maxScore: maxScore ? Number(maxScore) : undefined,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    }, user!);
  }

  /** Static path must be registered before `:id` or "candidate" is captured as an id. */
  @Get('candidate/:candidateId')
  @Roles(Role.ADMIN, Role.HR, Role.MANAGER)
  async findByCandidateId(
    @Param('candidateId') candidateId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.reportsService.findByCandidateId(candidateId, user);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.HR, Role.MANAGER)
  async findById(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.reportsService.findById(id, user); 
  }

  @Patch(':id/release')
  @Roles(Role.ADMIN, Role.HR)
  async releaseResult(
    @Param('id') id: string,
    @Body() dto: ReleaseResultDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.reportsService.releaseResult(id, dto, user);
  }

  @Patch(':id/shortlist')
  @Roles(Role.ADMIN, Role.HR)
  async toggleShortlist(
    @Param('id') id: string,
    @Body('isShortlisted') isShortlisted: boolean,
  ) {
    return this.reportsService.toggleShortlist(id, isShortlisted);
  }

  @Post(':id/feedback')
  @Roles(Role.ADMIN, Role.MANAGER)
  async addFeedback(
    @Param('id') id: string,
    @Body() dto: CreateFeedbackDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.feedbackService.create(id, dto, user);
  }

  @Get(':id/feedback')
  @Roles(Role.ADMIN, Role.HR, Role.MANAGER)
  async getFeedback(@Param('id') id: string) {
    return this.feedbackService.findByReport(id);
  }
}
