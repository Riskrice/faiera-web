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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ImageUploader } from "@/components/ui/image-uploader";
import {
    Search,
    MoreHorizontal,
    Shield,
    ShieldAlert,
    ShieldCheck,
    Star,
    GraduationCap,
    X,
    Loader2,
    RefreshCw,
    CheckCircle,
    Edit,
    Trash2
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
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

type Teacher = {
    id: string;
    user: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        metadata?: any;
    };
    bio?: string;
    specializations?: string[];
    status: string;
    averageRating?: number;
    totalSessions?: number;
    createdAt: string;
};

export default function TeachersPage() {
    const { accessToken } = useAuth();
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
    const [isApproveOpen, setIsApproveOpen] = useState(false);
    const [isSuspendOpen, setIsSuspendOpen] = useState(false);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    // Form states
    const [createForm, setCreateForm] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        bio: '',
        avatar: '',
    });

    const [editForm, setEditForm] = useState({
        firstName: '',
        lastName: '',
        bio: '',
        avatar: '',
    });

    const [passwordStrength, setPasswordStrength] = useState(0);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

    const [localSearchTerm, setLocalSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(localSearchTerm, 300);
    const [sortBy, setSortBy] = useState<'createdAt' | 'rating'>('createdAt');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

    const calculatePasswordStrength = (password: string) => {
        let strength = 0;
        if (password.length >= 8) strength += 1;
        if (/[A-Z]/.test(password)) strength += 1;
        if (/[0-9]/.test(password)) strength += 1;
        if (/[^A-Za-z0-9]/.test(password)) strength += 1;
        return strength;
    };

    const fetchTeachers = useCallback(async () => {
        if (!accessToken) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const response = await fetch(`${apiUrl}/teachers`, {
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                const errorMessage = data.error?.message || data.message || "فشل في تحميل المعلمين";

                if (response.status === 401) throw new Error("جلسة العمل انتهت (401). يرجى تسجيل الدخول.");
                if (response.status === 403) throw new Error("ليس لديك صلاحية لعرض المعلمين (403).");
                throw new Error(errorMessage);
            }

            setTeachers(data.data || data || []);
        } catch (error: any) {
            console.error("Error fetching teachers:", error);
            toast.error(error.message || "حدث خطأ أثناء تحميل المعلمين");
        } finally {
            setLoading(false);
        }
    }, [accessToken, apiUrl]);

    useEffect(() => {
        fetchTeachers();
    }, [fetchTeachers]);

    useEffect(() => {
        setPasswordStrength(calculatePasswordStrength(createForm.password));
    }, [createForm.password]);

    const handleCreateTeacher = async () => {
        if (!accessToken) return;
        if (!createForm.email || !createForm.password || !createForm.firstName || !createForm.lastName) {
            toast.error("يرجى ملء جميع البيانات الأساسية");
            return;
        }

        if (createForm.password !== createForm.confirmPassword) {
            toast.error("كلمة المرور غير متطابقة");
            return;
        }

        setActionLoading(true);
        try {
            const response = await fetch(`${apiUrl}/teachers/admin/create`, {
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
                    bio: createForm.bio || undefined,
                    avatar: createForm.avatar || undefined,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || "فشل في إنشاء المعلم");
            }

            toast.success("تم إنشاء حساب المعلم بنجاح");
            setIsCreateOpen(false);
            setCreateForm({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '', bio: '', avatar: '' });
            fetchTeachers();
        } catch (error: any) {
            toast.error(error.message || "حدث خطأ");
        } finally {
            setActionLoading(false);
        }
    };

    const handleUpdateTeacher = async () => {
        if (!accessToken || !selectedTeacher) return;
        setActionLoading(true);
        try {
            // 1. Update user basic info + avatar in metadata
            const currentMetadata = selectedTeacher.user?.metadata || {};
            const response = await fetch(`${apiUrl}/users/${selectedTeacher.user.id}`, {
                method: 'PUT',
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    firstName: editForm.firstName,
                    lastName: editForm.lastName,
                    metadata: {
                        ...currentMetadata,
                        avatar: editForm.avatar || currentMetadata.avatar,
                    },
                }),
            });

            if (!response.ok) throw new Error("فشل في تحديث بيانات المعلم");

            // 2. Update teacher profile bio if changed
            if (editForm.bio) {
                await fetch(`${apiUrl}/teachers/${selectedTeacher.id}`, {
                    method: 'PUT',
                    headers: {
                        "Authorization": `Bearer ${accessToken}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        bioAr: editForm.bio,
                        bioEn: editForm.bio,
                    }),
                }).catch(() => console.log("Bio update skipped"));
            }

            toast.success("تم تحديث بيانات المعلم بنجاح");
            setIsEditOpen(false);
            fetchTeachers();
        } catch (error: any) {
            toast.error(error.message || "حدث خطأ");
        } finally {
            setActionLoading(false);
        }
    };

    const handleApprove = async (teacher: Teacher) => {
        if (!accessToken) return;
        setActionLoading(true);
        try {
            const response = await fetch(`${apiUrl}/teachers/${teacher.id}/approve`, {
                method: 'PATCH',
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
            });
            if (!response.ok) throw new Error("فشل في تفعيل حساب المعلم");
            toast.success("تم تفعيل حساب المعلم بنجاح");
            fetchTeachers();
        } catch (error: any) {
            toast.error(error.message || "حدث خطأ");
        } finally {
            setActionLoading(false);
            setIsApproveOpen(false);
        }
    };

    const handleSuspend = async (teacher: Teacher) => {
        if (!accessToken) return;
        setActionLoading(true);
        try {
            const response = await fetch(`${apiUrl}/teachers/${teacher.id}/suspend`, {
                method: 'PATCH',
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
            });
            if (!response.ok) throw new Error("فشل في إيقاف حساب المعلم");
            toast.success("تم إيقاف حساب المعلم بنجاح");
            fetchTeachers();
        } catch (error: any) {
            toast.error(error.message || "حدث خطأ");
        } finally {
            setActionLoading(false);
            setIsSuspendOpen(false);
        }
    };

    const handleDeleteTeacher = async (teacher: Teacher) => {
        if (!accessToken) return;
        if (!confirm(`هل أنت متأكد من حذف المعلم ${teacher.user.firstName} تماماً؟ سيتم حذف حسابه وكافة حصصه.`)) return;

        setActionLoading(true);
        try {
            const response = await fetch(`${apiUrl}/users/${teacher.user.id}`, {
                method: 'DELETE',
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                },
            });
            if (!response.ok) throw new Error("فشل في حذف المعلم");
            toast.success("تم حذف المعلم نهائياً");
            fetchTeachers();
        } catch (error: any) {
            toast.error(error.message || "حدث خطأ");
        } finally {
            setActionLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved':
                return <Badge variant="default" className="gap-1 bg-green-100 text-green-700 hover:bg-green-100"><ShieldCheck className="w-3 h-3" /> معتمد</Badge>;
            case 'pending':
                return <Badge variant="secondary" className="gap-1"><Shield className="w-3 h-3" /> قيد المراجعة</Badge>;
            case 'suspended':
                return <Badge variant="destructive" className="gap-1"><ShieldAlert className="w-3 h-3" /> موقوف</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const filteredTeachers = teachers
        .filter(t => {
            if (!debouncedSearchTerm) return true;
            const searchLower = debouncedSearchTerm.toLowerCase();
            const fullName = `${t.user?.firstName || ''} ${t.user?.lastName || ''}`.toLowerCase();
            const email = (t.user?.email || '').toLowerCase();
            return fullName.includes(searchLower) || email.includes(searchLower);
        })
        .sort((a, b) => {
            if (sortBy === 'rating') {
                return sortDir === 'asc'
                    ? (a.averageRating || 0) - (b.averageRating || 0)
                    : (b.averageRating || 0) - (a.averageRating || 0);
            }
            return sortDir === 'asc'
                ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

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
                    <h2 className="text-3xl font-bold tracking-tight font-cairo text-right">المعلمين</h2>
                    <p className="text-muted-foreground text-right">إدارة المعلمين وهيئة التدريس ({teachers.length} معلم)</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={fetchTeachers} className="gap-2">
                        <RefreshCw className="w-4 h-4" />
                        تحديث
                    </Button>
                    <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
                        <GraduationCap className="w-4 h-4" />
                        إضافة معلم
                    </Button>
                </div>
            </div>

            <div className="flex flex-row-reverse items-center gap-2 bg-card p-4 rounded-lg border border-border shadow-sm">
                <div className="relative flex-1">
                    <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="بحث عن معلم (الاسم، البريد)..."
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
                            <SelectItem value="createdAt-desc">الأحدث انضماماً</SelectItem>
                            <SelectItem value="createdAt-asc">الأقدم انضماماً</SelectItem>
                            <SelectItem value="rating-desc">الأعلى تقييماً</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-right">المعلم</TableHead>
                            <TableHead className="text-right">الحالة</TableHead>
                            <TableHead className="text-right">تاريخ الانضمام</TableHead>
                            <TableHead className="text-right">التقييم</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredTeachers.length > 0 ? (
                            filteredTeachers.map((teacher) => (
                                <TableRow key={teacher.id}>
                                    <TableCell>
                                        <div className="flex items-center justify-end gap-3 text-right">
                                            <div>
                                                <div className="font-medium">{teacher.user?.firstName} {teacher.user?.lastName}</div>
                                                <div className="text-xs text-muted-foreground font-sans">{teacher.user?.email}</div>
                                            </div>
                                            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs order-last">
                                                {teacher.user?.firstName?.[0]}{teacher.user?.lastName?.[0]}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">{getStatusBadge(teacher.status)}</TableCell>
                                    <TableCell className="font-sans text-sm text-right leading-none">
                                        {new Date(teacher.createdAt).toLocaleDateString('ar-EG')}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <span className="font-medium text-sm">{Number(teacher.averageRating || 0).toFixed(1)}</span>
                                            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel className="text-right">إجراءات</DropdownMenuLabel>
                                                <DropdownMenuSeparator />

                                                <DropdownMenuItem
                                                    onClick={() => {
                                                        setSelectedTeacher(teacher);
                                                        setEditForm({
                                                            firstName: teacher.user.firstName,
                                                            lastName: teacher.user.lastName,
                                                            bio: teacher.bio || '',
                                                            avatar: teacher.user.metadata?.avatar || '',
                                                        });
                                                        setIsEditOpen(true);
                                                    }}
                                                    className="cursor-pointer gap-2 text-right justify-end"
                                                >
                                                    تعديل البيانات <Edit className="w-4 h-4 ml-2" />
                                                </DropdownMenuItem>

                                                {teacher.status === 'pending' && (
                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            setSelectedTeacher(teacher);
                                                            setIsApproveOpen(true);
                                                        }}
                                                        className="cursor-pointer text-green-600 gap-2 text-right justify-end"
                                                    >
                                                        اعتماد المعلم <CheckCircle className="w-4 h-4 ml-2" />
                                                    </DropdownMenuItem>
                                                )}

                                                {teacher.status !== 'suspended' ? (
                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            setSelectedTeacher(teacher);
                                                            setIsSuspendOpen(true);
                                                        }}
                                                        className="cursor-pointer text-orange-600 gap-2 text-right justify-end"
                                                    >
                                                        إيقاف المعلم <ShieldAlert className="w-4 h-4 ml-2" />
                                                    </DropdownMenuItem>
                                                ) : (
                                                    <DropdownMenuItem
                                                        onClick={() => handleApprove(teacher)}
                                                        className="cursor-pointer text-green-600 gap-2 text-right justify-end"
                                                    >
                                                        إلغاء الإيقاف <ShieldCheck className="w-4 h-4 ml-2" />
                                                    </DropdownMenuItem>
                                                )}

                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    onClick={() => handleDeleteTeacher(teacher)}
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
                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                    {debouncedSearchTerm ? "لا يوجد معلمين بهذا الاسم." : "لا يوجد معلمين بعد."}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Create Teacher Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-right">إضافة معلم جديد</DialogTitle>
                        <DialogDescription className="text-right">
                            أدخل بيانات الحساب الأساسية لإنشاء حساب للمعلم.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-6 py-4">
                        {/* Status/Avatar section */}
                        <div className="flex flex-col items-center justify-center space-y-3">
                            <ImageUploader
                                value={createForm.avatar}
                                onChange={(url) => setCreateForm(prev => ({ ...prev, avatar: url }))}
                                variant="avatar"
                                title="صورة المعلم"
                                description="اختر صورة واضحة ومناسبة"
                                className="w-32 h-32"
                            />
                        </div>

                        {/* Personal Info */}
                        <div className="space-y-4 px-2">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2 text-right">
                                    <label className="text-sm font-medium text-muted-foreground mr-1">الاسم الأول</label>
                                    <Input
                                        value={createForm.firstName}
                                        onChange={(e) => setCreateForm(prev => ({ ...prev, firstName: e.target.value }))}
                                        placeholder="مثال: أحمد"
                                        dir="rtl"
                                        className="bg-muted/30 hover:bg-muted/50 focus:bg-background transition-colors"
                                    />
                                </div>
                                <div className="space-y-2 text-right">
                                    <label className="text-sm font-medium text-muted-foreground mr-1">الاسم الأخير</label>
                                    <Input
                                        value={createForm.lastName}
                                        onChange={(e) => setCreateForm(prev => ({ ...prev, lastName: e.target.value }))}
                                        placeholder="مثال: محمد"
                                        dir="rtl"
                                        className="bg-muted/30 hover:bg-muted/50 focus:bg-background transition-colors"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2 text-right">
                                <label className="text-sm font-medium text-muted-foreground mr-1">للتواصل والدخول</label>
                                <Input
                                    value={createForm.email}
                                    onChange={(e) => setCreateForm(prev => ({ ...prev, email: e.target.value }))}
                                    placeholder="البريد الإلكتروني"
                                    type="email"
                                    dir="rtl"
                                    className="bg-muted/30 hover:bg-muted/50 focus:bg-background transition-colors"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2 text-right relative">
                                    <label className="text-sm font-medium text-muted-foreground mr-1">كلمة المرور</label>
                                    <Input
                                        value={createForm.password}
                                        onChange={(e) => setCreateForm(prev => ({ ...prev, password: e.target.value }))}
                                        type="password"
                                        placeholder="********"
                                        dir="rtl"
                                        className="bg-muted/30 hover:bg-muted/50 focus:bg-background transition-colors"
                                    />
                                    {createForm.password && (
                                        <div className="absolute -bottom-3 left-0 right-0 flex gap-1 h-1">
                                            {[...Array(5)].map((_, i) => (
                                                <div
                                                    key={i}
                                                    className={`h-full flex-1 rounded-full transition-colors ${i < passwordStrength
                                                        ? passwordStrength < 3
                                                            ? 'bg-red-500/80'
                                                            : passwordStrength < 4
                                                                ? 'bg-yellow-500/80'
                                                                : 'bg-green-500/80'
                                                        : 'bg-transparent'
                                                        }`}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-2 text-right">
                                    <label className="text-sm font-medium text-muted-foreground mr-1">تأكيد المرور</label>
                                    <Input
                                        value={createForm.confirmPassword}
                                        onChange={(e) => setCreateForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                        type="password"
                                        placeholder="********"
                                        dir="rtl"
                                        className="bg-muted/30 hover:bg-muted/50 focus:bg-background transition-colors"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2 text-right pt-2 border-t border-border mt-4">
                                <label className="text-sm font-medium text-muted-foreground mr-1 mt-2 inline-block">نبذة عن المعلم (اختياري)</label>
                                <Textarea
                                    value={createForm.bio}
                                    onChange={(e) => setCreateForm(prev => ({ ...prev, bio: e.target.value }))}
                                    placeholder="اكتب نبذة عن المعلم ومؤهلاته وتخصصه المفضل..."
                                    dir="rtl"
                                    className="resize-none bg-muted/30 hover:bg-muted/50 focus:bg-background transition-colors"
                                    rows={3}
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setIsCreateOpen(false)}>إلغاء</Button>
                        <Button onClick={handleCreateTeacher} disabled={actionLoading}>
                            {actionLoading ? "جاري الإضافة..." : "إضافة المعلم"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Teacher Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-right">تعديل بيانات المعلم</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-6 py-4">
                        <div className="flex flex-col items-center justify-center space-y-3">
                            <ImageUploader
                                value={editForm.avatar}
                                onChange={(url) => setEditForm(prev => ({ ...prev, avatar: url }))}
                                variant="avatar"
                                title="تعديل الصورة"
                                description="انقر لتغيير الصورة"
                                className="w-32 h-32"
                            />
                        </div>

                        <div className="space-y-4 px-2">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2 text-right">
                                    <label className="text-sm font-medium text-muted-foreground mr-1">الاسم الأول</label>
                                    <Input
                                        value={editForm.firstName}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, firstName: e.target.value }))}
                                        dir="rtl"
                                        className="bg-muted/30 hover:bg-muted/50 focus:bg-background transition-colors"
                                    />
                                </div>
                                <div className="space-y-2 text-right">
                                    <label className="text-sm font-medium text-muted-foreground mr-1">الاسم الأخير</label>
                                    <Input
                                        value={editForm.lastName}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, lastName: e.target.value }))}
                                        dir="rtl"
                                        className="bg-muted/30 hover:bg-muted/50 focus:bg-background transition-colors"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2 text-right pt-2 border-t border-border mt-4">
                                <label className="text-sm font-medium text-muted-foreground mr-1 mt-2 inline-block">النبذة التعريفية</label>
                                <Textarea
                                    value={editForm.bio}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                                    dir="rtl"
                                    className="resize-none bg-muted/30 hover:bg-muted/50 focus:bg-background transition-colors"
                                    rows={3}
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setIsEditOpen(false)}>إلغاء</Button>
                        <Button onClick={handleUpdateTeacher} disabled={actionLoading}>
                            {actionLoading ? "جاري الحفظ..." : "حفظ التعديلات"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Approve Confirmation Dialog */}
            <Dialog open={isApproveOpen} onOpenChange={setIsApproveOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-green-600 flex items-center justify-end gap-2 text-right">
                            اعتماد المعلم <CheckCircle className="h-5 w-5 ml-2" />
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4 text-right">
                        <p>هل أنت متأكد من اعتماد المعلم <strong>{selectedTeacher?.user?.firstName} {selectedTeacher?.user?.lastName}</strong>؟</p>
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setIsApproveOpen(false)}>إلغاء</Button>
                        <Button
                            onClick={() => selectedTeacher && handleApprove(selectedTeacher)}
                            disabled={actionLoading}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {actionLoading ? "جاري الاعتماد..." : "تأكيد الاعتماد"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Suspend Confirmation Dialog */}
            <Dialog open={isSuspendOpen} onOpenChange={setIsSuspendOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-orange-600 flex items-center justify-end gap-2 text-right">
                            إيقاف المعلم <ShieldAlert className="h-5 w-5 ml-2" />
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4 text-right">
                        <p>هل أنت متأكد من إيقاف المعلم <strong>{selectedTeacher?.user?.firstName} {selectedTeacher?.user?.lastName}</strong>؟</p>
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setIsSuspendOpen(false)}>إلغاء</Button>
                        <Button
                            variant="destructive"
                            onClick={() => selectedTeacher && handleSuspend(selectedTeacher)}
                            disabled={actionLoading}
                        >
                            {actionLoading ? "جاري الإيقاف..." : "تأكيد الإيقاف"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
