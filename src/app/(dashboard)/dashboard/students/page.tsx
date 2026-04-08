'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Search,
    MoreHorizontal,
    Shield,
    ShieldAlert,
    X,
    ShieldCheck,
    User,
    Loader2,
    RefreshCw,
    Trash2,
    Edit,
    Eye,
    EyeOff,
    CheckCircle2,
    AlertTriangle,
    GraduationCap,
    Phone,
    Calendar,
    Clock,
    Hash,
} from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { getAcademicProfileBadge } from "@/lib/academic-profile";

type AcademicProfileMetadata = {
    secondaryYear?: 'grade_10' | 'grade_11' | 'grade_12';
    studyPath?: 'literary' | 'scientific';
    scientificSpecialization?: 'science' | 'math' | null;
    completed?: boolean;
    completedAt?: string;
};

type StudentMetadata = {
    academicProfile?: AcademicProfileMetadata;
    onboarding?: {
        academicProfileCompleted?: boolean;
        academicProfileCompletedAt?: string;
        [key: string]: unknown;
    };
    bio?: string;
    avatar?: string;
    [key: string]: unknown;
};

type Student = {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    grade?: string;
    status: string;
    createdAt: string;
    updatedAt?: string;
    preferredLanguage?: string;
    lastLoginAt?: string | null;
    emailVerifiedAt?: string | null;
    parentId?: string;
    metadata?: StudentMetadata;
    role: string;
};

const GRADE_LABELS: Record<string, string> = {
    grade_1: 'الصف الأول الإعدادي',
    grade_2: 'الصف الثاني الإعدادي',
    grade_3: 'الصف الثالث الإعدادي',
    grade_10: 'الصف الأول الثانوي',
    grade_11: 'الصف الثاني الثانوي',
    grade_12: 'الصف الثالث الثانوي',
};

function isStudentAcademicProfileComplete(student: Student): boolean {
    const profile = student.metadata?.academicProfile;
    if (!profile?.secondaryYear || !profile?.studyPath) {
        return false;
    }

    if (profile.secondaryYear === 'grade_12' && profile.studyPath === 'scientific') {
        return !!profile.scientificSpecialization;
    }

    return true;
}

function isStudentProfileComplete(student: Student): boolean {
    return !!student.phone?.trim() && isStudentAcademicProfileComplete(student);
}

function getProfileCompletionReason(student: Student): string {
    if (!student.phone?.trim()) {
        return 'رقم الهاتف غير مكتمل';
    }

    if (!isStudentAcademicProfileComplete(student)) {
        return 'لم يكمل المسار الدراسي';
    }

    return 'الملف مكتمل';
}

function getStudentGradeLabel(student: Student): string {
    const profile = student.metadata?.academicProfile;
    if (profile?.secondaryYear && profile?.studyPath) {
        return getAcademicProfileBadge(profile as any);
    }

    if (student.grade && GRADE_LABELS[student.grade]) {
        return GRADE_LABELS[student.grade];
    }

    return 'غير محدد';
}

function formatDateTime(dateValue?: string | null): string {
    if (!dateValue) {
        return '-';
    }

    const parsed = new Date(dateValue);
    if (Number.isNaN(parsed.getTime())) {
        return '-';
    }

    return parsed.toLocaleString('ar-EG', {
        dateStyle: 'medium',
        timeStyle: 'short',
    });
}

