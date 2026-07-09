import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('settings')
@Controller({ path: 'settings', version: '1' })
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT')
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all user settings' })
  async getAll(@CurrentUser() user: User) {
    const settings = await this.settingsService.getAll(user.id);
    return { data: settings, message: 'Settings retrieved' };
  }

  @Patch()
  @ApiOperation({ summary: 'Update multiple settings at once' })
  async updateMany(
    @CurrentUser() user: User,
    @Body() updates: Record<string, any>,
  ) {
    await this.settingsService.updateMany(user.id, updates);
    const settings = await this.settingsService.getAll(user.id);
    return { data: settings, message: 'Settings updated' };
  }
}
