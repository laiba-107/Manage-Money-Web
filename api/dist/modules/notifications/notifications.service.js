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
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const notification_entity_1 = require("./entities/notification.entity");
let NotificationsService = class NotificationsService {
    constructor(notificationRepository) {
        this.notificationRepository = notificationRepository;
    }
    async create(userId, title, body, type, data) {
        const notification = this.notificationRepository.create({
            userId, title, body, type, data,
        });
        return this.notificationRepository.save(notification);
    }
    async findAll(userId, unreadOnly = false) {
        const query = this.notificationRepository
            .createQueryBuilder('n')
            .where('n.userId = :userId', { userId })
            .orderBy('n.createdAt', 'DESC')
            .take(50);
        if (unreadOnly)
            query.andWhere('n.isRead = false');
        const [data, total] = await query.getManyAndCount();
        const unreadCount = await this.notificationRepository.count({
            where: { userId, isRead: false },
        });
        return { data, total, unreadCount };
    }
    async markAsRead(userId, id) {
        await this.notificationRepository.update({ id, userId }, { isRead: true });
    }
    async markAllAsRead(userId) {
        await this.notificationRepository.update({ userId, isRead: false }, { isRead: true });
    }
    async delete(userId, id) {
        await this.notificationRepository.delete({ id, userId });
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(notification_entity_1.Notification)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map