export default function StudentsPage() {
    const { accessToken } = useAuth();
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [detailsStudent, setDetailsStudent] = useState<Student | null>(null);

    // Search & Sort State
    const [localSearchTerm, setLocalSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(localSearchTerm, 300);
    const [sortBy, setSortBy] = useState<'createdAt' | 'firstName'>('createdAt');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

    // Form States
    const [createForm, setCreateForm] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        grade: '',
    });
    const [editForm, setEditForm] = useState({
        firstName: '',
        lastName: '',
        email: '',
        grade: '',
        password: '',
        confirmPassword: '',
    });
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [showEditPassword, setShowEditPassword] = useState(false);
    const [showEditConfirmPassword, setShowEditConfirmPassword] = useState(false);

    const calculatePasswordStrength = (password: string) => {
        let strength = 0;
        if (password.length >= 8) strength += 1;
        if (password.length >= 10) strength += 1;
        if (/[A-Z]/.test(password)) strength += 1;
        if (/[0-9]/.test(password)) strength += 1;
        if (/[^A-Za-z0-9]/.test(password)) strength += 1;
        return strength;
    };

    const generateStrongPassword = (length = 12) => {
        const lowercase = 'abcdefghijklmnopqrstuvwxyz';
        const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const digits = '0123456789';
        const symbols = '!@#$%^&*()-_=+[]{}';
        const allChars = lowercase + uppercase + digits + symbols;

        const randomChar = (chars: string) => chars[Math.floor(Math.random() * chars.length)];

        const passwordChars = [
            randomChar(lowercase),
            randomChar(uppercase),
            randomChar(digits),
            randomChar(symbols),
        ];

        for (let i = passwordChars.length; i < length; i += 1) {
            passwordChars.push(randomChar(allChars));
        }

        for (let i = passwordChars.length - 1; i > 0; i -= 1) {
            const j = Math.floor(Math.random() * (i + 1));
            [passwordChars[i], passwordChars[j]] = [passwordChars[j], passwordChars[i]];
        }

        return passwordChars.join('');
    };

    const fetchStudents = useCallback(async () => {
        if (!accessToken) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const allStudents: Student[] = [];
            const maxPageSize = 100;
            let page = 1;
            let totalPages = 1;

            do {
                const response = await fetch(`${apiUrl}/users?role=student&page=${page}&pageSize=${maxPageSize}`, {
                    headers: {
                        "Authorization": `Bearer ${accessToken}`,
                        "Content-Type": "application/json",
                    },
                });

                const data = await response.json().catch(() => ({}));

                if (!response.ok) {
                    const errorMessage = data.error?.message || data.message || "فشل في تحميل الطلاب";

                    if (response.status === 401) throw new Error("جلسة العمل انتهت (401). يرجى تسجيل الدخول.");
                    if (response.status === 403) throw new Error("ليس لديك صلاحية لعرض الطلاب (403).");
                    throw new Error(errorMessage);
                }

                const pageStudents = Array.isArray(data?.data) ? data.data : [];
                allStudents.push(...pageStudents);

                const apiTotalPages = data?.pagination?.totalPages;
                totalPages = typeof apiTotalPages === 'number' && apiTotalPages > 0 ? apiTotalPages : page;
                page += 1;
            } while (page <= totalPages);

            setStudents(allStudents);
        } catch (error: any) {
            console.error("Error fetching students:", error);
            toast.error(error.message || "حدث خطأ أثناء تحميل الطلاب");
        } finally {
            setLoading(false);
        }
    }, [accessToken, apiUrl]);

    useEffect(() => {
        fetchStudents();
    }, [fetchStudents]);

    useEffect(() => {
        setPasswordStrength(calculatePasswordStrength(createForm.password));
    }, [createForm.password]);

    const openEditStudentDialog = (student: Student) => {
        setSelectedStudent(student);
        setEditForm({
            firstName: student.firstName,
            lastName: student.lastName,
            email: student.email,
            grade: student.grade || '',
            password: '',
            confirmPassword: '',
        });
        setShowEditPassword(false);
        setShowEditConfirmPassword(false);
        setIsEditOpen(true);
    };

    const openStudentDetails = async (student: Student) => {
        if (!accessToken) return;

        setIsDetailsOpen(true);
        setDetailsStudent(student);
        setDetailsLoading(true);

        try {
            const response = await fetch(`${apiUrl}/users/${student.id}`, {
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
            });

            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data?.error?.message || data?.message || 'فشل في تحميل تفاصيل الطالب');
            }

            const detailedStudent = (data?.data || student) as Student;
            setDetailsStudent(detailedStudent);
        } catch (error: any) {
            toast.error(error?.message || 'حدث خطأ أثناء تحميل التفاصيل');
        } finally {
            setDetailsLoading(false);
        }
    };

    const handleCreateStudent = async () => {
        if (!accessToken) return;
        if (!createForm.email || !createForm.password || !createForm.firstName || !createForm.lastName) {
            toast.error("يرجى ملء جميع البيانات الأساسية");
            return;
        }

        if (createForm.password !== createForm.confirmPassword) {
            toast.error("كلمة المرور غير متطابقة");
            return;
        }

        if (passwordStrength < 3) {
            toast.error("كلمة المرور ضعيفة جداً. يجب أن تحتوي على حروف وأرقام ورموز.");
            return;
        }

        setActionLoading(true);
        try {
            const response = await fetch(`${apiUrl}/users`, {
                method: 'POST',
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    firstName: createForm.firstName,
                    lastName: createForm.lastName,
                    email: createForm.email,
                    password: createForm.password,
                    role: 'student',
                    grade: createForm.grade || undefined,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || "فشل في إنشاء حساب الطالب");
            }

            toast.success("تم إنشاء حساب الطالب بنجاح");
            setIsCreateOpen(false);
            setCreateForm({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '', grade: '' });
            fetchStudents();
        } catch (error: any) {
            toast.error(error.message || "حدث خطأ");
        } finally {
            setActionLoading(false);
        }
    };

    const handleUpdateStudent = async () => {
        if (!accessToken || !selectedStudent) return;

        if (editForm.password || editForm.confirmPassword) {
            if (!editForm.password || !editForm.confirmPassword) {
                toast.error("يرجى إدخال كلمة المرور وتأكيدها");
                return;
            }

            if (editForm.password !== editForm.confirmPassword) {
                toast.error("كلمة المرور غير متطابقة");
                return;
            }

            if (calculatePasswordStrength(editForm.password) < 3) {
                toast.error("كلمة المرور ضعيفة. استخدم حروفًا كبيرة وصغيرة وأرقامًا ورمزًا.");
                return;
            }
        }

        setActionLoading(true);
        try {
            const response = await fetch(`${apiUrl}/users/${selectedStudent.id}`, {
                method: 'PUT',
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    firstName: editForm.firstName,
                    lastName: editForm.lastName,
                    email: editForm.email,
                    grade: editForm.grade || undefined,
                    ...(editForm.password ? { password: editForm.password } : {}),
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const backendMessage = Array.isArray(errorData?.message)
                    ? errorData.message.join(' - ')
                    : (errorData?.error?.message || errorData?.message);
                throw new Error(backendMessage || "فشل في تحديث بيانات الطالب");
            }

            toast.success("تم تحديث بيانات الطالب بنجاح");
            setIsEditOpen(false);
            setShowEditPassword(false);
            setShowEditConfirmPassword(false);
            fetchStudents();
        } catch (error: any) {
            toast.error(error.message || "حدث خطأ");
        } finally {
            setActionLoading(false);
        }
    };

    const handleGenerateEditPassword = () => {
        const generatedPassword = generateStrongPassword(12);
        setEditForm(prev => ({
            ...prev,
            password: generatedPassword,
            confirmPassword: generatedPassword,
        }));
        setShowEditPassword(true);
        setShowEditConfirmPassword(true);
        toast.success("تم توليد كلمة مرور تلقائيًا");
    };

    const handleSuspend = async (student: Student) => {
        if (!accessToken) return;
        setActionLoading(true);
        try {
            const response = await fetch(`${apiUrl}/users/${student.id}/suspend`, {
                method: 'PATCH',
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
            });
            if (!response.ok) throw new Error("فشل في حظر الطالب");
            toast.success("تم حظر الطالب بنجاح");
            fetchStudents();
        } catch (error: any) {
            toast.error(error.message || "حدث خطأ");
        } finally {
            setActionLoading(false);
            setIsDeleteOpen(false);
        }
    };

    const handleActivate = async (student: Student) => {
        if (!accessToken) return;
        setActionLoading(true);
        try {
            const response = await fetch(`${apiUrl}/users/${student.id}/activate`, {
                method: 'PATCH',
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
            });
            if (!response.ok) throw new Error("فشل في تفعيل الطالب");
            toast.success("تم تفعيل الطالب بنجاح");
            fetchStudents();
        } catch (error: any) {
            toast.error(error.message || "حدث خطأ");
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteStudent = async (student: Student) => {
        if (!accessToken) return;
        if (!confirm(`هل أنت متأكد من حذف الطالب ${student.firstName} تماماً؟ لا يمكن التراجع.`)) return;

        setActionLoading(true);
        try {
            const response = await fetch(`${apiUrl}/users/${student.id}`, {
                method: 'DELETE',
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                },
            });
            if (!response.ok) throw new Error("فشل في حذف الطالب");
            toast.success("تم حذف الطالب بنجاح");
            fetchStudents();
        } catch (error: any) {
            toast.error(error.message || "حدث خطأ");
        } finally {
            setActionLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active':
                return <Badge variant="default" className="gap-1 bg-green-100 text-green-700 hover:bg-green-100"><ShieldCheck className="w-3 h-3" /> نشط</Badge>;
            case 'inactive':
                return <Badge variant="secondary" className="gap-1"><Shield className="w-3 h-3" /> غير نشط</Badge>;
            case 'suspended':
                return <Badge variant="destructive" className="gap-1"><ShieldAlert className="w-3 h-3" /> محظور</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const filteredStudents = students
        .filter(s => {
            if (!debouncedSearchTerm) return true;
            const searchLower = debouncedSearchTerm.toLowerCase();
            const fullName = `${s.firstName} ${s.lastName}`.toLowerCase();
            return fullName.includes(searchLower) ||
                s.email.toLowerCase().includes(searchLower) ||
                s.id.toLowerCase().includes(searchLower) ||
                (s.phone && s.phone.includes(searchLower));
        })
        .sort((a, b) => {
            if (sortBy === 'firstName') {
                return sortDir === 'asc'
                    ? a.firstName.localeCompare(b.firstName)
                    : b.firstName.localeCompare(a.firstName);
            }
            return sortDir === 'asc'
                ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearchTerm, sortBy, sortDir]);

    const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
    const paginatedStudents = filteredStudents.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight font-cairo text-right">الطلاب</h2>
                    <p className="text-muted-foreground text-right">إدارة طلاب المنصة وحساباتهم ({students.length} طالب)</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={fetchStudents} className="gap-2">
                        <RefreshCw className="w-4 h-4" />
                        تحديث
                    </Button>
                    <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
                        <User className="w-4 h-4" />
                        إضافة طالب
                    </Button>
                </div>
            </div>

            <div className="flex flex-row-reverse items-center gap-2 bg-card p-4 rounded-lg border border-border shadow-sm">
                <div className="relative flex-1">
                    <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="بحث عن طالب (الاسم، البريد، الـ ID)..."
                        className="pr-9 pl-9 text-right"
                        dir="rtl"
                        value={localSearchTerm}
                        onChange={(e) => setLocalSearchTerm(e.target.value)}
                    />
                    {localSearchTerm && (
                        <button
                            onClick={() => setLocalSearchTerm('')}
                            className="absolute left-3 top-3 text-muted-foreground hover:text-foreground"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
                <div className="w-[200px]" dir="rtl">
                    <Select value={`${sortBy}-${sortDir}`} onValueChange={(value) => {
                        const [key, dir] = value.split('-');
                        setSortBy(key as any);
                        setSortDir(dir as any);
                    }}>
                        <SelectTrigger>
                            <SelectValue placeholder="ترتيب حسب" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="createdAt-desc">الأحدث إضافة</SelectItem>
                            <SelectItem value="createdAt-asc">الأقدم إضافة</SelectItem>
                            <SelectItem value="firstName-asc">الاسم (أ-ي)</SelectItem>
                            <SelectItem value="firstName-desc">الاسم (ي-أ)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-right">الطالب</TableHead>
                            <TableHead className="w-[150px] text-right">رقم الهاتف</TableHead>
                            <TableHead className="w-[170px] text-right">الصف الدراسي</TableHead>
                            <TableHead className="w-[170px] text-right">اكتمال البروفايل</TableHead>
                            <TableHead className="w-[100px] text-right">المعرف</TableHead>
                            <TableHead className="text-right">الحالة</TableHead>
                            <TableHead className="text-right">تاريخ الانضمام</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedStudents.length > 0 ? (
                            paginatedStudents.map((student) => (
                                <TableRow
                                    key={student.id}
                                    className="cursor-pointer hover:bg-muted/40 transition-colors"
                                    onClick={() => openStudentDetails(student)}
                                >
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                                {student.firstName?.[0]}{student.lastName?.[0]}
                                            </div>
                                            <div className="text-right">
                                                <div className="font-medium">{student.firstName} {student.lastName}</div>
                                                <div className="text-xs text-muted-foreground font-sans">{student.email}</div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-mono text-sm text-right" dir="ltr">{student.phone || '-'}</TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 px-2 text-right"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                openStudentDetails(student);
                                            }}
                                        >
                                            <GraduationCap className="w-4 h-4 ml-1 text-primary" />
                                            {getStudentGradeLabel(student)}
                                        </Button>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {isStudentProfileComplete(student) ? (
                                            <Badge variant="default" className="gap-1 bg-green-100 text-green-700 hover:bg-green-100" title={getProfileCompletionReason(student)}>
                                                <CheckCircle2 className="w-3 h-3" /> مكتمل
                                            </Badge>
                                        ) : (
                                            <Badge variant="secondary" className="gap-1 bg-amber-100 text-amber-700 hover:bg-amber-100" title={getProfileCompletionReason(student)}>
                                                <AlertTriangle className="w-3 h-3" /> غير مكتمل
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="font-mono text-xs text-right leading-none">{student.id.slice(0, 8)}</TableCell>
                                    <TableCell className="text-right">{getStatusBadge(student.status)}</TableCell>
                                    <TableCell className="font-sans text-sm text-right leading-none">
                                        {new Date(student.createdAt).toLocaleDateString('ar-EG')}
                                    </TableCell>
                                    <TableCell onClick={(e) => e.stopPropagation()}>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel className="text-right">إجراءات</DropdownMenuLabel>
                                                <DropdownMenuSeparator />

                                                <DropdownMenuItem
                                                    onClick={() => openEditStudentDialog(student)}
                                                    className="cursor-pointer gap-2 text-right justify-end"
                                                >
                                                    تعديل البيانات <Edit className="w-4 h-4 ml-2" />
                                                </DropdownMenuItem>

                                                {student.status === 'suspended' ? (
                                                    <DropdownMenuItem onClick={() => handleActivate(student)} className="cursor-pointer text-green-600 gap-2 text-right justify-end">
                                                        تفعيل الطالب <ShieldCheck className="w-4 h-4 ml-2" />
                                                    </DropdownMenuItem>
                                                ) : (
                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            setSelectedStudent(student);
                                                            setIsDeleteOpen(true);
                                                        }}
                                                        className="cursor-pointer text-orange-600 gap-2 text-right justify-end"
                                                    >
                                                        حظر الطالب <ShieldAlert className="w-4 h-4 ml-2" />
                                                    </DropdownMenuItem>
                                                )}

                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    onClick={() => handleDeleteStudent(student)}
                                                    className="cursor-pointer text-destructive focus:text-destructive gap-2 text-right justify-end"
                                                >
                                                    حذف الحساب نهائياً <Trash2 className="w-4 h-4 ml-2" />
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                                    {debouncedSearchTerm ? "لا يوجد طلاب بهذا الاسم." : "لا يوجد طلاب بعد."}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between bg-card p-4 rounded-lg border border-border shadow-sm">
                    <div className="text-sm text-muted-foreground text-right" dir="rtl">
                        إجمالي الطلاب: {filteredStudents.length}
                    </div>
                    <div className="flex items-center gap-2" dir="rtl">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                        >
                            السابق
                        </Button>
                        <span className="text-sm">
                            الصفحة {currentPage} من {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage >= totalPages}
                        >
                            التالي
                        </Button>
                    </div>
                </div>
            )}

            {/* Student Details Dialog */}
            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="w-[95vw] max-w-3xl p-0 [&>button]:hidden">
                    <div className="max-h-[88vh] overflow-y-auto p-4 sm:p-6">
                        <DialogHeader className="space-y-3">
                            <DialogTitle className="text-right">بطاقة الطالب التفصيلية</DialogTitle>
                        </DialogHeader>

                        {detailsLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                            </div>
                        ) : detailsStudent ? (
                            <div className="space-y-4 pt-2" dir="rtl">
                                <div className="rounded-lg border bg-muted/25 p-4">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                                                {detailsStudent.firstName?.[0]}{detailsStudent.lastName?.[0]}
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold text-base">{detailsStudent.firstName} {detailsStudent.lastName}</p>
                                                <p className="text-xs text-muted-foreground font-sans break-all" dir="ltr">{detailsStudent.email}</p>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2">
                                            {getStatusBadge(detailsStudent.status)}
                                            {isStudentProfileComplete(detailsStudent) ? (
                                                <Badge variant="default" className="gap-1 bg-green-100 text-green-700 hover:bg-green-100">
                                                    <CheckCircle2 className="w-3 h-3" /> مكتمل
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary" className="gap-1 bg-amber-100 text-amber-700 hover:bg-amber-100">
                                                    <AlertTriangle className="w-3 h-3" /> غير مكتمل
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="rounded-md border p-3 text-right">
                                        <p className="text-xs text-muted-foreground flex items-center justify-end gap-1">
                                            رقم الهاتف <Phone className="w-3.5 h-3.5" />
                                        </p>
                                        <p className="font-medium mt-1 font-sans" dir="ltr">{detailsStudent.phone || 'غير مضاف'}</p>
                                    </div>

                                    <div className="rounded-md border p-3 text-right">
                                        <p className="text-xs text-muted-foreground flex items-center justify-end gap-1">
                                            الصف الدراسي <GraduationCap className="w-3.5 h-3.5" />
                                        </p>
                                        <p className="font-medium mt-1">{getStudentGradeLabel(detailsStudent)}</p>
                                    </div>

                                    <div className="rounded-md border p-3 text-right">
                                        <p className="text-xs text-muted-foreground flex items-center justify-end gap-1">
                                            تاريخ الانضمام <Calendar className="w-3.5 h-3.5" />
                                        </p>
                                        <p className="font-medium mt-1">{formatDateTime(detailsStudent.createdAt)}</p>
                                    </div>

                                    <div className="rounded-md border p-3 text-right">
                                        <p className="text-xs text-muted-foreground flex items-center justify-end gap-1">
                                            آخر تسجيل دخول <Clock className="w-3.5 h-3.5" />
                                        </p>
                                        <p className="font-medium mt-1">{detailsStudent.lastLoginAt ? formatDateTime(detailsStudent.lastLoginAt) : 'لم يسجل دخول بعد'}</p>
                                    </div>
                                </div>

                                <div className="rounded-md border p-4 text-right space-y-2">
                                    <p className="text-xs text-muted-foreground">المسار الأكاديمي</p>
                                    {detailsStudent.metadata?.academicProfile ? (
                                        <p className="font-medium">{getAcademicProfileBadge(detailsStudent.metadata.academicProfile as any)}</p>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">لم يتم تحديد المسار الدراسي بعد.</p>
                                    )}

                                    {!isStudentProfileComplete(detailsStudent) && (
                                        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2 py-1 inline-block">
                                            سبب عدم الاكتمال: {getProfileCompletionReason(detailsStudent)}
                                        </p>
                                    )}
                                </div>

                                <div className="rounded-md border p-3 text-right">
                                    <p className="text-xs text-muted-foreground flex items-center justify-end gap-1">
                                        معرف الطالب <Hash className="w-3.5 h-3.5" />
                                    </p>
                                    <p className="font-mono text-xs mt-1 break-all" dir="ltr">{detailsStudent.id}</p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground text-center py-8">لا توجد بيانات لعرضها.</p>
                        )}
                    </div>

                    <DialogFooter className="gap-2 border-t px-4 py-3 sm:px-6">
                        <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>إغلاق</Button>
                        {detailsStudent && (
                            <Button
                                onClick={() => {
                                    setIsDetailsOpen(false);
                                    openEditStudentDialog(detailsStudent);
                                }}
                            >
                                تعديل بيانات الطالب
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Create Student Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-right">إضافة طالب جديد</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2 text-right">
                                <label className="text-sm font-medium">الاسم الأول</label>
                                <Input
                                    value={createForm.firstName}
                                    onChange={(e) => setCreateForm(prev => ({ ...prev, firstName: e.target.value }))}
                                    placeholder="أحمد"
                                    dir="rtl"
                                />
                            </div>
                            <div className="space-y-2 text-right">
                                <label className="text-sm font-medium">الاسم الأخير</label>
                                <Input
                                    value={createForm.lastName}
                                    onChange={(e) => setCreateForm(prev => ({ ...prev, lastName: e.target.value }))}
                                    placeholder="محمد"
                                    dir="rtl"
                                />
                            </div>
                        </div>
                        <div className="space-y-2 text-right">
                            <label className="text-sm font-medium">البريد الإلكتروني</label>
                            <Input
                                value={createForm.email}
                                onChange={(e) => setCreateForm(prev => ({ ...prev, email: e.target.value }))}
                                placeholder="student@example.com"
                                type="email"
                                dir="rtl"
                            />
                        </div>
                        <div className="space-y-2 text-right">
                            <label className="text-sm font-medium">السنة الدراسية (اختياري)</label>
                            <div dir="rtl">
                                <Select value={createForm.grade} onValueChange={(val) => setCreateForm(prev => ({ ...prev, grade: val }))}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="اختر السنة الدراسية" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="grade_1">الصف الأول الإعدادي</SelectItem>
                                        <SelectItem value="grade_2">الصف الثاني الإعدادي</SelectItem>
                                        <SelectItem value="grade_3">الصف الثالث الإعدادي</SelectItem>
                                        <SelectItem value="grade_10">الصف الأول الثانوي</SelectItem>
                                        <SelectItem value="grade_11">الصف الثاني الثانوي</SelectItem>
                                        <SelectItem value="grade_12">الصف الثالث الثانوي</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2 text-right">
                            <label className="text-sm font-medium">كلمة المرور</label>
                            <Input
                                value={createForm.password}
                                onChange={(e) => setCreateForm(prev => ({ ...prev, password: e.target.value }))}
                                type="password"
                                placeholder="********"
                                dir="rtl"
                            />
                            {createForm.password && (
                                <div className="flex gap-1 h-1.5 mt-1">
                                    {[...Array(5)].map((_, i) => (
                                        <div
                                            key={i}
                                            className={`h-full flex-1 rounded-full transition-colors ${i < passwordStrength
                                                ? passwordStrength < 3
                                                    ? 'bg-red-500'
                                                    : passwordStrength < 4
                                                        ? 'bg-yellow-500'
                                                        : 'bg-green-500'
                                                : 'bg-muted'
                                                }`}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="space-y-2 text-right">
                            <label className="text-sm font-medium">تأكيد كلمة المرور</label>
                            <Input
                                value={createForm.confirmPassword}
                                onChange={(e) => setCreateForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                type="password"
                                placeholder="********"
                                dir="rtl"
                            />
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setIsCreateOpen(false)}>إلغاء</Button>
                        <Button onClick={handleCreateStudent} disabled={actionLoading}>
                            {actionLoading ? "جاري الإضافة..." : "إضافة الطالب"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Student Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-right">تعديل بيانات الطالب</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2 text-right">
                                <label className="text-sm font-medium">الاسم الأول</label>
                                <Input
                                    value={editForm.firstName}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, firstName: e.target.value }))}
                                    dir="rtl"
                                />
                            </div>
                            <div className="space-y-2 text-right">
                                <label className="text-sm font-medium">الاسم الأخير</label>
                                <Input
                                    value={editForm.lastName}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, lastName: e.target.value }))}
                                    dir="rtl"
                                />
                            </div>
                        </div>
                        <div className="space-y-2 text-right">
                            <label className="text-sm font-medium">البريد الإلكتروني</label>
                            <Input
                                value={editForm.email}
                                onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                                type="email"
                                dir="rtl"
                            />
                        </div>
                        <div className="space-y-2 text-right">
                            <label className="text-sm font-medium">السنة الدراسية</label>
                            <div dir="rtl">
                                <Select value={editForm.grade} onValueChange={(val) => setEditForm(prev => ({ ...prev, grade: val }))}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="اختر السنة الدراسية" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="grade_1">الصف الأول الإعدادي</SelectItem>
                                        <SelectItem value="grade_2">الصف الثاني الإعدادي</SelectItem>
                                        <SelectItem value="grade_3">الصف الثالث الإعدادي</SelectItem>
                                        <SelectItem value="grade_10">الصف الأول الثانوي</SelectItem>
                                        <SelectItem value="grade_11">الصف الثاني الثانوي</SelectItem>
                                        <SelectItem value="grade_12">الصف الثالث الثانوي</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2 text-right pt-4">
                            <div className="flex items-center justify-between gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleGenerateEditPassword}
                                    className="h-8 gap-1"
                                >
                                    توليد تلقائي <RefreshCw className="h-3.5 w-3.5" />
                                </Button>
                                <label className="text-sm font-medium text-gray-700">كلمة المرور الجديدة (اختياري)</label>
                            </div>
                            <div className="relative">
                                <Input
                                    value={editForm.password}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, password: e.target.value }))}
                                    type={showEditPassword ? 'text' : 'password'}
                                    placeholder="اتركها فارغة إذا لم ترد التغيير"
                                    dir="rtl"
                                    className="pl-10"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute left-1 top-1/2 h-8 w-8 -translate-y-1/2"
                                    onClick={() => setShowEditPassword(prev => !prev)}
                                >
                                    {showEditPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>
                        <div className="space-y-2 text-right">
                            <label className="text-sm font-medium text-gray-700">تأكيد كلمة المرور الجديدة</label>
                            <div className="relative">
                                <Input
                                    value={editForm.confirmPassword}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                    type={showEditConfirmPassword ? 'text' : 'password'}
                                    placeholder="أعد كتابة كلمة المرور"
                                    dir="rtl"
                                    className="pl-10"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute left-1 top-1/2 h-8 w-8 -translate-y-1/2"
                                    onClick={() => setShowEditConfirmPassword(prev => !prev)}
                                >
                                    {showEditConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setIsEditOpen(false)}>إلغاء</Button>
                        <Button onClick={handleUpdateStudent} disabled={actionLoading}>
                            {actionLoading ? "جاري الحفظ..." : "حفظ التعديلات"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Ban Confirmation Dialog */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-orange-600 flex items-center justify-end gap-2 text-right">
                            حظر الطالب <ShieldAlert className="h-5 w-5 ml-2" />
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4 text-right">
                        <p>هل أنت متأكد من رغبتك في حظر الطالب <strong>{selectedStudent?.firstName} {selectedStudent?.lastName}</strong>؟</p>
                        <p className="text-sm text-muted-foreground mt-2">سيتم منع الطالب من الدخول للمنصة.</p>
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>إلغاء</Button>
                        <Button
                            variant="destructive"
                            onClick={() => selectedStudent && handleSuspend(selectedStudent)}
                            disabled={actionLoading}
                        >
                            {actionLoading ? "جاري الحظر..." : "تأكيد الحظر"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
