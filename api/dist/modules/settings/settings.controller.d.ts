import { SettingsService } from './settings.service';
import { User } from '../users/entities/user.entity';
export declare class SettingsController {
    private settingsService;
    constructor(settingsService: SettingsService);
    getAll(user: User): Promise<{
        data: Record<string, any>;
        message: string;
    }>;
    updateMany(user: User, updates: Record<string, any>): Promise<{
        data: Record<string, any>;
        message: string;
    }>;
}
