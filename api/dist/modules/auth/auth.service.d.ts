import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    user: Partial<User>;
}
export declare class AuthService {
    private usersService;
    private jwtService;
    private configService;
    private readonly logger;
    constructor(usersService: UsersService, jwtService: JwtService, configService: ConfigService);
    register(dto: RegisterDto): Promise<AuthTokens>;
    loginWithPassword(dto: LoginDto): Promise<AuthTokens>;
    generateTokens(user: User): Promise<AuthTokens>;
    refreshTokens(refreshToken: string): Promise<AuthTokens>;
    logout(userId: string): Promise<void>;
    getProfile(userId: string): Promise<Partial<User>>;
    private sanitizeUser;
    private parseExpiresIn;
}
