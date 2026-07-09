import {
  Controller,
  Get,
  Query,
  UseGuards,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { AnalyticsService, ReportPeriod } from './analytics.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('analytics')
@Controller({ path: 'analytics', version: '1' })
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT')
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get complete dashboard analytics data' })
  async getDashboard(@CurrentUser() user: User) {
    const data = await this.analyticsService.getDashboardData(user.id);
    return { data, message: 'Dashboard data retrieved' };
  }

  @Get('report')
  @ApiOperation({ summary: 'Get financial report for a period' })
  @ApiQuery({
    name: 'period',
    enum: ['daily', 'weekly', 'monthly', 'yearly'],
    required: false,
  })
  async getReport(
    @CurrentUser() user: User,
    @Query('period') period: ReportPeriod = 'monthly',
    @Query('date') date?: string,
  ) {
    const reportDate = date ? new Date(date) : undefined;
    const data = await this.analyticsService.getReport(user.id, period, reportDate);
    return { data, message: 'Report generated' };
  }

  @Get('trends')
  @ApiOperation({ summary: 'Get spending trends over multiple months' })
  async getTrends(
    @CurrentUser() user: User,
    @Query('months') months: number = 6,
  ) {
    const data = await this.analyticsService.getSpendingTrends(user.id, months);
    return { data, message: 'Spending trends retrieved' };
  }

  @Get('insights')
  @ApiOperation({ summary: 'Get AI-powered financial insights and suggestions' })
  async getInsights(@CurrentUser() user: User) {
    const data = await this.analyticsService.getInsights(user.id);
    return { data, message: 'Insights generated' };
  }
}
