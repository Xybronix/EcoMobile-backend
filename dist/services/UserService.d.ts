import { User, UserRole, Prisma } from '@prisma/client';
type UserWithRelations = Prisma.UserGetPayload<{
    include: {
        wallet: true;
        roleRelation: true;
    };
}>;
export interface CreateUserDto {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    password: string;
    roleId?: string;
    role?: UserRole;
    isActive?: boolean;
}
export interface UpdateUserDto {
    firstName?: string;
    lastName?: string;
    phone?: string;
    email?: string;
    roleId?: string;
    role?: UserRole;
    isActive?: boolean;
}
export interface UpdatePasswordDto {
    currentPassword: string;
    newPassword: string;
}
export declare class UserService {
    /**
     * Get user by ID
     */
    getUserById(id: string): Promise<UserWithRelations | null>;
    /**
     * Get user by email
     */
    getUserByEmail(email: string): Promise<User | null>;
    /**
     * Get all users (admin)
     */
    getAllUsers(page?: number, limit?: number, role?: UserRole): Promise<{
        users: {
            role: string;
            roleId: string | null;
            wallet: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                balance: number;
            } | null;
            _count: {
                rides: number;
            };
            roleRelation: {
                name: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                description: string | null;
                isDefault: boolean;
            } | null;
            email: string;
            id: string;
            firstName: string;
            lastName: string;
            phone: string | null;
            address: string | null;
            avatar: string | null;
            status: string;
            isActive: boolean;
            emailVerified: boolean;
            language: string;
            createdAt: Date;
            updatedAt: Date;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    /**
     * Create new user (admin)
     */
    createUser(data: CreateUserDto): Promise<UserWithRelations>;
    /**
     * Update user (admin)
     */
    updateUser(userId: string, data: UpdateUserDto): Promise<UserWithRelations>;
    /**
     * Update user profile
     */
    updateProfile(userId: string, data: UpdateUserDto): Promise<User>;
    /**
     * Update user password
     */
    updatePassword(userId: string, data: UpdatePasswordDto): Promise<void>;
    /**
     * Update user role (admin only)
     */
    updateUserRole(userId: string, roleId: string): Promise<UserWithRelations>;
    /**
     * Activate/Deactivate user (admin only)
     */
    toggleUserStatus(userId: string, isActive: boolean): Promise<User>;
    /**
     * Delete user (admin only)
     */
    deleteUser(userId: string): Promise<void>;
    /**
     * Get user statistics
     */
    getUserStats(userId: string): Promise<{
        user: {
            password: undefined;
            wallet: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                balance: number;
            } | null;
            email: string;
            id: string;
            firstName: string;
            lastName: string;
            phone: string | null;
            address: string | null;
            avatar: string | null;
            role: import(".prisma/client").$Enums.UserRole;
            status: string;
            isActive: boolean;
            emailVerified: boolean;
            language: string;
            createdAt: Date;
            updatedAt: Date;
            roleId: string | null;
        } | null;
        rides: {
            total: number;
            totalDistance: number;
            totalCost: number;
            totalDuration: number;
        };
        wallet: {
            balance: number;
            totalTransacted: number;
        };
    }>;
    /**
     * Search users (admin)
     */
    searchUsers(query: string, page?: number, limit?: number): Promise<{
        users: {
            role: string;
            roleId: string | null;
            wallet: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                balance: number;
            } | null;
            roleRelation: {
                name: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                description: string | null;
                isDefault: boolean;
            } | null;
            email: string;
            id: string;
            firstName: string;
            lastName: string;
            phone: string | null;
            address: string | null;
            avatar: string | null;
            status: string;
            isActive: boolean;
            emailVerified: boolean;
            language: string;
            createdAt: Date;
            updatedAt: Date;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    /**
     * Get user notifications
     */
    getUserNotifications(userId: string, page?: number, limit?: number): Promise<{
        notifications: {
            id: string;
            createdAt: Date;
            userId: string;
            title: string;
            message: string;
            type: string;
            isRead: boolean;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    /**
     * Mark notification as read
     */
    markNotificationAsRead(notificationId: string, userId: string): Promise<void>;
    /**
     * Mark all notifications as read
     */
    markAllNotificationsAsRead(userId: string): Promise<void>;
    /**
     * Get unread notifications count
     */
    getUnreadNotificationsCount(userId: string): Promise<number>;
}
declare const _default: UserService;
export default _default;
//# sourceMappingURL=UserService.d.ts.map