'use client';

import { useState } from 'react';
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
    Trophy,
    FileQuestion,
    CheckCircle2,
    Clock,
    AlertCircle,
    ArrowUpDown,
    X,
    Loader2,
    Plus,
    Trash,
    User,
    Edit,
    BarChart3
} from "lucide-react";
import { useEffect } from 'react';
import { useDebounce } from "@/hooks/use-debounce";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";

import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import { usePagination } from "@/hooks/use-pagination";
import { useSortAndFilter } from "@/hooks/use-sort-and-filter";

interface Assessment {
    id: string;
    title: string;
    course: string;
    questionsCount: number;
    totalMarks: number;
    duration: string;
    status: string;
    dueDate: string;
}

import { useRouter } from 'next/navigation';
import { createAssessment, AssessmentType } from '@/lib/api';

function CreateAssessmentForm({ onSuccess, onCancel }: { onSuccess: (id: string) => void, onCancel: () => void }) {
    const [title, setTitle] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async () => {
        if (!title) return toast.error("يرجى إدخال العنوان")

        try {
            setIsLoading(true)
            const res = await createAssessment({
                titleAr: title,
                titleEn: title,
                type: AssessmentType.QUIZ,
                grade: 'secondary', // Defaults
                subject: 'computer_science'
            })
            toast.success("تم إنشاء الاختبار")
            onSuccess(res.data.id)
        } catch (error) {
            toast.error("فشل إنشاء الاختبار")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="space-y-4 py-4">
            <div className="space-y-2">
                <label className="text-sm font-medium">عنوان الاختبار</label>
                <Input
                    placeholder="مثال: اختبار الأسبوع الأول"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                />
            </div>
            <div className="flex justify-end gap-2 mt-4">
                <Button type="button" variant="outline" onClick={onCancel}>إلغاء</Button>
                <Button type="button" variant="emerald" onClick={handleSubmit} disabled={isLoading}>
                    {isLoading ? "جاري الإنشاء..." : "إنشاء ومتابعة"}
                </Button>
            </div>
        </div>
    )
}

export default function AssessmentsPage() {
    const router = useRouter()
    const { accessToken } = useAuth()
    const [assessments, setAssessments] = useState<Assessment[]>([])
    const [loading, setLoading] = useState(true)

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1"

    // Fetch assessments from API
    useEffect(() => {
        const fetchAssessments = async () => {
            if (!accessToken) {
                setLoading(false)
                return
            }

            try {
                const response = await fetch(`${apiUrl}/assessments`, {
                    headers: {
                        "Authorization": `Bearer ${accessToken}`,
                        "Content-Type": "application/json",
                    },
                })

                if (response.ok) {
                    const data = await response.json()
                    if (data.data) {
                        const mappedAssessments = data.data.map((a: any) => ({
                            id: a.id,
                            title: a.title || a.titleAr,
                            course: a.course?.title || a.courseTitle || "غير محدد",
                            questionsCount: a.questionsCount || a.questions?.length || 0,
                            totalMarks: a.totalMarks || 100,
                            duration: a.duration ? `${a.duration} دقيقة` : "غير محدد",
                            status: a.status || "draft",
                            dueDate: a.dueDate || a.endDate || new Date().toISOString().split('T')[0],
                        }))
                        setAssessments(mappedAssessments)
                    }
                } else {
                    toast.error("فشل في تحميل الاختبارات")
                }
            } catch (error) {
                console.error("Failed to fetch assessments:", error)
                toast.error("فشل في الاتصال بالخادم")
            } finally {
                setLoading(false)
            }
        }

        fetchAssessments()
    }, [accessToken, apiUrl])

    const handleDeleteAssessment = async (id: string) => {
        if (!confirm("هل أنت متأكد من حذف هذا الاختبار؟ لا يمكن التراجع عن هذا الإجراء.")) return

        try {
            const { deleteAssessment } = await import("@/lib/api")
            await deleteAssessment(id)
            toast.success("تم حذف الاختبار بنجاح")
            setAssessments(prev => prev.filter(a => a.id !== id))
        } catch (error) {
            console.error(error)
            toast.error("فشل حذف الاختبار")
        }
    }

    // Advanced Search & Filter Hook
    const [localSearchTerm, setLocalSearchTerm] = useState('');
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const debouncedSearchTerm = useDebounce(localSearchTerm, 300);

    const {
        searchTerm,
        setSearchTerm,
        sortConfig,
        setSort,
        processedData: filteredAssessments
    } = useSortAndFilter(assessments, ['title', 'course', 'id']);

    // Update the hook's searchTerm when debounced value changes
    useEffect(() => {
        setSearchTerm(debouncedSearchTerm);
    }, [debouncedSearchTerm, setSearchTerm]);

    const {
        currentItems: paginatedAssessments,
        currentPage,
        totalPages,
        goToPage,
        nextPage,
        prevPage,
        hasPreviousPage,
        hasNextPage,
        startIndex,
        endIndex,
        totalItems,
        itemsPerPage,
        setItemsPerPage
    } = usePagination(filteredAssessments, 10);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'published':
                return <Badge variant="success" className="gap-1"><CheckCircle2 className="w-3 h-3" /> منشور</Badge>;
            case 'draft':
                return <Badge variant="secondary" className="gap-1"><FileQuestion className="w-3 h-3" /> مسودة</Badge>;
            case 'closed':
                return <Badge variant="destructive" className="gap-1"><Clock className="w-3 h-3" /> مغلق</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="flex-1 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight font-cairo">الاختبارات</h2>
                    <p className="text-muted-foreground">إدارة الاختبارات والواجبات وتقييمات الطلاب</p>
                </div>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2" variant="emerald">
                            <Trophy className="h-4 w-4" />
                            إنشاء اختبار جديد
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>إنشاء اختبار جديد</DialogTitle>
                            <DialogDescription>أدخل بيانات الاختبار الجديد</DialogDescription>
                        </DialogHeader>
                        <CreateAssessmentForm onSuccess={(id) => {
                            setIsCreateDialogOpen(false)
                            router.push(`/dashboard/assessments/${id}/edit`)
                        }} onCancel={() => setIsCreateDialogOpen(false)} />
                    </DialogContent>
                </Dialog>
            </div>

            <div className="flex items-center gap-2 bg-card p-4 rounded-lg border border-border shadow-sm">
                <div className="relative flex-1">
                    <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="بحث عن اختبار (العنوان، الكورس)..."
                        className="pr-9 pl-9"
                        value={localSearchTerm}
                        onChange={(e) => setLocalSearchTerm(e.target.value)}
                        aria-label="بحث عن اختبار"
                    />
                    {localSearchTerm && (
                        <button
                            onClick={() => setLocalSearchTerm('')}
                            className="absolute left-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                            aria-label="مسح البحث"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
                <div className="w-[200px]">
                    <Select value={`${sortConfig.key}-${sortConfig.direction}`} onValueChange={(value) => {
                        const [key, direction] = value.split('-');
                        setSort(
                            key as any,
                            direction as any,
                            key === 'dueDate' ? 'date' : (key === 'totalMarks' || key === 'questionsCount' ? 'number' : 'string')
                        );
                    }}>
                        <SelectTrigger>
                            <SelectValue placeholder="ترتيب حسب" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="dueDate-desc">الأحدث موعداً</SelectItem>
                            <SelectItem value="dueDate-asc">الأقدم موعداً</SelectItem>
                            <SelectItem value="title-asc">العنوان (أ-ي)</SelectItem>
                            <SelectItem value="title-desc">العنوان (ي-أ)</SelectItem>
                            <SelectItem value="totalMarks-desc">الدرجات (الأعلى)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="bg-card rounded-lg border border-border shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px] text-right">المعرف</TableHead>
                            <TableHead className="text-right cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setSort('title', sortConfig.key === 'title' && sortConfig.direction === 'asc' ? 'desc' : 'asc')}>
                                <div className="flex items-center gap-2">
                                    عنوان الاختبار
                                    <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                                </div>
                            </TableHead>
                            <TableHead className="text-right">الكورس</TableHead>
                            <TableHead className="text-right">الحالة</TableHead>
                            <TableHead className="text-right">عدد الأسئلة</TableHead>
                            <TableHead className="text-right">الوقت</TableHead>
                            <TableHead className="text-right cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setSort('dueDate', sortConfig.key === 'dueDate' && sortConfig.direction === 'asc' ? 'desc' : 'asc', 'date')}>
                                <div className="flex items-center gap-2">
                                    تاريخ التسليم
                                    <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                                </div>
                            </TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedAssessments.length > 0 ? (
                            paginatedAssessments.map((assessment) => (
                                <TableRow key={assessment.id}>
                                    <TableCell className="font-mono text-xs">{assessment.id}</TableCell>
                                    <TableCell className="font-medium">{assessment.title}</TableCell>
                                    <TableCell className="text-muted-foreground">{assessment.course}</TableCell>
                                    <TableCell>{getStatusBadge(assessment.status)}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="font-mono">{assessment.questionsCount}</Badge>
                                            <span className="text-xs text-muted-foreground">({assessment.totalMarks} درجة)</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-sm">{assessment.duration}</TableCell>
                                    <TableCell className="font-sans text-sm">{assessment.dueDate}</TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>إجراءات</DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem className="cursor-pointer" onClick={() => router.push(`/dashboard/assessments/${assessment.id}/edit?tab=settings`)}>
                                                    <Edit className="w-4 h-4 mr-2" />
                                                    تعديل الاختبار
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="cursor-pointer" onClick={() => router.push(`/dashboard/assessments/${assessment.id}/edit?tab=questions`)}>
                                                    <FileQuestion className="w-4 h-4 mr-2" />
                                                    الأسئلة
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="cursor-pointer" onClick={() => router.push(`/dashboard/assessments/${assessment.id}/results`)}>
                                                    <BarChart3 className="w-4 h-4 mr-2" />
                                                    النتائج
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="cursor-pointer text-destructive focus:text-destructive"
                                                    onClick={() => handleDeleteAssessment(assessment.id)}
                                                >
                                                    <Trash className="w-4 h-4 mr-2" />
                                                    حذف
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                                    لا يوجد اختبارات بهذا العنوان.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
                    <div className="flex flex-1 justify-between sm:hidden">
                        <Button
                            variant="outline"
                            onClick={prevPage}
                            disabled={!hasPreviousPage}
                        >
                            السابق
                        </Button>
                        <Button
                            variant="outline"
                            onClick={nextPage}
                            disabled={!hasNextPage}
                        >
                            التالي
                        </Button>
                    </div>
                    <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                        <div className="flex items-center gap-4">
                            <p className="text-sm text-gray-700">
                                عرض من <span className="font-medium">{startIndex}</span> إلى <span className="font-medium">{endIndex}</span> من أصل <span className="font-medium">{totalItems}</span> اختبار
                            </p>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-700">الصفوف:</span>
                                <Select
                                    value={itemsPerPage.toString()}
                                    onValueChange={(value) => setItemsPerPage(Number(value))}
                                >
                                    <SelectTrigger className="h-8 w-[70px]">
                                        <SelectValue placeholder={itemsPerPage.toString()} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="5">5</SelectItem>
                                        <SelectItem value="10">10</SelectItem>
                                        <SelectItem value="20">20</SelectItem>
                                        <SelectItem value="50">50</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div>
                            <Pagination>
                                <PaginationContent>
                                    <PaginationItem>
                                        <PaginationPrevious
                                            onClick={(e) => { e.preventDefault(); prevPage(); }}
                                            aria-disabled={!hasPreviousPage}
                                            className={!hasPreviousPage ? "pointer-events-none opacity-50" : ""}
                                        />
                                    </PaginationItem>

                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                        <PaginationItem key={page}>
                                            <PaginationLink
                                                isActive={page === currentPage}
                                                onClick={(e) => { e.preventDefault(); goToPage(page); }}
                                            >
                                                {page}
                                            </PaginationLink>
                                        </PaginationItem>
                                    ))}

                                    <PaginationItem>
                                        <PaginationNext
                                            onClick={(e) => { e.preventDefault(); nextPage(); }}
                                            aria-disabled={!hasNextPage}
                                            className={!hasNextPage ? "pointer-events-none opacity-50" : ""}
                                        />
                                    </PaginationItem>
                                </PaginationContent>
                            </Pagination>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
