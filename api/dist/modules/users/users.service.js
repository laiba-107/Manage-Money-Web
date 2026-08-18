"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const firebase_service_1 = require("../../firebase/firebase.service");
const uuid_1 = require("uuid");
let UsersService = class UsersService {
    constructor(firebase) {
        this.firebase = firebase;
    }
    col() {
        return this.firebase.collection('users');
    }
    docToUser(id, data) {
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
    async findById(id) {
        const doc = await this.col().doc(id).get();
        if (!doc.exists)
            return null;
        return this.docToUser(doc.id, doc.data());
    }
    async findByEmail(email) {
        const snap = await this.col()
            .where('email', '==', email)
            .limit(1)
            .get();
        if (snap.empty)
            return null;
        const doc = snap.docs[0];
        return this.docToUser(doc.id, doc.data());
    }
    async findByEmailWithPassword(email) {
        return this.findByEmail(email);
    }
    async createWithPassword(email, hashedPassword, displayName) {
        const existing = await this.findByEmail(email);
        if (existing) {
            throw new common_1.ConflictException('An account with this email already exists.');
        }
        const id = (0, uuid_1.v4)();
        const now = new Date();
        const user = {
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
    async update(userId, dto) {
        const user = await this.findById(userId);
        if (!user)
            throw new common_1.NotFoundException('User not found');
        const updates = { ...dto, updatedAt: new Date() };
        await this.col().doc(userId).update(updates);
        return { ...user, ...updates };
    }
    async updateLastLogin(userId) {
        await this.col().doc(userId).update({ lastLoginAt: new Date() });
    }
    async updateRefreshToken(userId, token) {
        await this.col().doc(userId).update({ refreshToken: token });
    }
    async deactivate(userId) {
        await this.col().doc(userId).update({ isActive: false });
    }
    async delete(userId) {
        const user = await this.findById(userId);
        if (!user)
            throw new common_1.NotFoundException('User not found');
        await this.col().doc(userId).delete();
    }
    async updateCurrency(userId, currency) {
        const user = await this.findById(userId);
        if (!user)
            throw new common_1.NotFoundException('User not found');
        await this.col().doc(userId).update({ currency, updatedAt: new Date() });
        return { ...user, currency };
    }
    async updateTheme(userId, theme) {
        const user = await this.findById(userId);
        if (!user)
            throw new common_1.NotFoundException('User not found');
        await this.col().doc(userId).update({ theme, updatedAt: new Date() });
        return { ...user, theme };
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [firebase_service_1.FirebaseService])
], UsersService);
//# sourceMappingURL=users.service.js.map