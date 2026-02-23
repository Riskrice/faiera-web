const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

interface RequestOptions extends RequestInit {
    token?: string;
}

interface ApiError {
    message: string;
    statusCode: number;
}

import { AuthTokens } from '@/types/auth';

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

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    setToken(token: string | null) {
        this.token = token;
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

    private async request<T>(
        endpoint: string,
        options: RequestOptions = {}
    ): Promise<T> {
        const { token, ...fetchOptions } = options;

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...(options.headers as Record<string, string> || {}),
        };

        const effectiveToken = this.getEffectiveToken(token);
        if (effectiveToken) {
            headers['Authorization'] = `Bearer ${effectiveToken}`;
        }

        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            ...fetchOptions,
            headers,
        });

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
        const effectiveToken = this.getEffectiveToken(options?.token);
        const headers: HeadersInit = {};
        if (effectiveToken) {
            headers['Authorization'] = `Bearer ${effectiveToken}`;
        }

        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'POST',
            headers,
            body: formData,
        });

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
        const effectiveToken = this.getEffectiveToken(token);
        if (effectiveToken) {
            headers['Authorization'] = `Bearer ${effectiveToken}`;
        }

        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'POST',
            headers,
            body: formData,
        });

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

export async function getCourses(params?: { limit?: number; sort?: string; search?: string; category?: string; teacherId?: string }) {
    // Should map params to query string
    const query = new URLSearchParams();
    if (params?.limit) query.append('pageSize', params.limit.toString()); // Map limit to pageSize
    if (params?.search) query.append('search', params.search);
    if (params?.category) query.append('category', params.category);
    if (params?.teacherId) query.append('teacherId', params.teacherId);
    // Add other params as needed

    // Using the generic get method
    return api.get<{ data: Course[], meta: any }>(`/content/courses?${query.toString()}`);
}

export async function getCourseById(id: string, token?: string) {
    console.log('--- getCourseById called ---', { id, hasToken: !!token, tokenPrefix: token?.substring(0, 15) });
    return api.get<{ data: Course }>(`/content/courses/${id}?includeModules=true`, {
        token,
        cache: 'no-store'
    });
}

export async function getStreamUrl(lessonId: string) {
    return api.get<{ data: { url: string; token: string } }>(`/content/lessons/${lessonId}/stream-url`);
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

export async function updateProfile(data: any) {
    return api.put<{ data: any }>('/users/me', data);
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
