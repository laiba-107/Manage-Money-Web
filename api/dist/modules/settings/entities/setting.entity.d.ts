import { User } from '../../users/entities/user.entity';
export declare class Setting {
    id: string;
    userId: string;
    key: string;
    value: any;
    createdAt: Date;
    updatedAt: Date;
    user: User;
}
