import {
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';

export interface GoogleUserData {
  googleId: string;
  email: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  photoUrl?: string;
  isEmailVerified?: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: Partial<User>;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateGoogleUser(googleData: GoogleUserData): Promise<User> {
    let user = await this.usersService.findByGoogleId(googleData.googleId);

    if (!user) {
      // Check if account already exists with same email
      const existingUser = await this.usersService.findByEmail(
        googleData.email,
      );
      if (existingUser) {
        // Link Google account to existing user
        user = await this.usersService.linkGoogleAccount(
          existingUser.id,
          googleData,
        );
      } else {
        user = await this.usersService.createFromGoogle(googleData);
      }
    }

    await this.usersService.updateLastLogin(user.id);
    this.logger.log(`User authenticated: ${user.email}`);
    return user;
  }

  async generateTokens(user: User): Promise<AuthTokens> {
    const payload = { sub: user.id, email: user.email };
    const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN', '7d');

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_SECRET'),
        expiresIn: expiresIn as any,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '30d') as any,
      }),
    ]);

    // Store hashed refresh token
    await this.usersService.updateRefreshToken(user.id, refreshToken);

    const expiresInSeconds = this.parseExpiresIn(expiresIn);

    return {
      accessToken,
      refreshToken,
      expiresIn: expiresInSeconds,
      user: this.sanitizeUser(user),
    };
  }

  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });

      const user = await this.usersService.findById(payload.sub);
      if (!user || !user.isActive) {
        throw new UnauthorizedException();
      }

      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string): Promise<void> {
    await this.usersService.updateRefreshToken(userId, null);
    this.logger.log(`User logged out: ${userId}`);
  }

  async getProfile(userId: string): Promise<Partial<User>> {
    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException();
    return this.sanitizeUser(user);
  }

  private sanitizeUser(user: User): Partial<User> {
    const { refreshToken, ...safeUser } = user;
    return safeUser;
  }

  private parseExpiresIn(expiresIn: string): number {
    const units: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) return 604800; // default 7 days
    return parseInt(match[1]) * (units[match[2]] || 1);
  }
}
