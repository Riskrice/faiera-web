'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { trackEvent } from '@/lib/gtm';
import { User, LoginResponse, RegisterResponse, AuthTokens } from '@/types/auth';
import { isAcademicProfileComplete } from '@/lib/academic-profile';

interface AuthContextType {
    user: User | null;
    accessToken: string | null;
    loading: boolean;
    signIn: (email: string, password: string, remember?: boolean) => Promise<{ error: Error | null }>;
    isAcademicOnboardingRequired: boolean;
    requestOtp: (email: string) => Promise<{ error: Error | null }>;
    verifyOtp: (email: string, otpCode: string, remember?: boolean, isRegistering?: boolean) => Promise<{ error: Error | null }>;
    signUp: (email: string, password: string, metadata?: { name?: string; phone?: string }) => Promise<{ error: Error | null }>;
    signOut: () => Promise<void>;
    updateUser: (user: User) => void;
}

interface RefreshTokenResponse {
    data?: Partial<AuthTokens>;
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
    return typeof value === 'object' && value !== null;
};

const getErrorStatusCode = (error: unknown): number | undefined => {
    if (!isRecord(error)) return undefined;
    const rawStatusCode = error.statusCode;
    return typeof rawStatusCode === 'number' ? rawStatusCode : undefined;
};

