import {
  Controller,
  Get,
  Post,
  UseGuards,
  Req,
  Res,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { RefreshTokenDto, RegisterDto, LoginDto } from './dto/auth.dto';
import { User } from '../users/entities/user.entity';
import { ThrottlerGuard } from '@nestjs/throttler';

@ApiTags('auth')
@Controller({ path: 'auth', version: '1' })
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  @Public()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Initiate Google OAuth login' })
  async googleAuth() {
    // Passport handles redirect
  }

  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth callback' })
  async googleAuthCallback(@Req() req: any, @Res() res: Response) {
    const tokens = await this.authService.generateTokens(req.user);
    const frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:3000',
    ).replace(/\/$/, '');

    const redirectUrl = `${frontendUrl}/auth_callback.html?accessToken=${encodeURIComponent(
      tokens.accessToken,
    )}&refreshToken=${encodeURIComponent(tokens.refreshToken)}`;
    return res.redirect(redirectUrl);
  }

  @Public()
  @Post('demo')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Instant Demo Sign-In without OAuth' })
  async demoLogin() {
    const tokens = await this.authService.loginAsDemo();
    return { data: tokens, message: 'Signed in as Demo user' };
  }

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new account with email and password' })
  async register(@Body() dto: RegisterDto) {
    const tokens = await this.authService.register(dto);
    return { data: tokens, message: 'Registration successful' };
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sign in with email and password' })
  async login(@Body() dto: LoginDto) {
    const tokens = await this.authService.loginWithPassword(dto);
    return { data: tokens, message: 'Signed in successfully' };
  }

  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  async refresh(@Body() dto: RefreshTokenDto) {
    const tokens = await this.authService.refreshTokens(dto.refreshToken);
    return { data: tokens, message: 'Tokens refreshed' };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout and invalidate tokens' })
  async logout(@CurrentUser() user: User) {
    await this.authService.logout(user.id);
    return { message: 'Logged out successfully' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Get current authenticated user profile' })
  async getProfile(@CurrentUser() user: User) {
    const profile = await this.authService.getProfile(user.id);
    return { data: profile, message: 'Profile retrieved' };
  }
}
