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
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const firebase_service_1 = require("../../firebase/firebase.service");
const uuid_1 = require("uuid");
let NotificationsService = class NotificationsService {
    constructor(firebase) {
        this.firebase = firebase;
    }
    col() {
        return this.firebase.collection('notifications');
    }
    docToNotification(id, data) {
        return {
            id,
            userId: data.userId,
            title: data.title,
            body: data.body,
            type: data.type,
            data: data.data,
            isRead: data.isRead ?? false,
            createdAt: data.createdAt?.toDate?.() ?? new Date(),
        };
    }
    async create(userId, title, body, type, data) {
        const id = (0, uuid_1.v4)();
        const now = new Date();
        const notification = { id, userId, title, body, type, data, isRead: false, createdAt: now };
        await this.col().doc(id).set(notification);
        return notification;
    }
    async findAll(userId, unreadOnly = false) {
        let q = this.col().where('userId', '==', userId);
        if (unreadOnly)
            q = q.where('isRead', '==', false);
        const snap = await q.get();
        const data = snap.docs
            .map((d) => this.docToNotification(d.id, d.data()))
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .slice(0, 50);
        const unreadSnap = await this.col()
            .where('userId', '==', userId)
            .where('isRead', '==', false)
            .get();
        return { data, total: data.length, unreadCount: unreadSnap.size };
    }
    async markAsRead(userId, id) {
        const doc = await this.col().doc(id).get();
        if (doc.exists && doc.data().userId === userId) {
            await this.col().doc(id).update({ isRead: true });
        }
    }
    async markAllAsRead(userId) {
        const snap = await this.col()
            .where('userId', '==', userId)
            .where('isRead', '==', false)
            .get();
        if (snap.empty)
            return;
        const batch = this.firebase.firestore().batch();
        snap.docs.forEach((d) => batch.update(d.ref, { isRead: true }));
        await batch.commit();
    }
    async delete(userId, id) {
        const doc = await this.col().doc(id).get();
        if (doc.exists && doc.data().userId === userId) {
            await this.col().doc(id).delete();
        }
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [firebase_service_1.FirebaseService])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map