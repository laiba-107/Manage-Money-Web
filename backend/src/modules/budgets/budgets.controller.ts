import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BudgetsService } from './budgets.service';
import { CreateBudgetDto, UpdateBudgetDto } from './dto/create-budget.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('budgets')
@Controller({ path: 'budgets', version: '1' })
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT')
export class BudgetsController {
  constructor(private budgetsService: BudgetsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new budget' })
  async create(@CurrentUser() user: User, @Body() dto: CreateBudgetDto) {
    const budget = await this.budgetsService.create(user.id, dto);
    return { data: budget, message: 'Budget created' };
  }

  @Get()
  @ApiOperation({ summary: 'Get all active budgets with usage' })
  async findAll(@CurrentUser() user: User) {
    const budgets = await this.budgetsService.findAll(user.id);
    return { data: budgets, message: 'Budgets retrieved' };
  }

  @Get('monthly-status')
  @ApiOperation({ summary: 'Get monthly budget status' })
  async getMonthlyStatus(
    @CurrentUser() user: User,
    @Query('month') month?: number,
    @Query('year') year?: number,
  ) {
    const status = await this.budgetsService.getMonthlyBudgetStatus(
      user.id,
      month,
      year,
    );
    return { data: status, message: 'Monthly budget status retrieved' };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single budget' })
  async findOne(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const budget = await this.budgetsService.findOne(user.id, id);
    return { data: budget, message: 'Budget retrieved' };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a budget' })
  async update(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBudgetDto,
  ) {
    const budget = await this.budgetsService.update(user.id, id, dto);
    return { data: budget, message: 'Budget updated' };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a budget' })
  async remove(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.budgetsService.remove(user.id, id);
  }
}
