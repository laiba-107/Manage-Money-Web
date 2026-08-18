import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { FirebaseService } from '../../firebase/firebase.service';
import { User } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UsersService {
  constructor(private readonly firebase: FirebaseService) {}

  private col() {
    return this.firebase.collection('users');
  }

  private docToUser(id: string, data: FirebaseFirestore.DocumentData): User {
    return {
      id,
      email: data.email,
      password: data.password,
      displayName: data.displayName,
      firstName: data.firstName,
      lastName: data.lastName,
      photoUrl: data.photoUrl,
      refreshToken: data.refreshToken,
      isActive: data.isActive ?? true,
      isEmailVerified: data.isEmailVerified ?? false,
      lastLoginAt: data.lastLoginAt?.toDate?.() ?? null,
      timezone: data.timezone,
      currency: data.currency ?? 'USD',
      theme: data.theme ?? 'light',
      biometricEnabled: data.biometricEnabled,
      createdAt: data.createdAt?.toDate?.() ?? new Date(),
      updatedAt: data.updatedAt?.toDate?.() ?? new Date(),
    };
  }

  async findById(id: string): Promise<User | null> {
    const doc = await this.col().doc(id).get();
    if (!doc.exists) return null;
    return this.docToUser(doc.id, doc.data()!);
  }

  async findByEmail(email: string): Promise<User | null> {
    const snap = await this.col()
      .where('email', '==', email)
      .limit(1)
      .get();
    if (snap.empty) return null;
    const doc = snap.docs[0];
    return this.docToUser(doc.id, doc.data());
  }

  async findByEmailWithPassword(email: string): Promise<User | null> {
    // Firestore doesn't have field-level visibility; we return the full user including password
    return this.findByEmail(email);
  }

  async createWithPassword(
    email: string,
    hashedPassword: string,
    displayName: string,
  ): Promise<User> {
    const existing = await this.findByEmail(email);
    if (existing) {
      throw new ConflictException('An account with this email already exists.');
    }

    const id = uuidv4();
    const now = new Date();
    const user: User = {
      id,
      email,
      password: hashedPassword,
      displayName,
      isEmailVerified: true,
      isActive: true,
      currency: 'USD',
      theme: 'light',
      createdAt: now,
      updatedAt: now,
    };

    await this.col().doc(id).set({
      ...user,
      createdAt: now,
      updatedAt: now,
    });

    return user;
  }

  async update(userId: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const updates = { ...dto, updatedAt: new Date() };
    await this.col().doc(userId).update(updates);
    return { ...user, ...updates };
  }

  async updateLastLogin(userId: string): Promise<void> {
    await this.col().doc(userId).update({ lastLoginAt: new Date() });
  }

  async updateRefreshToken(userId: string, token: string | null): Promise<void> {
    await this.col().doc(userId).update({ refreshToken: token });
  }

  async deactivate(userId: string): Promise<void> {
    await this.col().doc(userId).update({ isActive: false });
  }

  async delete(userId: string): Promise<void> {
    const user = await this.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    await this.col().doc(userId).delete();
  }

  async updateCurrency(userId: string, currency: string): Promise<User> {
    const user = await this.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    await this.col().doc(userId).update({ currency, updatedAt: new Date() });
    return { ...user, currency };
  }

  async updateTheme(userId: string, theme: string): Promise<User> {
    const user = await this.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    await this.col().doc(userId).update({ theme, updatedAt: new Date() });
    return { ...user, theme };
  }
}
