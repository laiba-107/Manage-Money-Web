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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("./entities/user.entity");
let UsersService = class UsersService {
    constructor(userRepository) {
        this.userRepository = userRepository;
    }
    async findById(id) {
        return this.userRepository.findOne({ where: { id } });
    }
    async findByEmail(email) {
        return this.userRepository.findOne({ where: { email } });
    }
    async findByEmailWithPassword(email) {
        return this.userRepository.findOne({
            where: { email },
            select: ['id', 'email', 'password', 'displayName', 'firstName', 'lastName', 'photoUrl', 'isActive', 'currency', 'theme'],
        });
    }
    async createWithPassword(email, hashedPassword, displayName) {
        const existing = await this.findByEmail(email);
        if (existing) {
            throw new common_1.ConflictException('An account with this email already exists.');
        }
        const user = this.userRepository.create({
            email,
            password: hashedPassword,
            displayName,
            isEmailVerified: true,
            currency: 'USD',
            theme: 'light',
        });
        return this.userRepository.save(user);
    }
    async findOrCreateDemoUser() {
        const demoEmail = 'demo@managemoney.com';
        let user = await this.findByEmail(demoEmail);
        if (!user) {
            user = this.userRepository.create({
                email: demoEmail,
                displayName: 'Demo User',
                firstName: 'Demo',
                lastName: 'User',
                isEmailVerified: true,
                currency: 'USD',
                theme: 'light',
            });
            user = await this.userRepository.save(user);
        }
        return user;
    }
    async update(userId, dto) {
        const user = await this.findById(userId);
        if (!user)
            throw new common_1.NotFoundException('User not found');
        Object.assign(user, dto);
        return this.userRepository.save(user);
    }
    async updateLastLogin(userId) {
        await this.userRepository.update(userId, { lastLoginAt: new Date() });
    }
    async updateRefreshToken(userId, token) {
        await this.userRepository.update(userId, { refreshToken: token });
    }
    async deactivate(userId) {
        await this.userRepository.update(userId, { isActive: false });
    }
    async delete(userId) {
        const user = await this.findById(userId);
        if (!user)
            throw new common_1.NotFoundException('User not found');
        await this.userRepository.remove(user);
    }
    async updateCurrency(userId, currency) {
        const user = await this.findById(userId);
        if (!user)
            throw new common_1.NotFoundException('User not found');
        user.currency = currency;
        return this.userRepository.save(user);
    }
    async updateTheme(userId, theme) {
        const user = await this.findById(userId);
        if (!user)
            throw new common_1.NotFoundException('User not found');
        user.theme = theme;
        return this.userRepository.save(user);
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], UsersService);
//# sourceMappingURL=users.service.js.map