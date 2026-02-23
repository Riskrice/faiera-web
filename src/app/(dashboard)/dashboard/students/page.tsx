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
    Edit
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

type Student = {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    grade?: string;
    status: string;
    createdAt: string;
    role: string;
};

export default function StudentsPage() {
    const { accessToken } = useAuth();
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    // Search & Sort State
    const [localSearchTerm, setLocalSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(localSearchTerm, 300);
    const [sortBy, setSortBy] = useState<'createdAt' | 'firstName'>('createdAt');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

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
    });
    const [passwordStrength, setPasswordStrength] = useState(0);

    const calculatePasswordStrength = (password: string) => {
        let strength = 0;
        if (password.length >= 8) strength += 1;
        if (password.length >= 10) strength += 1;
        if (/[A-Z]/.test(password)) strength += 1;
        if (/[0-9]/.test(password)) strength += 1;
        if (/[^A-Za-z0-9]/.test(password)) strength += 1;
        return strength;
    };

    const fetchStudents = useCallback(async () => {
        if (!accessToken) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const response = await fetch(`${apiUrl}/users?role=student`, {
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

            setStudents(data.data || data || []);
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
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || "فشل في تحديث بيانات الطالب");
            }

            toast.success("تم تحديث بيانات الطالب بنجاح");
            setIsEditOpen(false);
            fetchStudents();
        } catch (error: any) {
            toast.error(error.message || "حدث خطأ");
        } finally {
            setActionLoading(false);
        }
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
                s.id.toLowerCase().includes(searchLower);
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
                            <TableHead className="w-[100px] text-right">المعرف</TableHead>
                            <TableHead className="text-right">الحالة</TableHead>
                            <TableHead className="text-right">تاريخ الانضمام</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredStudents.length > 0 ? (
                            filteredStudents.map((student) => (
                                <TableRow key={student.id}>
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
                                    <TableCell className="font-mono text-xs text-right leading-none">{student.id.slice(0, 8)}</TableCell>
                                    <TableCell className="text-right">{getStatusBadge(student.status)}</TableCell>
                                    <TableCell className="font-sans text-sm text-right leading-none">
                                        {new Date(student.createdAt).toLocaleDateString('ar-EG')}
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
                                                        setSelectedStudent(student);
                                                        setEditForm({
                                                            firstName: student.firstName,
                                                            lastName: student.lastName,
                                                            email: student.email,
                                                            grade: student.grade || '',
                                                        });
                                                        setIsEditOpen(true);
                                                    }}
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
                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                    {debouncedSearchTerm ? "لا يوجد طلاب بهذا الاسم." : "لا يوجد طلاب بعد."}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

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