const getErrorMessage = (error: unknown): string | undefined => {
    if (typeof error === 'string') {
        return error;
    }

    if (error instanceof Error) {
        return error.message;
    }

    if (!isRecord(error)) {
        return undefined;
    }

    const message = error.message;
    if (typeof message === 'string') {
        return message;
    }

    if (Array.isArray(message)) {
        const messages = message.filter((entry): entry is string => typeof entry === 'string');
        if (messages.length > 0) {
            return messages.join(' - ');
        }
    }

    const nestedError = error.error;
    if (isRecord(nestedError) && typeof nestedError.message === 'string') {
        return nestedError.message;
    }

    return undefined;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        checkAuth();
    }, []);

    useEffect(() => {
        if (loading || !user) return;

        const onboardingPath = '/student/onboarding';
        const needsAcademicOnboarding = user.role === 'student' && !isAcademicProfileComplete(user);

        if (needsAcademicOnboarding && pathname !== onboardingPath) {
            router.replace(onboardingPath);
            return;
        }
    }, [loading, pathname, router, user]);

    const getFriendlyAuthError = (err: unknown, fallbackMessage: string) => {
        const statusCode = getErrorStatusCode(err);
        const message = getErrorMessage(err);

        if (statusCode === 429 || /too many requests|throttlerexception/i.test(message || '')) {
            return 'تم تجاوز عدد المحاولات المسموح به مؤقتًا. انتظر دقيقة ثم حاول مرة أخرى.';
        }

        if (
            statusCode === 401 &&
            /invalid credentials|unauthorized|invalid email|invalid password/i.test(message || '')
        ) {
            return 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
        }

        return message || fallbackMessage;
    };

    const getTokenExpiry = (token: string) => {
        try {
            const [, payload] = token.split('.');
            if (!payload) return null;

            const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/');
            const paddedPayload = normalizedPayload.padEnd(Math.ceil(normalizedPayload.length / 4) * 4, '=');
            const parsedPayload = JSON.parse(atob(paddedPayload));

            return typeof parsedPayload.exp === 'number' ? parsedPayload.exp * 1000 : null;
        } catch {
            return null;
        }
    };

    const isTokenExpiredOrNearExpiry = (token: string, skewMs: number = 30000) => {
        const expiry = getTokenExpiry(token);
        return expiry !== null && expiry <= Date.now() + skewMs;
    };

    const persistTokens = (tokens: AuthTokens, storage: Storage, maxAge: number) => {
        setAccessToken(tokens.accessToken);
        api.setToken(tokens.accessToken);
        storage.setItem('faiera_backend_token', tokens.accessToken);

        if (tokens.refreshToken) {
            storage.setItem('faiera_refresh_token', tokens.refreshToken);
        }

        document.cookie = `faiera_session=${tokens.accessToken}; path=/; max-age=${maxAge}`;
    };

    const refreshSession = async (refreshToken: string, storage: Storage, maxAge: number) => {
        const { refreshToken: refreshApi } = await import('@/lib/api');
        const response = await refreshApi(refreshToken) as RefreshTokenResponse;
        const responseTokens = response.data;

        if (!responseTokens?.accessToken) {
            throw new Error('Refresh failed');
        }

        const newTokens: AuthTokens = {
            accessToken: responseTokens.accessToken,
            refreshToken: responseTokens.refreshToken ?? refreshToken,
            expiresIn: typeof responseTokens.expiresIn === 'number' ? responseTokens.expiresIn : 0,
            tokenType: typeof responseTokens.tokenType === 'string' ? responseTokens.tokenType : 'Bearer',
        };

        console.log('Token refreshed successfully');
        persistTokens(newTokens, storage, maxAge);
        return newTokens.accessToken;
    };

    const checkAuth = async () => {
        let token = null;
        try {
            // Check both localStorage (remember me) and sessionStorage (session only)
            token = localStorage.getItem('faiera_backend_token');
            let refreshToken = localStorage.getItem('faiera_refresh_token');
            const useLocalStorage = !!token;

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
                const storage = useLocalStorage ? localStorage : sessionStorage;
                const maxAge = useLocalStorage ? 604800 : 86400;

                if (refreshToken && isTokenExpiredOrNearExpiry(token)) {
                    console.log('Access token expired before profile fetch, attempting refresh...');
                    token = await refreshSession(refreshToken, storage, maxAge);
                    refreshToken = storage.getItem('faiera_refresh_token');
                }

                api.setToken(token);

                // Heal the cookie immediately if it's out of sync with localStorage/sessionStorage
                if (typeof window !== 'undefined') {
                    document.cookie = `faiera_session=${token}; path=/; max-age=${maxAge}`;
                }

                try {
                    // Try fetch profile with current token
                    const { data: userData } = await api.get<{ data: User }>('/auth/me');
                    if (userData) {
                        setUser(userData);
                        setAccessToken(token);

                        // Update stored user
                        storage.setItem('faiera_user', JSON.stringify(userData));
                    }
                } catch (error: unknown) {
                    // If 401 and we have refresh token, try to refresh
                    if (getErrorStatusCode(error) === 401 && refreshToken) {
                        console.log('Token expired, attempting refresh...');
                        try {
                            token = await refreshSession(refreshToken, storage, maxAge);

                            // Retry fetching profile
                            const { data: userData } = await api.get<{ data: User }>('/auth/me');
                            if (userData) {
                                setUser(userData);
                                storage.setItem('faiera_user', JSON.stringify(userData));
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
        } catch (error: unknown) {
            if (getErrorStatusCode(error) === 401) {
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
            trackEvent('login', {
                method: 'email_password',
                user_role: user.role,
            });

            if (user.role === 'student' && !isAcademicProfileComplete(user)) {
                router.push('/student/onboarding');
            } else {
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
            }

            return { error: null };
        } catch (err: unknown) {
            console.error('Login error details:', err);
            return { error: new Error(getFriendlyAuthError(err, 'Login failed')) };
        }
    };

    const requestOtp = async (email: string) => {
        try {
            await api.post('/auth/request-otp', { email });
            return { error: null };
        } catch (err: unknown) {
            return { error: new Error(getFriendlyAuthError(err, 'Failed to send verification code')) };
        }
    };

    const verifyOtp = async (email: string, otpCode: string, remember: boolean = false, isRegistering: boolean = false) => {
        try {
            const response = await api.post<{ data: LoginResponse }>('/auth/verify-otp', { email, otpCode });
            const { user, tokens } = response.data;

            handleLoginSuccess(user, tokens, remember);
            trackEvent('login', {
                method: 'email_otp',
                user_role: user.role,
            });

            if (user.role === 'student' && !isAcademicProfileComplete(user)) {
                router.push('/student/onboarding');
            } else if (isRegistering) {
                router.push('/welcome');
            } else {
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
            }

            return { error: null };
        } catch (err: unknown) {
            return { error: new Error(getFriendlyAuthError(err, 'Invalid verification code')) };
        }
    };

    const signUp = async (email: string, password: string, metadata?: { name?: string; phone?: string }) => {
        try {
            // Split name if provided
            const [firstName, ...lastNameParts] = (metadata?.name || '').split(' ');
            const lastName = lastNameParts.join(' ') || 'User';

            const response = await api.post<{ data: RegisterResponse }>('/auth/register', {
                email,
                password,
                firstName: firstName || 'New',
                lastName: lastName,
                ...(metadata?.phone && { phone: metadata.phone }),
            });

            trackEvent('sign_up', {
                method: 'email_password',
                user_role: response.data.user.role,
            });

            return { error: null };
        } catch (err: unknown) {
            return { error: new Error(getFriendlyAuthError(err, 'Registration failed')) };
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
        router.replace('/login');
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

    const isAcademicOnboardingRequired = user?.role === 'student' && !isAcademicProfileComplete(user);

    return (
        <AuthContext.Provider
            value={{
                user,
                accessToken,
                loading,
                isAcademicOnboardingRequired,
                signIn,
                requestOtp,
                verifyOtp,
                signUp,
                signOut,
                updateUser,
            }}
        >
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
