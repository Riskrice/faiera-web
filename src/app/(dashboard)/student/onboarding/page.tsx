'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import {
    ArrowLeft,
    ArrowRight,
    BookA,
    CheckCircle2,
    FlaskConical,
    GraduationCap,
    Loader2,
    Sigma,
    Sparkles,
    Pencil,
} from 'lucide-react';

import { useAuth } from '@/contexts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { updateAcademicProfile } from '@/lib/api';
import { trackEvent } from '@/lib/gtm';
import {
    getAcademicProfile,
    isAcademicProfileComplete,
    requiresScientificSpecialization,
    SCIENTIFIC_SPECIALIZATION_OPTIONS,
    SECONDARY_YEAR_OPTIONS,
    STUDY_PATH_OPTIONS,
} from '@/lib/academic-profile';
import type { ScientificSpecialization, SecondaryYear, StudyPath } from '@/types/auth';

function OptionCard({
    title,
    subtitle,
    selected,
    icon,
    onClick,
}: {
    title: string;
    subtitle: string;
    selected: boolean;
    icon: ReactNode;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={[
                'group relative overflow-hidden rounded-2xl border p-5 text-right transition-all duration-300',
                'bg-card/90 hover:-translate-y-0.5 hover:shadow-xl',
                selected
                    ? 'border-primary shadow-lg shadow-primary/20 ring-2 ring-primary/20'
                    : 'border-border hover:border-primary/40',
            ].join(' ')}
        >
            <div className="absolute -left-6 -top-6 h-20 w-20 rounded-full bg-primary/10 blur-2xl" />
            <div className="relative z-10 flex items-start gap-4">
                <div
                    className={[
                        'mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl border',
                        selected ? 'border-primary/40 bg-primary/15 text-primary' : 'border-border bg-muted text-muted-foreground',
                    ].join(' ')}
                >
                    {icon}
                </div>
                <div className="flex-1">
                    <div className="flex items-center justify-between gap-3">
                        <h3 className="text-base font-bold text-foreground">{title}</h3>
                        {selected ? <CheckCircle2 className="h-5 w-5 text-primary" /> : null}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
                </div>
            </div>
        </button>
    );
}

export default function StudentAcademicOnboardingPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, loading, updateUser } = useAuth();
    const hasTrackedStart = useRef(false);
    const isEditMode = searchParams.get('edit') === '1';

    const [secondaryYear, setSecondaryYear] = useState<SecondaryYear | null>(null);
    const [studyPath, setStudyPath] = useState<StudyPath | null>(null);
    const [scientificSpecialization, setScientificSpecialization] = useState<ScientificSpecialization | null>(null);
    const [step, setStep] = useState(1);
    const [submitting, setSubmitting] = useState(false);
    const [isViewing, setIsViewing] = useState(false);

    useEffect(() => {
        if (loading) return;

        if (!user) {
            router.replace('/login');
            return;
        }

        if (user.role !== 'student') {
            router.replace('/');
            return;
        }

        const isComplete = isAcademicProfileComplete(user);
        const currentProfile = getAcademicProfile(user);

        if (isComplete && !isEditMode) {
            router.replace('/student');
            return;
        }

        if (isComplete && isEditMode && !hasTrackedStart.current) {
            setIsViewing(true);
        }

        if (currentProfile) {
            setSecondaryYear(currentProfile.secondaryYear || null);
            setStudyPath(currentProfile.studyPath || null);
            setScientificSpecialization(currentProfile.scientificSpecialization || null);

            const existingNeedsSpecialization = requiresScientificSpecialization(currentProfile);
            setStep(existingNeedsSpecialization ? 3 : 2);
        }

        if (!hasTrackedStart.current) {
            trackEvent('academic_onboarding_started', {
                user_role: user.role,
                has_existing_profile: !!currentProfile,
                edit_mode: isEditMode,
            });
            hasTrackedStart.current = true;
        }
    }, [isEditMode, loading, router, user]);

    const needsSpecializationStep = useMemo(
        () => requiresScientificSpecialization({ secondaryYear: secondaryYear || undefined, studyPath: studyPath || undefined }),
        [secondaryYear, studyPath],
    );

    const totalSteps = needsSpecializationStep ? 3 : 2;
    const progress = Math.round((step / totalSteps) * 100);

    useEffect(() => {
        if (loading || !user || user.role !== 'student') return;

        trackEvent('academic_onboarding_step_viewed', {
            step,
            total_steps: totalSteps,
        });
    }, [loading, step, totalSteps, user]);

    useEffect(() => {
        if (!needsSpecializationStep && step > 2) {
            setStep(2);
        }
    }, [needsSpecializationStep, step]);

    const canGoNext =
        (step === 1 && !!secondaryYear) ||
        (step === 2 && !!studyPath) ||
        (step === 3 && !!scientificSpecialization);

    const handleSubmit = async () => {
        if (!secondaryYear || !studyPath) {
            toast.error('برجاء استكمال بيانات السنة والمسار الدراسي');
            return;
        }

        if (needsSpecializationStep && !scientificSpecialization) {
            toast.error('برجاء اختيار التخصص العلمي (علوم أو رياضة)');
            return;
        }

        setSubmitting(true);
        try {
            const response = await updateAcademicProfile({
                secondaryYear,
                studyPath,
                ...(needsSpecializationStep && scientificSpecialization
                    ? { scientificSpecialization }
                    : {}),
            });

            const updatedUser = (response as any).data || response;
            if (updatedUser) {
                updateUser(updatedUser);
            }

            trackEvent('academic_onboarding_completed', {
                secondary_year: secondaryYear,
                study_path: studyPath,
                specialization: scientificSpecialization || 'none',
            });

            toast.success('تم حفظ بياناتك الدراسية بنجاح');
            router.replace('/student');
        } catch (error: any) {
            trackEvent('academic_onboarding_submit_failed', {
                message: error?.message || 'unknown_error',
            });
            toast.error(error?.message || 'تعذر حفظ البيانات الآن، حاول مرة أخرى');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading || !user) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="relative min-h-[calc(100vh-7rem)] overflow-hidden rounded-3xl border bg-gradient-to-br from-emerald-50 via-background to-teal-50 p-4 md:p-8">
            <div className="pointer-events-none absolute -right-20 -top-16 h-64 w-64 rounded-full bg-emerald-200/45 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-teal-200/50 blur-3xl" />

            <div className="relative mx-auto max-w-5xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="mb-6 flex flex-col gap-4 md:mb-8 md:flex-row md:items-end md:justify-between">
                    <div>
                        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-300/40 bg-white/80 px-3 py-1 text-xs font-semibold text-emerald-700">
                            <Sparkles className="h-3.5 w-3.5" />
                            اعداد المحتوى المناسب لك
                        </div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
                            خلينا نضبط مسارك الدراسي
                        </h1>
                        <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
                            خلال اقل من نصف دقيقة هنحدد السنة والمسار الدراسي علشان يظهر لك محتوى مطابق للنظام المصري بشكل ادق.
                        </p>
                        {isEditMode && isAcademicProfileComplete(user) && !isViewing ? (
                            <p className="mt-2 text-xs font-medium text-emerald-700">
                                بياناتك محفوظة بالفعل. يمكنك تعديلها ثم الضغط على تاكيد وحفظ المسار.
                            </p>
                        ) : null}
                    </div>

                    {!isViewing && (
                        <div className="w-full max-w-xs rounded-2xl border bg-white/80 p-4 shadow-sm">
                            <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                                <span>الخطوة {step}</span>
                                <span>من {totalSteps}</span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-muted">
                                <div
                                    className="h-full rounded-full bg-gradient-to-l from-emerald-500 to-teal-500 transition-all duration-500"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {isViewing ? (
                    <Card className="border-0 bg-white/90 shadow-2xl shadow-emerald-900/5 relative overflow-hidden">
                        <div className="absolute right-0 top-0 h-full w-1 bg-gradient-to-b from-primary/50 to-primary" />
                        <CardHeader className="pb-4 border-b bg-muted/20">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <CardTitle className="text-xl font-bold md:text-2xl text-foreground">
                                        مسارك الدراسي الحالي
                                    </CardTitle>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        تم تأكيد بياناتك وهي مستخدمة حالياً لترشيح المحتوى المناسب لك.
                                    </p>
                                </div>
                                <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                                    <CheckCircle2 className="h-6 w-6" />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-8">
                            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                <div className="flex flex-col gap-2 rounded-2xl border bg-card p-5">
                                    <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                        <GraduationCap className="h-4 w-4" />
                                        السنة الدراسية
                                    </div>
                                    <div className="text-lg font-extrabold text-foreground">
                                        {SECONDARY_YEAR_OPTIONS.find((o) => o.value === secondaryYear)?.label || '-'}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        {SECONDARY_YEAR_OPTIONS.find((o) => o.value === secondaryYear)?.subtitle || ''}
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2 rounded-2xl border bg-card p-5">
                                    <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                        {studyPath === 'scientific' ? <FlaskConical className="h-4 w-4" /> : <BookA className="h-4 w-4" />}
                                        المسار الدراسي
                                    </div>
                                    <div className="text-lg font-extrabold text-foreground">
                                        {STUDY_PATH_OPTIONS.find((o) => o.value === studyPath)?.label || '-'}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        {STUDY_PATH_OPTIONS.find((o) => o.value === studyPath)?.subtitle || ''}
                                    </div>
                                </div>

                                {requiresScientificSpecialization({ secondaryYear: secondaryYear || undefined, studyPath: studyPath || undefined }) && (
                                    <div className="flex flex-col gap-2 rounded-2xl border bg-card p-5">
                                        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                            {scientificSpecialization === 'math' ? <Sigma className="h-4 w-4" /> : <FlaskConical className="h-4 w-4" />}
                                            التخصص العلمي
                                        </div>
                                        <div className="text-lg font-extrabold text-foreground">
                                            {SCIENTIFIC_SPECIALIZATION_OPTIONS.find((o) => o.value === scientificSpecialization)?.label || '-'}
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            {SCIENTIFIC_SPECIALIZATION_OPTIONS.find((o) => o.value === scientificSpecialization)?.subtitle || ''}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-end border-t pt-6 gap-4">
                                <Button
                                    variant="outline"
                                    onClick={() => router.push('/student')}
                                >
                                    العودة للرئيسية
                                </Button>
                                <Button
                                    onClick={() => setIsViewing(false)}
                                    className="gap-2"
                                >
                                    <Pencil className="h-4 w-4" />
                                    تعديل المسار
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="border-0 bg-white/90 shadow-2xl shadow-emerald-900/5">
                        <CardHeader className="pb-2">
                        <CardTitle className="text-xl font-bold md:text-2xl">
                            {step === 1 && 'اختر سنتك الدراسية الحالية'}
                            {step === 2 && 'اختر المسار الدراسي'}
                            {step === 3 && 'اختر التخصص العلمي'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {step === 1 ? (
                            <div className="grid gap-4 md:grid-cols-3">
                                {SECONDARY_YEAR_OPTIONS.map((option) => (
                                    <OptionCard
                                        key={option.value}
                                        title={option.label}
                                        subtitle={option.subtitle}
                                        selected={secondaryYear === option.value}
                                        icon={<GraduationCap className="h-5 w-5" />}
                                        onClick={() => {
                                            setSecondaryYear(option.value);
                                            trackEvent('academic_onboarding_year_selected', {
                                                secondary_year: option.value,
                                            });
                                            if (option.value !== 'grade_12') {
                                                setScientificSpecialization(null);
                                            }
                                        }}
                                    />
                                ))}
                            </div>
                        ) : null}

                        {step === 2 ? (
                            <div className="grid gap-4 md:grid-cols-2">
                                {STUDY_PATH_OPTIONS.map((option) => (
                                    <OptionCard
                                        key={option.value}
                                        title={option.label}
                                        subtitle={option.subtitle}
                                        selected={studyPath === option.value}
                                        icon={option.value === 'scientific' ? <FlaskConical className="h-5 w-5" /> : <BookA className="h-5 w-5" />}
                                        onClick={() => {
                                            setStudyPath(option.value);
                                            trackEvent('academic_onboarding_path_selected', {
                                                study_path: option.value,
                                                secondary_year: secondaryYear || 'unset',
                                            });
                                            if (option.value !== 'scientific') {
                                                setScientificSpecialization(null);
                                            }
                                        }}
                                    />
                                ))}
                            </div>
                        ) : null}

                        {step === 3 ? (
                            <div className="grid gap-4 md:grid-cols-2">
                                {SCIENTIFIC_SPECIALIZATION_OPTIONS.map((option) => (
                                    <OptionCard
                                        key={option.value}
                                        title={option.label}
                                        subtitle={option.subtitle}
                                        selected={scientificSpecialization === option.value}
                                        icon={option.value === 'math' ? <Sigma className="h-5 w-5" /> : <FlaskConical className="h-5 w-5" />}
                                        onClick={() => {
                                            setScientificSpecialization(option.value);
                                            trackEvent('academic_onboarding_specialization_selected', {
                                                specialization: option.value,
                                            });
                                        }}
                                    />
                                ))}
                            </div>
                        ) : null}

                        <div className="flex flex-col-reverse gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                            <Button
                                type="button"
                                variant="ghost"
                                className="gap-2"
                                disabled={step === 1 || submitting}
                                onClick={() => setStep((previous) => Math.max(1, previous - 1))}
                            >
                                <ArrowRight className="h-4 w-4" />
                                السابق
                            </Button>

                            {step < totalSteps ? (
                                <Button
                                    type="button"
                                    className="gap-2"
                                    disabled={!canGoNext || submitting}
                                    onClick={() => setStep((previous) => Math.min(totalSteps, previous + 1))}
                                >
                                    التالي
                                    <ArrowLeft className="h-4 w-4" />
                                </Button>
                            ) : (
                                <Button
                                    type="button"
                                    className="gap-2"
                                    disabled={!canGoNext || submitting}
                                    onClick={handleSubmit}
                                >
                                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                                    {submitting ? 'جار حفظ البيانات...' : 'تاكيد وحفظ المسار'}
                                </Button>
                            )}
                        </div>
                    </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
