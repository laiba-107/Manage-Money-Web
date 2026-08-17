import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
export declare class UsersController {
    private usersService;
    constructor(usersService: UsersService);
    getProfile(user: User): Promise<{
        data: User;
        message: string;
    }>;
    updateProfile(user: User, dto: UpdateUserDto): Promise<{
        data: User;
        message: string;
    }>;
    deleteAccount(user: User): Promise<void>;
}
