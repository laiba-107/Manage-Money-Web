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
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';
import {
  CreateTransactionDto,
  UpdateTransactionDto,
} from './dto/create-transaction.dto';
import { QueryTransactionDto } from './dto/query-transaction.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('transactions')
@Controller({ path: 'transactions', version: '1' })
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT')
export class TransactionsController {
  constructor(private transactionsService: TransactionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new transaction (income or expense)' })
  async create(@CurrentUser() user: User, @Body() dto: CreateTransactionDto) {
    const transaction = await this.transactionsService.create(user.id, dto);
    return { data: transaction, message: 'Transaction created' };
  }

  @Get()
  @ApiOperation({ summary: 'Get all transactions with filtering and pagination' })
  async findAll(@CurrentUser() user: User, @Query() query: QueryTransactionDto) {
    const result = await this.transactionsService.findAll(user.id, query);
    return { data: result.data, meta: result.meta, message: 'Transactions retrieved' };
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get income/expense summary for a period' })
  async getSummary(
    @CurrentUser() user: User,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate ? new Date(endDate) : new Date();
    const summary = await this.transactionsService.getSummary(user.id, start, end);
    return { data: summary, message: 'Summary retrieved' };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single transaction' })
  async findOne(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const transaction = await this.transactionsService.findOne(user.id, id);
    return { data: transaction, message: 'Transaction retrieved' };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a transaction' })
  async update(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTransactionDto,
  ) {
    const transaction = await this.transactionsService.update(user.id, id, dto);
    return { data: transaction, message: 'Transaction updated' };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a transaction' })
  async remove(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.transactionsService.remove(user.id, id);
  }
}
