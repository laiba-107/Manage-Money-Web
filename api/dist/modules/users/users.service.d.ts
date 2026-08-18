import { FirebaseService } from '../../firebase/firebase.service';
import { User } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
export declare class UsersService {
    private readonly firebase;
    constructor(firebase: FirebaseService);
    private col;
    private docToUser;
    findById(id: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    findByEmailWithPassword(email: string): Promise<User | null>;
    createWithPassword(email: string, hashedPassword: string, displayName: string): Promise<User>;
    update(userId: string, dto: UpdateUserDto): Promise<User>;
    updateLastLogin(userId: string): Promise<void>;
    updateRefreshToken(userId: string, token: string | null): Promise<void>;
    deactivate(userId: string): Promise<void>;
    delete(userId: string): Promise<void>;
    updateCurrency(userId: string, currency: string): Promise<User>;
    updateTheme(userId: string, theme: string): Promise<User>;
}
