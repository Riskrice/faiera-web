const TOKEN_KEY = 'faiera_token';
const REFRESH_TOKEN_KEY = 'faiera_refresh_token';
const USER_KEY = 'faiera_user';

export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: 'student' | 'teacher' | 'admin';
    grade?: string;
    avatar?: string;
}

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}

// Token management
export const auth = {
    // Get access token
    getToken(): string | null {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem(TOKEN_KEY);
    },

    // Get refresh token
    getRefreshToken(): string | null {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem(REFRESH_TOKEN_KEY);
    },

    // Save tokens
    setTokens(tokens: AuthTokens): void {
        localStorage.setItem(TOKEN_KEY, tokens.accessToken);
        localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
    },

    // Get current user
    getUser(): User | null {
        if (typeof window === 'undefined') return null;
        const user = localStorage.getItem(USER_KEY);
        return user ? JSON.parse(user) : null;
    },

    // Save user
    setUser(user: User): void {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
    },

    // Clear all auth data
    clear(): void {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
    },

    // Check if logged in
    isLoggedIn(): boolean {
        return !!this.getToken();
    },

    // Check if user has role
    hasRole(role: User['role']): boolean {
        const user = this.getUser();
        return user?.role === role;
    },

    // Check if admin
    isAdmin(): boolean {
        return this.hasRole('admin');
    },
};

export default auth;
