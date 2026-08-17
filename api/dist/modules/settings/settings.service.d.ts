import { Repository } from 'typeorm';
import { Setting } from './entities/setting.entity';
import { UsersService } from '../users/users.service';
export declare class SettingsService {
    private settingRepository;
    private usersService;
    constructor(settingRepository: Repository<Setting>, usersService: UsersService);
    getAll(userId: string): Promise<Record<string, any>>;
    update(userId: string, key: string, value: any): Promise<void>;
    updateMany(userId: string, updates: Record<string, any>): Promise<void>;
}
