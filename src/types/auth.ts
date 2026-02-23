export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: 'student' | 'teacher' | 'admin' | 'super_admin';
    preferredLanguage: string;
    status: string;
    phone?: string;
    avatarUrl?: string;
    bio?: string;
    metadata?: Record<string, any>;
}

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    tokenType: string;
}

export interface AuthResponse {
    user: User;
    tokens: AuthTokens;
}

export interface LoginResponse extends AuthResponse { }
export interface RegisterResponse extends AuthResponse { }
