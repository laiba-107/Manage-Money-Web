import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { RefreshTokenDto, RegisterDto, LoginDto } from './dto/auth.dto';
import { User } from '../users/entities/user.entity';
export declare class AuthController {
    private authService;
    private configService;
    constructor(authService: AuthService, configService: ConfigService);
    register(dto: RegisterDto): Promise<{
        data: import("./auth.service").AuthTokens;
        message: string;
    }>;
    login(dto: LoginDto): Promise<{
        data: import("./auth.service").AuthTokens;
        message: string;
    }>;
    refresh(dto: RefreshTokenDto): Promise<{
        data: import("./auth.service").AuthTokens;
        message: string;
    }>;
    logout(user: User): Promise<{
        message: string;
    }>;
    getProfile(user: User): Promise<{
        data: Partial<User>;
        message: string;
    }>;
}
