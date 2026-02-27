'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { User, LoginResponse, RegisterResponse, AuthTokens } from '@/types/auth';

interface AuthContextType {
    user: User | null;
    accessToken: string | null;
    loading: boolean;
    signIn: (email: string, password: string, remember?: boolean) => Promise<{ error: Error | null }>;
    requestOtp: (email: string) => Promise<{ error: Error | null }>;
    verifyOtp: (email: string, otpCode: string, remember?: boolean) => Promise<{ error: Error | null }>;
    signUp: (email: string, password: string, metadata?: { name?: string }) => Promise<{ error: Error | null }>;
    signOut: () => Promise<void>;
    updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        let token = null;
        try {
            // Check both localStorage (remember me) and sessionStorage (session only)
            token = localStorage.getItem('faiera_backend_token');
            let refreshToken = localStorage.getItem('faiera_refresh_token');
            let useLocalStorage = !!token;

            if (!token) {
                token = sessionStorage.getItem('faiera_backend_token');
                refreshToken = sessionStorage.getItem('faiera_refresh_token');
            }

            // Fallback: If no token in local/session storage, check the cookie.
            // This happens if a user closed the tab (clearing sessionStorage) but the cookie is still valid,
            // or during certain server-side auth flows.
            if (!token && typeof window !== 'undefined') {
                const match = document.cookie.match(new RegExp('(?:^|;\\s*)faiera_session=([^;]*)'));
                if (match) {
                    token = match[1];
                    console.log('Restored session from cookie');
                }
            }

            if (token) {
                api.setToken(token);

                // Heal the cookie immediately if it's out of sync with localStorage/sessionStorage
                if (typeof window !== 'undefined') {
                    const maxAge = useLocalStorage ? 604800 : 86400;
                    document.cookie = `faiera_session=${token}; path=/; max-age=${maxAge}`;
                }

                try {
                    // Try fetch profile with current token
                    const response = await api.get<{ data: User }>('/auth/me');
                    const userData = (response as any).data;
                    if (userData) {
                        setUser(userData);
                        setAccessToken(token);

                        // Update stored user
                        const storage = useLocalStorage ? localStorage : sessionStorage;
                        storage.setItem('faiera_user', JSON.stringify(userData));
                    }
                } catch (error: any) {
                    // If 401 and we have refresh token, try to refresh
                    if (error?.statusCode === 401 && refreshToken) {
                        console.log('Token expired, attempting refresh...');
                        try {
                            // Using the default api instance to call refresh endpoint manually since import might be tricky with defaults
                            // Note: We need a way to call refresh without the expired token causing issues, but refresh endpoint is usually public or uses body
                            // Checking api.ts, refreshToken function uses api.post.
                            const { refreshToken: refreshApi } = await import('@/lib/api');
                            const response = await refreshApi(refreshToken);

                            const newTokens = (response as any).data;
                            if (newTokens && newTokens.accessToken) {
                                console.log('Token refreshed successfully');
                                // Update state
                                setAccessToken(newTokens.accessToken);
                                api.setToken(newTokens.accessToken);

                                // Update storage
                                const storage = useLocalStorage ? localStorage : sessionStorage;
                                storage.setItem('faiera_backend_token', newTokens.accessToken);
                                if (newTokens.refreshToken) {
                                    storage.setItem('faiera_refresh_token', newTokens.refreshToken);
                                }

                                // Sync new token into cookies so Server Components (Next.js SSR) use the fresh token
                                const maxAge = useLocalStorage ? 604800 : 86400;
                                document.cookie = `faiera_session=${newTokens.accessToken}; path=/; max-age=${maxAge}`;

                                // Retry fetching profile
                                const userResponse = await api.get<{ data: User }>('/auth/me');
                                const userData = (userResponse as any).data;
                                if (userData) {
                                    setUser(userData);
                                    storage.setItem('faiera_user', JSON.stringify(userData));
                                }
                            } else {
                                throw new Error('Refresh failed');
                            }
                        } catch (refreshError) {
                            console.error('Session refresh failed:', refreshError);
                            throw refreshError; // Trigger logout
                        }
                    } else {
                        console.error('refresh token not found or invalid');
                        throw error;
                    }
                }
            } else {
                console.log('No token found in localStorage or sessionStorage');
            }
        } catch (error: any) {
            if (error?.statusCode === 401) {
                console.warn('Session expired, logging out.');
            } else {
                console.error('Auth check failed:', error);
            }
            console.log('Logging out due to auth check failure');
            logout(); // Clear invalid state immediately
        } finally {
            console.log('checkAuth finished. Token state is:', token ? 'SET' : 'EMPTY');
            setLoading(false);
        }
    };

    const signIn = async (email: string, password: string, remember: boolean = false) => {
        try {
            console.log('Attempting login for:', email);
            const response = await api.post<{ data: LoginResponse }>('/auth/login', { email, password });
            console.log('Login successful:', response);
            const { user, tokens } = response.data;

            handleLoginSuccess(user, tokens, remember);

            // Redirect based on role
            switch (user.role) {
                case 'admin':
                case 'super_admin':
                    router.push('/dashboard');
                    break;
                case 'teacher':
                    router.push('/teacher');
                    break;
                case 'student':
                default:
                    router.push('/student');
            }

            return { error: null };
        } catch (err: any) {
            console.error('Login error details:', err);
            return { error: new Error(err.message || 'Login failed') };
        }
    };

    const requestOtp = async (email: string) => {
        try {
            await api.post('/auth/request-otp', { email });
            return { error: null };
        } catch (err: any) {
            return { error: new Error(err.message || 'Failed to request OTP') };
        }
    };

    const verifyOtp = async (email: string, otpCode: string, remember: boolean = false) => {
        try {
            const response = await api.post<{ data: LoginResponse }>('/auth/verify-otp', { email, otpCode });
            const { user, tokens } = response.data;

            handleLoginSuccess(user, tokens, remember);

            // Redirect based on role
            switch (user.role) {
                case 'admin':
                case 'super_admin':
                    router.push('/dashboard');
                    break;
                case 'teacher':
                    router.push('/teacher');
                    break;
                case 'student':
                default:
                    router.push('/student');
            }

            return { error: null };
        } catch (err: any) {
            return { error: new Error(err.message || 'Invalid OTP') };
        }
    };

    const signUp = async (email: string, password: string, metadata?: { name?: string }) => {
        try {
            // Split name if provided
            const [firstName, ...lastNameParts] = (metadata?.name || '').split(' ');
            const lastName = lastNameParts.join(' ') || 'User';

            const response = await api.post<{ data: RegisterResponse }>('/auth/register', {
                email,
                password,
                firstName: firstName || 'New',
                lastName: lastName,
            });

            const { user, tokens } = response.data;

            // Auto-login after registration
            handleLoginSuccess(user, tokens, false);

            // Redirect to student dashboard (new users are always students)
            router.push('/student');
            return { error: null };
        } catch (err: any) {
            return { error: new Error(err.message || 'Registration failed') };
        }
    };

    const handleLoginSuccess = (user: User, tokens: AuthTokens, remember: boolean = false) => {
        setUser(user);
        setAccessToken(tokens.accessToken);
        api.setToken(tokens.accessToken);

        // Persist based on remember me preference
        const storage = remember ? localStorage : sessionStorage;
        storage.setItem('faiera_backend_token', tokens.accessToken);
        storage.setItem('faiera_refresh_token', tokens.refreshToken);
        storage.setItem('faiera_user', JSON.stringify(user));

        // Cookie for middleware (use shorter expiry if not remembering)
        const maxAge = remember ? 604800 : 86400; // 7 days vs 1 day
        document.cookie = `faiera_session=${tokens.accessToken}; path=/; max-age=${maxAge}`;
        document.cookie = `faiera_role=${user.role}; path=/; max-age=${maxAge}`;
    };

    const signOut = async () => {
        // Call backend logout to invalidate refresh tokens
        try {
            const refreshToken = localStorage.getItem('faiera_refresh_token') || sessionStorage.getItem('faiera_refresh_token');
            await api.post('/auth/logout', refreshToken ? { refreshToken } : undefined);
        } catch (err) {
            // Silently ignore logout API errors — still clear local state
            console.warn('Logout API call failed:', err);
        }

        logout();
        router.push('/login');
    };

    const logout = () => {
        setUser(null);
        setAccessToken(null);
        api.setToken(null);
        // Clear from both storages
        localStorage.removeItem('faiera_backend_token');
        localStorage.removeItem('faiera_refresh_token');
        localStorage.removeItem('faiera_user');
        sessionStorage.removeItem('faiera_backend_token');
        sessionStorage.removeItem('faiera_refresh_token');
        sessionStorage.removeItem('faiera_user');
        document.cookie = 'faiera_session=; path=/; max-age=0';
        document.cookie = 'faiera_role=; path=/; max-age=0';
    };

    const updateUser = (updatedUser: User) => {
        setUser(updatedUser);
        // Update in whichever storage the user is using
        if (localStorage.getItem('faiera_backend_token')) {
            localStorage.setItem('faiera_user', JSON.stringify(updatedUser));
        }
        if (sessionStorage.getItem('faiera_backend_token')) {
            sessionStorage.setItem('faiera_user', JSON.stringify(updatedUser));
        }
    };

    return (
        <AuthContext.Provider value={{ user, accessToken, loading, signIn, requestOtp, verifyOtp, signUp, signOut, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
