import { FirebaseService } from '../../firebase/firebase.service';
import { UsersService } from '../users/users.service';
export declare class SettingsService {
    private readonly firebase;
    private usersService;
    constructor(firebase: FirebaseService, usersService: UsersService);
    private col;
    getAll(userId: string): Promise<Record<string, any>>;
    update(userId: string, key: string, value: any): Promise<void>;
    updateMany(userId: string, updates: Record<string, any>): Promise<void>;
}
