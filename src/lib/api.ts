const DEFAULT_API_URL = 'https://api.faiera.com/api/v1';

function trimTrailingSlash(value: string): string {
    return value.replace(/\/+$/, '');
}

function ensureApiV1Path(pathname: string): string {
    const withLeadingSlash = pathname.startsWith('/') ? pathname : `/${pathname}`;
    const normalized = trimTrailingSlash(withLeadingSlash) || '/';

    if (normalized === '/') {
        return '/api/v1';
    }

    if (/\/api\/v1$/i.test(normalized)) {
        return normalized;
    }

    if (/\/api$/i.test(normalized)) {
        return `${normalized}/v1`;
    }

    return `${normalized}/api/v1`;
}

function normalizeApiBaseUrl(rawUrl: string): string {
    const candidate = rawUrl?.trim();
    if (!candidate) {
        return DEFAULT_API_URL;
    }

    if (/^https?:\/\//i.test(candidate)) {
        try {
            const parsed = new URL(candidate);
            parsed.pathname = ensureApiV1Path(parsed.pathname || '/');
            parsed.search = '';
            parsed.hash = '';
            return trimTrailingSlash(parsed.toString());
        } catch {
            return DEFAULT_API_URL;
        }
    }

    return ensureApiV1Path(candidate);
}

const API_URL = normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL);

interface RequestOptions extends RequestInit {
    token?: string;
    // Internal flag to track if this a retry attempt following a 401 refresh
    _isRetry?: boolean;
}

interface ApiError {
    message: string;
    statusCode: number;
}

import { AuthTokens, SecondaryYear, StudyPath, ScientificSpecialization } from '@/types/auth';

export class ApiRequestError extends Error {
    statusCode: number;

    constructor(message: string, statusCode: number) {
        super(message);
        this.name = 'ApiRequestError';
        this.statusCode = statusCode;
    }
}

class ApiClient {
    private baseUrl: string;
    private token: string | null = null;
    private refreshTokenPromise: Promise<string> | null = null;
    private readonly noAuthHeaderEndpoints = new Set([
        '/auth/login',
        '/auth/register',
        '/auth/request-otp',
        '/auth/verify-otp',
        '/auth/forgot-password',
        '/auth/reset-password',
        '/auth/refresh',
    ]);

    constructor(baseUrl: string) {
        if (typeof window === 'undefined' && baseUrl.startsWith('/')) {
            this.baseUrl = normalizeApiBaseUrl(process.env.INTERNAL_API_URL || DEFAULT_API_URL);
            return;
        }

        this.baseUrl = baseUrl;
    }

    private buildRequestUrl(baseUrl: string, endpoint: string): string {
        const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
        return `${baseUrl}${normalizedEndpoint}`;
    }

    private isDnsResolutionError(error: unknown): boolean {
        if (!(error instanceof TypeError)) {
            return false;
        }

        const message = (error.message || '').toLowerCase();
        return (
            message.includes('failed to fetch') ||
            message.includes('networkerror') ||
            message.includes('network request failed') ||
            message.includes('load failed') ||
            message.includes('err_name_not_resolved')
        );
    }

    private getSameOriginFallbackBaseUrl(): string | null {
        if (typeof window === 'undefined') {
            return null;
        }

        if (this.baseUrl.startsWith('/')) {
            return null;
        }

        try {
            const primaryOrigin = new URL(this.baseUrl, window.location.origin).origin;
            if (primaryOrigin === window.location.origin) {
                return null;
            }
        } catch {
            return null;
        }

        return '/api/v1';
    }

    private async fetchWithDnsFallback(endpoint: string, init: RequestInit): Promise<Response> {
        const primaryUrl = this.buildRequestUrl(this.baseUrl, endpoint);

        try {
            return await fetch(primaryUrl, init);
        } catch (error) {
            const fallbackBaseUrl = this.getSameOriginFallbackBaseUrl();
            if (!fallbackBaseUrl || !this.isDnsResolutionError(error)) {
                throw error;
            }

            const fallbackUrl = this.buildRequestUrl(fallbackBaseUrl, endpoint);
            console.warn(`[ApiClient] Request to ${primaryUrl} failed due to DNS/network issue. Retrying via ${fallbackUrl}.`);
            return fetch(fallbackUrl, init);
        }
    }

    private getCookieValue(name: string): string | null {
        if (typeof window === 'undefined') {
            return null;
        }

        const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
        return match?.[1] ?? null;
    }

