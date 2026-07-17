import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Feedback } from './entities/feedback.entity';
import { Report } from './entities/report.entity';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@Injectable()
export class FeedbackService {
  constructor(
    @InjectRepository(Feedback)
    private readonly feedbackRepository: Repository<Feedback>,
    @InjectRepository(Report)
    private readonly reportsRepository: Repository<Report>,
  ) {}

  /**
   * Creates a new manager feedback for a report.
   * Only one feedback per manager per report is allowed.
   */
  async create(
    reportId: string,
    dto: CreateFeedbackDto,
    manager: JwtPayload,
  ): Promise<Feedback> {
    const report = await this.reportsRepository.findOne({ where: { id: reportId } });
    if (!report) throw new NotFoundException('Report not found');

    const existing = await this.feedbackRepository.findOne({
      where: { reportId, managerId: manager.sub },
    });

    if (existing) {
      throw new ConflictException('You have already submitted feedback for this report');
    }

    const feedback = this.feedbackRepository.create({
      ...dto,
      reportId,
      managerId: manager.sub,
    });

    return this.feedbackRepository.save(feedback);
  }

  /**
   * Returns all feedbacks for a specific report.
   */
  async findByReport(reportId: string): Promise<Feedback[]> {
    return this.feedbackRepository.find({
      where: { reportId },
      relations: ['manager'],
      order: { createdAt: 'DESC' },
    });
  }
}
