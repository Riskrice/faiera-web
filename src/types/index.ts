// User & Auth Types
export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: 'student' | 'teacher' | 'admin';
    grade?: string;
    avatar?: string;
    phoneNumber?: string;
    isActive: boolean;
    createdAt: string;
}

export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    user: User;
}

export interface LoginDto {
    email: string;
    password: string;
}

export interface RegisterDto {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: 'student' | 'teacher';
    grade?: string;
    phoneNumber?: string;
}

// Course & Content Types
export interface Course {
    id: string;
    titleAr: string;
    titleEn: string;
    descriptionAr: string;
    descriptionEn: string;
    thumbnailUrl?: string;
    subject: string;
    grade: string;
    teacherId: string;
    teacher?: User;
    lessonsCount: number;
    enrolledCount: number;
    isPublished: boolean;
}

export interface Lesson {
    id: string;
    titleAr: string;
    titleEn: string;
    courseId: string;
    videoUrl?: string;
    duration: number;
    order: number;
    isPreview: boolean;
}

// Progress Types
export interface Progress {
    id: string;
    userId: string;
    contentType: 'lesson' | 'video' | 'assessment' | 'course';
    contentId: string;
    progressPercent: number;
    lastPosition: number;
    completedAt?: string;
}

// Subscription Types
export interface Subscription {
    id: string;
    userId: string;
    planId: string;
    plan?: SubscriptionPlan;
    status: 'pending' | 'active' | 'expired' | 'cancelled';
    startDate: string;
    endDate: string;
}

export interface SubscriptionPlan {
    id: string;
    nameAr: string;
    nameEn: string;
    price: number;
    durationDays: number;
    features: string[];
}

// Notification Types
export interface Notification {
    id: string;
    type: string;
    titleAr: string;
    titleEn: string;
    bodyAr: string;
    bodyEn: string;
    readAt?: string;
    createdAt: string;
}

// Analytics Types
export interface OverviewStats {
    totalUsers: number;
    totalStudents: number;
    totalTeachers: number;
    activeUsersToday: number;
    totalSubscriptions: number;
    activeSubscriptions: number;
    totalRevenue: number;
    revenueThisMonth: number;
}

// API Response Types
export interface ApiResponse<T> {
    data: T;
    message?: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
}