    setToken(token: string | null) {
        this.token = token;
    }

    private normalizeEndpoint(endpoint: string): string {
        return endpoint.split('?')[0];
    }

    private isPublicAuthEndpoint(endpoint: string): boolean {
        return this.noAuthHeaderEndpoints.has(this.normalizeEndpoint(endpoint));
    }

    private getEffectiveToken(overrideToken?: string): string | null {
        if (overrideToken) return overrideToken;
        if (this.token) return this.token;

        // Fallback: read from storage (handles race conditions & page refresh)
        if (typeof window !== 'undefined') {
            const fromLocal = localStorage.getItem('faiera_backend_token');
            if (fromLocal) return fromLocal;
            const fromSession = sessionStorage.getItem('faiera_backend_token');
            if (fromSession) return fromSession;
            // Cookie fallback
            const match = document.cookie.match(/(?:^|;\s*)faiera_session=([^;]*)/);
            if (match?.[1]) return match[1];
        }
        return null;
    }

    private getTokenExpiry(token: string): number | null {
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
    }

    private isTokenExpiredOrNearExpiry(token: string, skewMs = 30000): boolean {
        const expiry = this.getTokenExpiry(token);
        return expiry !== null && expiry <= Date.now() + skewMs;
    }

    private async maybeRefreshTokenBeforeRequest(endpoint: string, token: string): Promise<string> {
        if (typeof window === 'undefined') {
            return token;
        }

        if (!this.isTokenExpiredOrNearExpiry(token)) {
            return token;
        }

        try {
            console.log(`[ApiClient] Access token near expiry before ${endpoint}, attempting pre-request refresh...`);
            const refreshedToken = await this.handleTokenRefresh();
            this.setToken(refreshedToken);
            return refreshedToken;
        } catch (error) {
            // Fall back to original token; existing 401 retry flow still applies.
            console.warn(`[ApiClient] Pre-request refresh failed for ${endpoint}, continuing with current token.`, error);
            return token;
        }
    }

    private getSessionSnapshot() {
        if (typeof window === 'undefined') {
            return null;
        }

        const localAccessToken = localStorage.getItem('faiera_backend_token');
        const localRefreshToken = localStorage.getItem('faiera_refresh_token');
        if (localAccessToken || localRefreshToken) {
            return {
                storage: localStorage,
                accessToken: localAccessToken,
                refreshToken: localRefreshToken,
                maxAge: 604800,
            };
        }

        const sessionAccessToken = sessionStorage.getItem('faiera_backend_token');
        const sessionRefreshToken = sessionStorage.getItem('faiera_refresh_token');
        if (sessionAccessToken || sessionRefreshToken) {
            return {
                storage: sessionStorage,
                accessToken: sessionAccessToken,
                refreshToken: sessionRefreshToken,
                maxAge: 86400,
            };
        }

        const cookieAccessToken = this.getCookieValue('faiera_session');
        const cookieRefreshToken = this.getCookieValue('faiera_refresh');
        if (cookieAccessToken || cookieRefreshToken) {
            return {
                storage: localStorage,
                accessToken: cookieAccessToken,
                refreshToken: cookieRefreshToken,
                maxAge: 604800,
            };
        }

        return null;
    }

    private tryRecoverFromConcurrentRefresh(previousRefreshToken: string | null): string | null {
        if (typeof window === 'undefined' || !previousRefreshToken) {
            return null;
        }

        const candidates = [
            {
                storage: localStorage,
                accessToken: localStorage.getItem('faiera_backend_token'),
                refreshToken: localStorage.getItem('faiera_refresh_token'),
                maxAge: 604800,
            },
            {
                storage: sessionStorage,
                accessToken: sessionStorage.getItem('faiera_backend_token'),
                refreshToken: sessionStorage.getItem('faiera_refresh_token'),
                maxAge: 86400,
            },
        ];

        const updatedSession = candidates.find(
            (candidate) =>
                !!candidate.accessToken &&
                !!candidate.refreshToken &&
                candidate.refreshToken !== previousRefreshToken,
        );

        if (!updatedSession?.accessToken) {
            return null;
        }

        console.warn('[ApiClient] Detected newer tokens from concurrent refresh, reusing latest session.');
        this.setToken(updatedSession.accessToken);
        document.cookie = `faiera_session=${updatedSession.accessToken}; path=/; max-age=${updatedSession.maxAge}; Secure; SameSite=Lax`;
        return updatedSession.accessToken;
    }

