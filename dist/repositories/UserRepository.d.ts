import { BaseRepository } from './BaseRepository';
import { User } from '../models/types';
export declare class UserRepository extends BaseRepository<User> {
    constructor();
    findByEmail(email: string): Promise<User | null>;
    findByRole(role: string): Promise<User[]>;
    updatePassword(userId: string, hashedPassword: string): Promise<void>;
    update(userId: string, data: {
        email?: string;
        firstName?: string;
        lastName?: string;
        phone?: string;
        address?: string;
    }): Promise<User>;
    verifyEmail(userId: string): Promise<void>;
    updateStatus(userId: string, status: 'active' | 'inactive' | 'suspended'): Promise<void>;
}
//# sourceMappingURL=UserRepository.d.ts.map