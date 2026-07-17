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
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { AssessmentsService } from './assessments.service';
import { McqService, CandidateMcqQuestion } from './mcq.service';
import { TypingService } from './typing.service';
import { CodingService } from './coding.service';
import { SubmitMcqDto } from './dto/submit-mcq.dto';
import { SubmitTypingDto } from './dto/submit-typing.dto';
import { SubmitCodingDto } from './dto/submit-coding.dto';
import { AutosaveCodingDto } from './dto/autosave-coding.dto';
import { ManagerReviewDto } from './dto/manager-review.dto';
import { ADMIN_HR, ALL_ROLES, ALL_STAFF } from '../common/constants/permissions.constant';

@Controller('assessments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AssessmentsController {
  constructor(
    private readonly assessmentsService: AssessmentsService,
    private readonly mcqService: McqService,
    private readonly typingService: TypingService,
    private readonly codingService: CodingService,
  ) {}

  @Post(':id/start')
  @Roles(Role.CANDIDATE)
  async start(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.assessmentsService.start(id, user);
  }

  @Get(':id/status')
  @Roles(...ALL_ROLES)
  async getStatus(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.assessmentsService.getStatus(id, user);
  }

  // MCQ Round
  @Get(':id/mcq/questions')
  @Roles(Role.CANDIDATE)
  async getMcqQuestions(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<CandidateMcqQuestion[]> {
    return this.mcqService.getQuestions(id, user);
  }

  @Post(':id/mcq/submit')
  @Roles(Role.CANDIDATE)
  async submitMcq(
    @Param('id') id: string,
    @Body() dto: SubmitMcqDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.mcqService.submitAnswers(id, dto, user);
  }

  // Typing Round
  @Get(':id/typing/passage')
  @Roles(Role.CANDIDATE)
  async getTypingPassage(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.typingService.getPassage(id, user);
  }

  @Post(':id/typing/submit')
  @Roles(Role.CANDIDATE)
  async submitTyping(
    @Param('id') id: string,
    @Body() dto: SubmitTypingDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.typingService.submitTyping(id, dto, user);
  }

  // Coding Round
  @Get(':id/coding/question')
  @Roles(Role.CANDIDATE)
  async getCodingQuestion(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.codingService.getQuestion(id, user);
  }

  @Post(':id/coding/autosave')
  @Roles(Role.CANDIDATE)
  async autosaveCoding(
    @Param('id') id: string,
    @Body() dto: AutosaveCodingDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.codingService.autosave(id, dto, user);
  }

  @Post(':id/coding/submit')
  @Roles(Role.CANDIDATE)
  async submitCoding(
    @Param('id') id: string,
    @Body() dto: SubmitCodingDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.codingService.submitCoding(id, dto, user);
  }

  @Post(':id/coding/review')
  @Roles(Role.ADMIN, Role.MANAGER)
  async addManagerReview(
    @Param('id') id: string,
    @Body() dto: ManagerReviewDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.codingService.addManagerReview(id, dto, user);
  }

  @Get(':id/coding/submission')
  @Roles(...ALL_STAFF)
  async getCodingSubmission(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.codingService.getSubmission(id, user);
  }
}
