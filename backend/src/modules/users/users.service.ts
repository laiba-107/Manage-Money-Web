import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { GoogleUserData } from '../auth/auth.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { googleId } });
  }

  async createFromGoogle(data: GoogleUserData): Promise<User> {
    const user = this.userRepository.create({
      googleId: data.googleId,
      email: data.email,
      displayName: data.displayName,
      firstName: data.firstName,
      lastName: data.lastName,
      photoUrl: data.photoUrl,
      isEmailVerified: data.isEmailVerified ?? true,
    });
    return this.userRepository.save(user);
  }

  async linkGoogleAccount(userId: string, data: GoogleUserData): Promise<User> {
    const user = await this.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    user.googleId = data.googleId;
    user.photoUrl = data.photoUrl || user.photoUrl;
    user.isEmailVerified = true;
    return this.userRepository.save(user);
  }

  async update(userId: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    Object.assign(user, dto);
    return this.userRepository.save(user);
  }

  async updateLastLogin(userId: string): Promise<void> {
    await this.userRepository.update(userId, { lastLoginAt: new Date() });
  }

  async updateRefreshToken(
    userId: string,
    token: string | null,
  ): Promise<void> {
    await this.userRepository.update(userId, { refreshToken: token });
  }

  async deactivate(userId: string): Promise<void> {
    await this.userRepository.update(userId, { isActive: false });
  }

  async delete(userId: string): Promise<void> {
    const user = await this.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    await this.userRepository.remove(user);
  }

  async updateCurrency(userId: string, currency: string): Promise<User> {
    const user = await this.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    user.currency = currency;
    return this.userRepository.save(user);
  }

  async updateTheme(userId: string, theme: string): Promise<User> {
    const user = await this.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    user.theme = theme;
    return this.userRepository.save(user);
  }
}