    private async handleTokenRefresh(): Promise<string> {
        if (this.refreshTokenPromise) {
            console.log('[ApiClient] Refresh already in progress, waiting...');
            return this.refreshTokenPromise;
        }

        this.refreshTokenPromise = (async () => {
            const sessionSnapshot = this.getSessionSnapshot();
            const refreshTokenAtStart = sessionSnapshot?.refreshToken || null;

            try {
                if (typeof window === 'undefined') {
                    throw new Error('Cannot refresh token outside of browser');
                }

                if (!refreshTokenAtStart) {
                    console.warn('[ApiClient] No refresh token found in storage');
                    throw new Error('No refresh token available');
                }

                console.log('[ApiClient] Attempting token refresh...');
                const response = await this.fetchWithDnsFallback('/auth/refresh', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refreshToken: refreshTokenAtStart }),
                });

                if (!response.ok) {
                    const recoveredToken = this.tryRecoverFromConcurrentRefresh(refreshTokenAtStart);
                    if (recoveredToken) {
                        return recoveredToken;
                    }

                    console.error('[ApiClient] Refresh request failed with status:', response.status);
                    throw new Error('Refresh token invalid or expired');
                }

                const result = await response.json();
                const newTokens = result.data as AuthTokens;

                if (!newTokens?.accessToken) {
                    console.error('[ApiClient] Invalid refresh response schema:', result);
                    throw new Error('Invalid refresh response');
                }

                const currentSession = this.getSessionSnapshot();
                const storage = currentSession?.storage || localStorage;
                const maxAge = currentSession?.maxAge || 604800;

                console.log('[ApiClient] Token refresh successful, updating storage');
                this.setToken(newTokens.accessToken);
                storage.setItem('faiera_backend_token', newTokens.accessToken);
                
                if (newTokens.refreshToken) {
                    storage.setItem('faiera_refresh_token', newTokens.refreshToken);
                    document.cookie = `faiera_refresh=${newTokens.refreshToken}; path=/; max-age=${maxAge}; Secure; SameSite=Lax`;
                }

                document.cookie = `faiera_session=${newTokens.accessToken}; path=/; max-age=${maxAge}; Secure; SameSite=Lax`;
                return newTokens.accessToken;
            } catch (error) {
                const recoveredToken = this.tryRecoverFromConcurrentRefresh(refreshTokenAtStart);
                if (recoveredToken) {
                    return recoveredToken;
                }

                console.error('[ApiClient] Token refresh failed critically:', error);
                if (this.isDnsResolutionError(error)) {
                    // Keep current session on transient network failures.
                    throw error;
                }

                // If refresh fails, clear everything to force a clean logout
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('faiera_backend_token');
                    localStorage.removeItem('faiera_refresh_token');
                    sessionStorage.removeItem('faiera_backend_token');
                    sessionStorage.removeItem('faiera_refresh_token');
                    document.cookie = 'faiera_session=; path=/; max-age=0; Secure; SameSite=Lax';
                    document.cookie = 'faiera_refresh=; path=/; max-age=0; Secure; SameSite=Lax';
                    this.setToken(null);
                }
                throw error;
            } finally {
                this.refreshTokenPromise = null;
            }
        })();

        return this.refreshTokenPromise;
    }

    async refreshAccessToken(): Promise<string> {
        return this.handleTokenRefresh();
    }

    private async request<T>(
        endpoint: string,
        options: RequestOptions = {}
    ): Promise<T> {
        const { token, ...fetchOptions } = options;

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...(options.headers as Record<string, string> || {}),
        };

        let effectiveToken = this.getEffectiveToken(token);
        let shouldAttachAuthHeader = !!effectiveToken && !this.isPublicAuthEndpoint(endpoint);
        if (shouldAttachAuthHeader && effectiveToken) {
            effectiveToken = await this.maybeRefreshTokenBeforeRequest(endpoint, effectiveToken);
            headers['Authorization'] = `Bearer ${effectiveToken}`;
        }

        let response: Response;
        try {
            response = await this.fetchWithDnsFallback(endpoint, {
                ...fetchOptions,
                headers,
            });
        } catch (error) {
            throw new ApiRequestError(error instanceof Error ? error.message : 'Network request failed', 0);
        }

        const shouldTryRefresh =
            response.status === 401 &&
            typeof window !== 'undefined' &&
            !options?._isRetry &&
            shouldAttachAuthHeader &&
            !this.isPublicAuthEndpoint(endpoint);

        if (shouldTryRefresh) {
            console.log(`[ApiClient] 401 Unauthorized for ${endpoint}, attempting auto-refresh...`);
            try {
                const newToken = await this.handleTokenRefresh();
                console.log(`[ApiClient] Refresh success, retrying ${endpoint}...`);
                
                // Retry with new token
                headers['Authorization'] = `Bearer ${newToken}`;
                try {
                    response = await this.fetchWithDnsFallback(endpoint, {
                        ...fetchOptions,
                        headers,
                    });
                } catch (error) {
                    throw new ApiRequestError(error instanceof Error ? error.message : 'Network request failed', 0);
                }

                if (response.ok) {
                    console.log(`[ApiClient] Retry for ${endpoint} successful`);
                } else {
                    console.warn(`[ApiClient] Retry for ${endpoint} failed with status:`, response.status);
                }
            } catch (refreshError) {
                console.warn(`[ApiClient] Auto-refresh failed during request for ${endpoint}:`, refreshError);
                // Let the original 401 or refresh error be processed below
            }
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({
                message: 'An error occurred',
            }));

            // Handle both standard NestJS errors and custom ApiResponse format
            const errorMessage = errorData.error?.message || errorData.message || 'Request failed';
            throw new ApiRequestError(errorMessage, response.status);
        }

        return response.json();
    }

    async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
        return this.request<T>(endpoint, { ...options, method: 'GET' });
    }

    async post<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
        return this.request<T>(endpoint, {
            ...options,
            method: 'POST',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    async put<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
        return this.request<T>(endpoint, {
            ...options,
            method: 'PUT',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    async patch<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
        return this.request<T>(endpoint, {
            ...options,
            method: 'PATCH',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
        return this.request<T>(endpoint, { ...options, method: 'DELETE' });
    }

    // Upload methods
    async uploadImage<T>(endpoint: string, file: File, onProgress?: (progress: number) => void, options?: RequestOptions): Promise<T> {
        const formData = new FormData();
        formData.append('file', file);

        // We need to use native fetch directly for uploads to avoid JSON stringification
        // and let the browser set the correct multipart/form-data boundary
        let effectiveToken = this.getEffectiveToken(options?.token);
        if (effectiveToken) {
            effectiveToken = await this.maybeRefreshTokenBeforeRequest(endpoint, effectiveToken);
        }
        const headers: HeadersInit = {};
        if (effectiveToken) {
            headers['Authorization'] = `Bearer ${effectiveToken}`;
        }

        let response: Response;
        try {
            response = await this.fetchWithDnsFallback(endpoint, {
                method: 'POST',
                headers,
                body: formData,
            });
        } catch (error) {
            throw new Error(error instanceof Error ? error.message : 'Network request failed');
        }

        if (response.status === 401 && typeof window !== 'undefined' && !options?._isRetry) {
            console.log(`[ApiClient] 401 Unauthorized for upload ${endpoint}, attempting auto-refresh...`);
            try {
                const newToken = await this.handleTokenRefresh();
                console.log(`[ApiClient] Refresh success, retrying upload ${endpoint}...`);
                const headersInit = headers as Record<string, string>;
                headersInit['Authorization'] = `Bearer ${newToken}`;
                response = await this.fetchWithDnsFallback(endpoint, {
                    method: 'POST',
                    headers: headersInit,
                    body: formData,
                });
            } catch (refreshError) {
                console.warn(`[ApiClient] Auto-refresh failed during uploadImage for ${endpoint}:`, refreshError);
            }
        }

        if (!response.ok) {
            let errorMessage = 'Upload failed';
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorMessage;
            } catch (e) {
                // Ignore parse error
            }
            throw new Error(errorMessage);
        }

        return response.json() as Promise<T>;
    }

    // File upload
    async upload<T>(endpoint: string, file: File, token?: string): Promise<T> {
        const formData = new FormData();
        formData.append('file', file);

        const headers: HeadersInit = {};
        let effectiveToken = this.getEffectiveToken(token);
        if (effectiveToken) {
            effectiveToken = await this.maybeRefreshTokenBeforeRequest(endpoint, effectiveToken);
        }
        if (effectiveToken) {
            headers['Authorization'] = `Bearer ${effectiveToken}`;
        }

        let response: Response;
        try {
            response = await this.fetchWithDnsFallback(endpoint, {
                method: 'POST',
                headers,
                body: formData,
            });
        } catch (error) {
            throw new Error(error instanceof Error ? error.message : 'Network request failed');
        }

        if (response.status === 401 && typeof window !== 'undefined') {
            console.log(`[ApiClient] 401 Unauthorized for upload ${endpoint}, attempting auto-refresh...`);
            try {
                const newToken = await this.handleTokenRefresh();
                console.log(`[ApiClient] Refresh success, retrying upload ${endpoint}...`);
                const headersInit = headers as Record<string, string>;
                headersInit['Authorization'] = `Bearer ${newToken}`;
                response = await this.fetchWithDnsFallback(endpoint, {
                    method: 'POST',
                    headers: headersInit,
                    body: formData,
                });
            } catch (refreshError) {
                console.warn(`[ApiClient] Auto-refresh failed during upload for ${endpoint}:`, refreshError);
            }
        }

        if (!response.ok) {
            const error = await response.json().catch(() => ({
                message: 'Upload failed',
            }));
            throw new Error(error.message);
        }

        return response.json();
    }
}

export const api = new ApiClient(API_URL);
export default api;

// ... imports

export interface Lesson {
    id: string;
    titleAr: string;
    titleEn: string;
    descriptionAr?: string;
    descriptionEn?: string;
    moduleId: string;
    type: string; // video, article, quiz
    status: string;
    durationMinutes: number;
    isFree: boolean;
    sortOrder: number;
}

export interface Module {
    id: string;
    titleAr: string;
    titleEn: string;
    descriptionAr?: string;
    descriptionEn?: string;
    courseId: string;
    sortOrder: number;
    isPublished: boolean;
    lessons: Lesson[];
}

export interface Course {
    id: string;
    titleAr: string;
    titleEn: string;
    descriptionAr?: string;
    descriptionEn?: string;
    thumbnailUrl?: string;
    status: string;
    author?: any; // Define proper type if known
    rating?: number;
    price?: number;
    currency?: string;
    lessonsCount?: number;
    totalDurationMinutes?: number;
    category?: string;
    level?: string;
    programId?: string;
    modules?: Module[];
}

export type CourseStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export async function getCourses(params?: { limit?: number; sort?: string; search?: string; category?: string; level?: string; teacherId?: string }) {
    // Should map params to query string
    const query = new URLSearchParams();
    if (params?.limit) {
        // Backend validation allows up to 100 only.
        const safeLimit = Math.min(Math.max(params.limit, 1), 100);
        query.append('pageSize', safeLimit.toString()); // Map limit to pageSize
    }
    if (params?.search) query.append('search', params.search);
    if (params?.category) query.append('category', params.category);
    if (params?.level) query.append('level', params.level);
    if (params?.teacherId) query.append('teacherId', params.teacherId);
    // Add other params as needed

    // Using the generic get method
    return api.get<{ data: Course[], meta: any }>(`/content/courses?${query.toString()}`);
}

export async function getCourseById(id: string, token?: string) {
    // Log removed for security
    return api.get<{ data: Course }>(`/content/courses/${id}?includeModules=true`, {
        token,
        cache: 'no-store'
    });
}

export async function getStreamUrl(lessonId: string) {
    return api.get<{ data: { url: string; token: string } }>(`/content/lessons/${lessonId}/stream-url`);
}

export async function checkEnrollment(courseId: string, token?: string) {
    return api.get<{ data: { enrolled: boolean } }>(`/content/enrollments/check/${courseId}`, { token });
}

export async function enrollFreeCourse(courseId: string, token?: string) {
    return api.post<{ data: any }>(`/content/enrollments/free/${courseId}`, {}, { token });
}

export async function getStudentStats() {
    return api.get<{
        data: {
            completedCourses: number;
            hoursLearned: number;
            activeCourses: number;
            streakDays: number;
        }
    }>('/progress/my/stats');
}

export async function getStudentProgress(limit = 1) {
    return api.get<{ data: any[] }>(`/progress/my?limit=${limit}`);
}

export async function getStudentActivity() {
    return api.get<{ data: { name: string; hours: number }[] }>('/progress/my/activity');
}

export async function updateProgress(data: {
    contentType: 'lesson' | 'course' | 'video' | 'assessment';
    contentId: string;
    progressPercent: number;
    timeSpent?: number;
    metadata?: any;
}, token?: string) {
    return api.post(`/progress/update`, data, { token });
}

export async function updateProfile(data: any) {
    return api.put<{ data: any }>('/users/me', data);
}

export interface UpdateAcademicProfilePayload {
    secondaryYear: SecondaryYear;
    studyPath: StudyPath;
    scientificSpecialization?: ScientificSpecialization;
}

export async function updateAcademicProfile(data: UpdateAcademicProfilePayload) {
    return api.put<{ data: any }>('/users/me/academic-profile', data);
}

export async function uploadAvatar(file: File) {
    return api.upload<{ id: string; url: string }>('/upload/image', file);
}

export async function changePassword(data: any) {
    return api.post<any>('/auth/change-password', data);
}

export async function updateTeacherProfile(data: any) {
    return api.put<{ data: any }>('/teachers/profile', data);
}

export async function updateNotificationPreferences(data: any) {
    return api.put<{ data: any }>('/notifications/preferences', data);
}

export async function refreshToken(token: string) {
    return api.post<{ data: { accessToken: string; refreshToken: string; expiresIn: number; tokenType: string } }>('/auth/refresh', { refreshToken: token });
}

export async function forgotPassword(email: string) {
    return api.post<{ data: null }>('/auth/forgot-password', { email });
}

export async function resetPassword(token: string, newPassword: string) {
    return api.post<{ data: null }>('/auth/reset-password', { token, newPassword });
}


export interface Notification {
    id: string;
    type: string;
    titleAr: string;
    titleEn: string;
    bodyAr: string;
    bodyEn: string;
    readAt?: string;
    createdAt: string;
    data?: any;
    actionUrl?: string;
}

export async function getNotifications(page = 1, limit = 20) {
    return api.get<{ data: Notification[], meta: any, unreadCount: number }>(`/notifications?page=${page}&pageSize=${limit}`);
}

export async function getUnreadNotificationsCount() {
    return api.get<{ data: { count: number } }>('/notifications/unread-count');
}

export async function markNotificationAsRead(id: string) {
    return api.post<{ data: Notification }>(`/notifications/${id}/read`);
}

export async function markAllNotificationsAsRead() {
    return api.post<{ data: { count: number } }>('/notifications/read-all');
}

export async function getNotificationPreferences() {
    return api.get<{ data: any }>('/notifications/preferences');
}

export enum DayOfWeek {
    SUNDAY = 0,
    MONDAY = 1,
    TUESDAY = 2,
    WEDNESDAY = 3,
    THURSDAY = 4,
    FRIDAY = 5,
    SATURDAY = 6,
}

export interface TeacherAvailability {
    id: string;
    teacherId: string;
    dayOfWeek: DayOfWeek;
    startTime: string; // HH:mm:ss
    endTime: string; // HH:mm:ss
    isRecurring: boolean;
    isActive: boolean;
}

export async function getTeacherAvailability(teacherId: string) {
    return api.get<{ data: TeacherAvailability[] }>(`/teachers/${teacherId}/availability`);
}

export async function setTeacherAvailability(slots: { dayOfWeek: DayOfWeek; startTime: string; endTime: string }[]) {
    return api.post<{ data: TeacherAvailability[] }>('/teachers/availability', slots);
}

// Assessments API

export enum AssessmentType {
    QUIZ = 'quiz',
    EXAM = 'exam',
    HOMEWORK = 'homework',
    PRACTICE = 'practice',
    DIAGNOSTIC = 'diagnostic',
}

export enum AssessmentStatus {
    DRAFT = 'draft',
    PUBLISHED = 'published',
    CLOSED = 'closed',
    ARCHIVED = 'archived',
}

export enum ShuffleMode {
    NONE = 'none',
    QUESTIONS = 'questions',
    OPTIONS = 'options',
    BOTH = 'both',
}

export interface Assessment {
    id: string;
    titleAr: string;
    titleEn: string;
    descriptionAr?: string;
    descriptionEn?: string;
    instructionsAr?: string;
    instructionsEn?: string;
    type: AssessmentType;
    status: AssessmentStatus;
    grade: string;
    subject: string;
    timeLimitMinutes?: number;
    startDate?: string;
    endDate?: string;
    maxAttempts: number;
    allowRetake: boolean;
    passingScore: number;
    totalPoints: number;
    shuffleMode: ShuffleMode;
    showScoreImmediately: boolean;
    showCorrectAnswers: boolean;
    showExplanations: boolean;
    assessmentQuestions: AssessmentQuestion[];
}

export interface AssessmentQuestion {
    id: string; // The link ID, not the question ID
    questionId: string;
    assessmentId: string;
    sortOrder: number;
    overridePoints?: number;
    question: Question;
}

export interface Question {
    id: string;
    text?: string;       // Optional, legacy or mapped
    questionAr?: string; // Backend field
    questionEn?: string; // Backend field
    type: string;
    points: number;
    answerData?: any; // Contains options for MCQs, etc.
    // Add other fields as needed
    difficulty?: string;
    taxonomy?: string;
    tags?: string[];
    subject?: string;
    grade?: string;
    status?: string;
}

export async function getQuestions(params?: { search?: string; subject?: string; grade?: string; page?: number; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.subject && params.subject !== 'all') query.append('subject', params.subject);
    if (params?.grade && params.grade !== 'all') query.append('grade', params.grade);
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('pageSize', params.limit.toString());

    return api.get<{ data: Question[], meta: any }>(`/questions?${query.toString()}`);
}

// Assessments
export async function getAssessments() {
    return api.get<{ data: Assessment[] }>('/assessments')
}

export async function getPublishedAssessments(grade?: string, subject?: string) {
    const params = new URLSearchParams();
    if (grade) params.set('grade', grade);
    if (subject) params.set('subject', subject);
    const qs = params.toString();
    return api.get<{ data: Assessment[] }>(`/assessments/published${qs ? '?' + qs : ''}`);
}

export async function getAssessment(id: string) {
    return api.get<{ data: Assessment }>(`/assessments/${id}`)
}

export async function createAssessment(data: Partial<Assessment>) {
    return api.post<{ data: Assessment }>('/assessments', data)
}

export async function updateAssessment(id: string, data: Partial<Assessment>) {
    return api.put<{ data: Assessment }>(`/assessments/${id}`, data)
}

export async function deleteAssessment(id: string) {
    return api.delete<{ success: boolean }>(`/assessments/${id}`)
}

export async function addQuestionsToAssessment(id: string, questionIds: string[]) {
    return api.post(`/assessments/${id}/questions`, { questionIds });
}

export async function removeQuestionFromAssessment(id: string, questionId: string) {
    return api.delete(`/assessments/${id}/questions/${questionId}`);
}

export async function reorderAssessmentQuestions(id: string, questionIds: string[]) {
    return api.patch(`/assessments/${id}/questions/reorder`, { questionIds });
}

export async function publishAssessment(id: string) {
    return api.patch<{ data: Assessment }>(`/assessments/${id}/publish`);
}

// Attempts API
export interface AssessmentAttempt {
    id: string;
    assessmentId: string;
    userId: string;
    startedAt: string;
    completedAt?: string;
    score?: number;
    status: 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED';
    answers?: AttemptAnswer[];
}

export interface AttemptAnswer {
    questionId: string;
    answerText?: string; // For text/code
    selectedOptionIds?: string[]; // For MCQ
    isCorrect?: boolean;
    pointsAwarded?: number;
}

export async function startAttempt(assessmentId: string) {
    return api.post<{ data: AssessmentAttempt }>('/attempts/start', { assessmentId });
}

export async function getAttempt(id: string) {
    return api.get<{ data: { attempt: AssessmentAttempt; questions: Question[] } }>(`/attempts/${id}`);
}

export async function saveAnswer(attemptId: string, questionId: string, answer: { answerText?: string, selectedOptionIds?: string[] }) {
    return api.post(`/attempts/${attemptId}/answers`, { questionId, ...answer });
}

export async function submitAttempt(attemptId: string) {
    return api.post<{ data: any }>(`/attempts/${attemptId}/submit`);
}

export async function getUserAttempts(assessmentId?: string) {
    const query = assessmentId ? `?assessmentId=${assessmentId}` : '';
    return api.get<{ data: AssessmentAttempt[] }>(`/attempts/my/history${query}`);
}

export async function getAssessmentAttempts(assessmentId: string) {
    return api.get<{ data: AssessmentAttempt[] }>(`/attempts/assessment/${assessmentId}`);
}
