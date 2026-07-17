import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { McqQuestionService } from './mcq-question.service';
import { CodingQuestionService } from './coding-question.service';
import { CreateMcqQuestionDto } from './dto/create-mcq-question.dto';
import { UpdateMcqQuestionDto } from './dto/update-mcq-question.dto';
import { ListMcqQuestionsDto } from './dto/list-mcq-questions.dto';
import { CreateCodingQuestionDto } from './dto/create-coding-question.dto';
import { UpdateCodingQuestionDto } from './dto/update-coding-question.dto';
import { ListCodingQuestionsDto } from './dto/list-coding-questions.dto';
import { UpdateQuestionStatusDto } from './dto/update-question-status.dto';
import { ADMIN_MANAGER, ADMIN_ONLY } from '../common/constants/permissions.constant';

@Controller('question-bank')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...ADMIN_MANAGER) // Candidates cannot access the bank
export class QuestionBankController {
  constructor(
    private readonly mcqQuestionService: McqQuestionService,
    private readonly codingQuestionService: CodingQuestionService,
  ) {}

  // --- MCQ Questions ---

  @Post('mcq')
  async createMcq(@Body() dto: CreateMcqQuestionDto) {
    return this.mcqQuestionService.create(dto);
  }

  @Post('mcq/bulk-import')
  async bulkImportMcq(@Body('csv') csvString: string) {
    return this.mcqQuestionService.bulkImport(csvString);
  }

  @Get('mcq')
  async findAllMcq(@Query() filters: ListMcqQuestionsDto) {
    return this.mcqQuestionService.findAll(filters);
  }

  @Get('mcq/:id')
  async findOneMcq(@Param('id') id: string) {
    return this.mcqQuestionService.findOneSafe(id);
  }

  @Patch('mcq/:id')
  async updateMcq(
    @Param('id') id: string,
    @Body() dto: UpdateMcqQuestionDto,
  ) {
    return this.mcqQuestionService.update(id, dto);
  }

  @Patch('mcq/:id/status')
  async toggleMcqStatus(
    @Param('id') id: string,
    @Body() dto: UpdateQuestionStatusDto,
  ) {
    return this.mcqQuestionService.toggleStatus(id, dto.status);
  }

  @Delete('mcq/:id')
  @Roles(...ADMIN_ONLY)
  async deleteMcq(@Param('id') id: string) {
    return this.mcqQuestionService.softDelete(id);
  }

  // --- Coding Questions ---

  @Post('coding')
  async createCoding(@Body() dto: CreateCodingQuestionDto) {
    return this.codingQuestionService.create(dto);
  }

  @Get('coding')
  async findAllCoding(@Query() filters: ListCodingQuestionsDto) {
    return this.codingQuestionService.findAll(filters);
  }

  @Get('coding/:id')
  async findOneCoding(@Param('id') id: string) {
    return this.codingQuestionService.findOne(id);
  }

  @Patch('coding/:id')
  async updateCoding(
    @Param('id') id: string,
    @Body() dto: UpdateCodingQuestionDto,
  ) {
    return this.codingQuestionService.update(id, dto);
  }

  @Patch('coding/:id/status')
  async toggleCodingStatus(
    @Param('id') id: string,
    @Body() dto: UpdateQuestionStatusDto,
  ) {
    return this.codingQuestionService.toggleStatus(id, dto.status);
  }

  @Delete('coding/:id')
  @Roles(...ADMIN_ONLY)
  async deleteCoding(@Param('id') id: string) {
    return this.codingQuestionService.softDelete(id);
  }
}
