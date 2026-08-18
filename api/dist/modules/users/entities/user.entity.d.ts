export interface User {
    id: string;
    email: string;
    password?: string;
    displayName: string;
    firstName?: string;
    lastName?: string;
    photoUrl?: string;
    refreshToken?: string | null;
    isActive: boolean;
    isEmailVerified: boolean;
    lastLoginAt?: Date | null;
    timezone?: string;
    currency: string;
    theme: string;
    biometricEnabled?: boolean;
    createdAt: Date;
    updatedAt: Date;
}
