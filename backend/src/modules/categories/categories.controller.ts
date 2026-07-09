import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CategoryType } from './entities/category.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('categories')
@Controller({ path: 'categories', version: '1' })
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT')
export class CategoriesController {
  constructor(private categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all categories' })
  async findAll(@CurrentUser() user: User) {
    const categories = await this.categoriesService.findAll(user.id);
    return { data: categories, message: 'Categories retrieved' };
  }

  @Get('by-type')
  @ApiOperation({ summary: 'Get categories by type (income/expense)' })
  async findByType(
    @CurrentUser() user: User,
    @Query('type') type: CategoryType,
  ) {
    const categories = await this.categoriesService.findByType(type, user.id);
    return { data: categories, message: 'Categories retrieved' };
  }
}
