import {
    User,
    AcademicProfile,
    SecondaryYear,
    StudyPath,
    ScientificSpecialization,
} from '@/types/auth';

export const SECONDARY_YEAR_OPTIONS: Array<{ value: SecondaryYear; label: string; subtitle: string }> = [
    { value: 'grade_10', label: 'أولى ثانوي', subtitle: 'بداية مرحلة بناء الاساس' },
    { value: 'grade_11', label: 'ثانية ثانوي', subtitle: 'تثبيت المسار والاستعداد للنهائي' },
    { value: 'grade_12', label: 'ثالثة ثانوي', subtitle: 'سنة الحسم والامتحانات النهائية' },
];

export const STUDY_PATH_OPTIONS: Array<{ value: StudyPath; label: string; subtitle: string }> = [
    { value: 'scientific', label: 'علمي', subtitle: 'مواد علمية وتركيز تحليلي' },
    { value: 'literary', label: 'أدبي', subtitle: 'مواد انسانية ولغوية' },
];

export const SCIENTIFIC_SPECIALIZATION_OPTIONS: Array<{
    value: ScientificSpecialization;
    label: string;
    subtitle: string;
}> = [
    { value: 'science', label: 'علمي علوم', subtitle: 'احياء وكيمياء بمسار العلوم' },
    { value: 'math', label: 'علمي رياضة', subtitle: 'رياضيات متقدمة وفيزياء' },
];

export function getAcademicProfile(user?: User | null): AcademicProfile | null {
    if (!user?.metadata?.academicProfile) {
        return null;
    }

    return user.metadata.academicProfile;
}

export function requiresScientificSpecialization(profile?: Partial<AcademicProfile> | null): boolean {
    if (!profile) return false;
    return profile.secondaryYear === 'grade_12' && profile.studyPath === 'scientific';
}

export function isAcademicProfileComplete(user?: User | null): boolean {
    const profile = getAcademicProfile(user);
    if (!profile?.secondaryYear || !profile?.studyPath) {
        return false;
    }

    if (requiresScientificSpecialization(profile)) {
        return !!profile.scientificSpecialization;
    }

    return true;
}

export function getAcademicProfileBadge(profile?: AcademicProfile | null): string {
    if (!profile) return 'غير محدد';

    const yearLabel = SECONDARY_YEAR_OPTIONS.find((option) => option.value === profile.secondaryYear)?.label || 'غير محدد';
    const pathLabel = STUDY_PATH_OPTIONS.find((option) => option.value === profile.studyPath)?.label || 'غير محدد';

    if (profile.scientificSpecialization) {
        const specializationLabel =
            SCIENTIFIC_SPECIALIZATION_OPTIONS.find((option) => option.value === profile.scientificSpecialization)?.label ||
            'غير محدد';
        return `${yearLabel} - ${specializationLabel}`;
    }

    return `${yearLabel} - ${pathLabel}`;
}
