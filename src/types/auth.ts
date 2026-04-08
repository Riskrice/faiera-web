export type SecondaryYear = 'grade_10' | 'grade_11' | 'grade_12';
export type StudyPath = 'literary' | 'scientific';
export type ScientificSpecialization = 'science' | 'math';

export interface AcademicProfile {
    secondaryYear: SecondaryYear;
    studyPath: StudyPath;
    scientificSpecialization?: ScientificSpecialization | null;
    completed?: boolean;
    completedAt?: string;
    source?: string;
    version?: number;
}

export interface UserMetadata {
    avatar?: string;
    bio?: string;
    name?: string;
    phone?: string;
    academicProfile?: AcademicProfile;
    onboarding?: {
        academicProfileCompleted?: boolean;
        academicProfileCompletedAt?: string;
        [key: string]: unknown;
    };
    [key: string]: unknown;
}

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
    metadata?: UserMetadata;
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
export interface RegisterResponse {
    user: User;
    requiresOtp: boolean;
}
