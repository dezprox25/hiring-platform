import { Controller, Get, Param, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { CacheInterceptor, CacheKey, CacheTTL } from '@nestjs/cache-manager';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { AnalyticsService } from './analytics.service';
import { AnalyticsFilterDto } from './dto/analytics-filter.dto';
import { ALL_STAFF } from '../common/constants/permissions.constant';

@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...ALL_STAFF) // Candidates cannot access analytics
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get()
  @UseInterceptors(CacheInterceptor)
  @CacheKey('analytics_dashboard')
  @CacheTTL(300) // 5 minutes
  async getDashboardData(@Query() filters: AnalyticsFilterDto) {
    return this.analyticsService.getDashboardData(filters);
  }

  @Get('dashboard')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(300)
  async getDashboardStats(@Query() filters: AnalyticsFilterDto) {
    return this.analyticsService.getDashboardStats(filters);
  }

  @Get('radar/:candidateId')
  async getRadarData(@Param('candidateId') candidateId: string) {
    return this.analyticsService.getRadarData(candidateId);
  }

  @Get('topics')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(600)
  async getTopicBreakdown(@Query() filters: AnalyticsFilterDto) {
    return this.analyticsService.getTopicBreakdown(filters);
  }

  @Get('pass-fail')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(600)
  async getPassFailRatio(@Query() filters: AnalyticsFilterDto) {
    return this.analyticsService.getPassFailRatio(filters);
  }

  @Get('trends')
  @Roles(Role.ADMIN) // Override class-level, admin only
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(3600) // 1 hour
  async getHiringTrends(@Query() filters: AnalyticsFilterDto) {
    return this.analyticsService.getHiringTrends(filters);
  }

  @Get('leaderboard')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(600)
  async getLeaderboard(@Query() filters: AnalyticsFilterDto) {
    return this.analyticsService.getLeaderboard(filters);
  }

  @Get('scores/distribution')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(1200)
  async getScoreDistribution(@Query() filters: AnalyticsFilterDto) {
    return this.analyticsService.getScoreDistribution(filters);
  }
}
