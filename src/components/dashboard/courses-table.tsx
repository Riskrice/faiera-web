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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Edit, Trash2, Eye, ArrowUpDown, Search, X, FolderOpen, Loader2, RefreshCw } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/use-debounce";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts";
import { toast } from "sonner";
import api from "@/lib/api";

type Course = {
    id: string;
    title: string;
    price: number;
    currency: string;
    status: string;
    enrolled: number;
    thumbnail: string;
    category: string;
    authorName: string;
};

export function CoursesTable() {
    const { accessToken } = useAuth();
    const [data, setData] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const searchParams = useSearchParams();
    const initialSearch = searchParams.get('search') || '';
    const [localSearchTerm, setLocalSearchTerm] = useState(initialSearch);
    const debouncedSearchTerm = useDebounce(localSearchTerm, 300);
    const [sortBy, setSortBy] = useState<'title' | 'price' | 'enrolled'>('title');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

    const fetchCourses = useCallback(async () => {
        try {
            setLoading(true);
            // Backend now returns all statuses for authenticated users
            const result = await api.get<any>('/content/courses');
            const courses = result.data || result || [];

            // Transform courses to display format
            const transformedCourses: Course[] = courses.map((course: any) => ({
                id: course.id,
                title: course.titleAr || course.titleEn || 'بدون عنوان',
                price: course.price || 0,
                currency: course.currency || 'EGP',
                status: course.status || 'draft',
                enrolled: course.enrolledCount || 0,
                thumbnail: course.thumbnailUrl || '',
                category: course.subject || course.grade || 'عام',
                authorName: course.author?.firstName || 'Admin'
            }));

            setData(transformedCourses);
        } catch (error: any) {
            console.error("Error fetching courses:", error);
            toast.error(error.message || "حدث خطأ أثناء تحميل الكورسات");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCourses();
    }, [fetchCourses]);

    // Filter and sort
    const filteredCourses = data
        .filter(course => {
            if (!debouncedSearchTerm) return true;
            const searchLower = debouncedSearchTerm.toLowerCase();
            return course.title.toLowerCase().includes(searchLower) ||
                course.category.toLowerCase().includes(searchLower) ||
                course.authorName.toLowerCase().includes(searchLower);
        })
        .sort((a, b) => {
            if (sortBy === 'title') {
                return sortDir === 'asc'
                    ? a.title.localeCompare(b.title)
                    : b.title.localeCompare(a.title);
            }
            if (sortBy === 'price') {
                return sortDir === 'asc' ? a.price - b.price : b.price - a.price;
            }
            return sortDir === 'asc' ? a.enrolled - b.enrolled : b.enrolled - a.enrolled;
        });

    const confirmDelete = async () => {
        if (!deleteId || !accessToken) return;

        setIsDeleting(true);
        try {
            const response = await fetch(`${apiUrl}/content/courses/${deleteId}`, {
                method: 'DELETE',
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) throw new Error("فشل في حذف الكورس");

            toast.success("تم حذف الكورس بنجاح");
            setData(prev => prev.filter(c => c.id !== deleteId));
        } catch (error: any) {
            toast.error(error.message || "حدث خطأ أثناء الحذف");
        } finally {
            setIsDeleting(false);
            setDeleteId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 bg-card p-4 rounded-lg border border-border shadow-sm">
                <div className="relative flex-1">
                    <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="بحث عن كورس (العنوان، التصنيف)..."
                        className="pr-9 pl-9"
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
                <div className="w-[200px]">
                    <Select value={`${sortBy}-${sortDir}`} onValueChange={(value) => {
                        const [key, dir] = value.split('-');
                        setSortBy(key as any);
                        setSortDir(dir as any);
                    }}>
                        <SelectTrigger>
                            <SelectValue placeholder="ترتيب حسب" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="title-asc">العنوان (أ-ي)</SelectItem>
                            <SelectItem value="title-desc">العنوان (ي-أ)</SelectItem>
                            <SelectItem value="price-desc">السعر (الأعلى)</SelectItem>
                            <SelectItem value="price-asc">السعر (الأقل)</SelectItem>
                            <SelectItem value="enrolled-desc">المشتركين (الأكثر)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <Button variant="outline" onClick={fetchCourses} className="gap-2">
                    <RefreshCw className="w-4 h-4" />
                </Button>
            </div>

            <div className="rounded-md border border-border overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[80px]">صورة</TableHead>
                            <TableHead
                                className="cursor-pointer hover:bg-muted/50"
                                onClick={() => {
                                    setSortBy('title');
                                    setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
                                }}
                            >
                                <div className="flex items-center gap-2">
                                    اسم الكورس
                                    <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                                </div>
                            </TableHead>
                            <TableHead>الحالة</TableHead>
                            <TableHead
                                className="cursor-pointer hover:bg-muted/50"
                                onClick={() => {
                                    setSortBy('price');
                                    setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
                                }}
                            >
                                <div className="flex items-center gap-2">
                                    السعر
                                    <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                                </div>
                            </TableHead>
                            <TableHead
                                className="cursor-pointer hover:bg-muted/50"
                                onClick={() => {
                                    setSortBy('enrolled');
                                    setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
                                }}
                            >
                                <div className="flex items-center gap-2">
                                    المشتركين
                                    <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                                </div>
                            </TableHead>
                            <TableHead className="text-left">إجراءات</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredCourses.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-[400px]">
                                    <EmptyState
                                        icon={FolderOpen}
                                        title="لا توجد كورسات"
                                        description="لم يتم العثور على أي كورسات. جرب إضافة كورس جديد."
                                        action={
                                            <Button variant="outline" onClick={() => setLocalSearchTerm('')}>
                                                مسح البحث
                                            </Button>
                                        }
                                    />
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredCourses.map((course) => (
                                <TableRow key={course.id}>
                                    <TableCell>
                                        <Avatar className="h-10 w-10 rounded-md">
                                            {course.thumbnail ? (
                                                <AvatarImage src={course.thumbnail} alt={course.title} className="object-cover" />
                                            ) : null}
                                            <AvatarFallback className="rounded-md bg-muted">
                                                {course.title.slice(0, 2)}
                                            </AvatarFallback>
                                        </Avatar>
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        <Link href={`/courses/${course.id}`} className="hover:underline">
                                            {course.title}
                                        </Link>
                                        <div className="text-xs text-muted-foreground">{course.category}</div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={course.status === 'published' ? 'default' : 'secondary'}>
                                            {course.status === 'published' ? 'منشور' : 'مسودة'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {course.price > 0 ? (
                                            <span className="font-bold">{course.price} {course.currency}</span>
                                        ) : (
                                            <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">مجاني</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>{course.enrolled}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-end gap-2">
                                            <Link href={`/dashboard/courses/${course.id}`}>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                onClick={() => setDeleteId(course.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>تأكيد حذف الكورس</DialogTitle>
                        <DialogDescription>
                            هل أنت متأكد من رغبتك في حذف هذا الكورس؟ سيتم حذف جميع المحتويات المرتبطة به.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="ghost" onClick={() => setDeleteId(null)}>إلغاء</Button>
                        <Button variant="destructive" onClick={confirmDelete} disabled={isDeleting}>
                            {isDeleting ? "جاري الحذف..." : "حذف نهائي"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
