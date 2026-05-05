"use client"

import { useEffect, useState } from "react"
import { Folder, FolderOpen, Plus, MoreVertical, Edit2, Trash2, ChevronRight, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { getQuestionCategoryTree, createQuestionCategory, updateQuestionCategory, deleteQuestionCategory, QuestionCategory } from "@/lib/api"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface QuestionBanksSidebarProps {
    selectedBankId: string | null
    onSelectBank: (id: string | null, name: string | null) => void
    canManage: boolean
}

export function QuestionBanksSidebar({ selectedBankId, onSelectBank, canManage }: QuestionBanksSidebarProps) {
    const [categories, setCategories] = useState<QuestionCategory[]>([])
    const [loading, setLoading] = useState(true)
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
    
    // Dialog state
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [dialogMode, setDialogMode] = useState<"create" | "edit">("create")
    const [editingCategory, setEditingCategory] = useState<QuestionCategory | null>(null)
    const [parentCategory, setParentCategory] = useState<QuestionCategory | null>(null)
    const [formData, setFormData] = useState({ nameAr: "", nameEn: "" })

    const fetchCategories = async () => {
        try {
            const res = await getQuestionCategoryTree()
            setCategories(res.data || [])
        } catch (error) {
            console.error("Failed to fetch categories:", error)
            toast.error("فشل في تحميل بنوك الأسئلة")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchCategories()
    }, [])

    const toggleExpand = (id: string, e: React.MouseEvent) => {
        e.stopPropagation()
        const next = new Set(expandedIds)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        setExpandedIds(next)
    }

    const openCreateDialog = (parent: QuestionCategory | null = null, e?: React.MouseEvent) => {
        if (e) e.stopPropagation()
        setDialogMode("create")
        setParentCategory(parent)
        setFormData({ nameAr: "", nameEn: "" })
        setIsDialogOpen(true)
    }

    const openEditDialog = (category: QuestionCategory, e: React.MouseEvent) => {
        e.stopPropagation()
        setDialogMode("edit")
        setEditingCategory(category)
        setFormData({ nameAr: category.nameAr, nameEn: category.nameEn })
        setIsDialogOpen(true)
    }

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation()
        if (!confirm("هل أنت متأكد من حذف هذا البنك؟")) return

        try {
            await deleteQuestionCategory(id)
            toast.success("تم الحذف بنجاح")
            if (selectedBankId === id) onSelectBank(null, null)
            fetchCategories()
        } catch (error) {
            toast.error("حدث خطأ أثناء الحذف")
        }
    }

    const handleSubmit = async () => {
        if (!formData.nameAr.trim()) {
            toast.error("يرجى إدخال اسم البنك")
            return
        }

        try {
            if (dialogMode === "create") {
                await createQuestionCategory({
                    nameAr: formData.nameAr,
                    nameEn: formData.nameEn || formData.nameAr,
                    parentId: parentCategory?.id
                })
                toast.success("تم إنشاء البنك بنجاح")
            } else if (editingCategory) {
                await updateQuestionCategory(editingCategory.id, {
                    nameAr: formData.nameAr,
                    nameEn: formData.nameEn || formData.nameAr,
                })
                toast.success("تم التعديل بنجاح")
            }
            setIsDialogOpen(false)
            fetchCategories()
        } catch (error) {
            toast.error("حدث خطأ أثناء الحفظ")
        }
    }

    const renderTree = (nodes: QuestionCategory[], depth = 0) => {
        return nodes.map((node) => {
            const isExpanded = expandedIds.has(node.id)
            const isSelected = selectedBankId === node.id
            const hasChildren = node.children && node.children.length > 0

            return (
                <div key={node.id} className="flex flex-col">
                    <div
                        className={cn(
                            "flex items-center group cursor-pointer py-1.5 px-2 rounded-md hover:bg-muted/50 transition-colors text-sm",
                            isSelected && "bg-primary/10 text-primary font-medium hover:bg-primary/15"
                        )}
                        style={{ paddingRight: `${depth * 1.5 + 0.5}rem` }}
                        onClick={() => onSelectBank(node.id, node.nameAr)}
                    >
                        <button 
                            className="w-5 h-5 flex items-center justify-center text-muted-foreground mr-1"
                            onClick={(e) => hasChildren && toggleExpand(node.id, e)}
                        >
                            {hasChildren ? (
                                isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />
                            ) : <span className="w-3.5" />}
                        </button>
                        
                        {isExpanded ? (
                            <FolderOpen className={cn("h-4 w-4 ml-2", isSelected ? "text-primary" : "text-slate-400")} />
                        ) : (
                            <Folder className={cn("h-4 w-4 ml-2", isSelected ? "text-primary" : "text-slate-400")} />
                        )}
                        
                        <span className="flex-1 truncate">{node.nameAr}</span>
                        {node.questionCount !== undefined && node.questionCount > 0 && (
                            <span className="ml-2 text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                                {node.questionCount}
                            </span>
                        )}
                        
                        {canManage && (
                            <div className="opacity-0 group-hover:opacity-100 flex items-center pr-2">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                        <Button variant="ghost" className="h-6 w-6 p-0">
                                            <MoreVertical className="h-3.5 w-3.5" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start">
                                        <DropdownMenuItem onClick={(e) => openCreateDialog(node, e as any)}>
                                            <Plus className="h-4 w-4 ml-2" /> إضافة بنك فرعي
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={(e) => openEditDialog(node, e as any)}>
                                            <Edit2 className="h-4 w-4 ml-2" /> تعديل
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="text-destructive" onClick={(e) => handleDelete(node.id, e as any)}>
                                            <Trash2 className="h-4 w-4 ml-2" /> حذف
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        )}
                    </div>
                    {isExpanded && hasChildren && (
                        <div className="flex flex-col">
                            {renderTree(node.children!, depth + 1)}
                        </div>
                    )}
                </div>
            )
        })
    }

    if (loading) {
        return <div className="p-4 text-sm text-muted-foreground">جاري التحميل...</div>
    }

    return (
        <div className="flex flex-col h-full bg-card border rounded-lg overflow-hidden">
            <div className="p-4 border-b bg-muted/20 flex items-center justify-between">
                <h3 className="font-semibold">بنوك الأسئلة</h3>
                {canManage && (
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => openCreateDialog(null, e)}>
                        <Plus className="h-4 w-4" />
                    </Button>
                )}
            </div>
            
            <div className="p-2 overflow-y-auto flex-1">
                <div 
                    className={cn(
                        "flex items-center cursor-pointer py-2 px-3 rounded-md hover:bg-muted/50 mb-2 text-sm",
                        selectedBankId === null && "bg-primary/10 text-primary font-medium"
                    )}
                    onClick={() => onSelectBank(null, null)}
                >
                    <Folder className={cn("h-4 w-4 ml-2", selectedBankId === null ? "text-primary" : "text-slate-400")} />
                    <span>كل الأسئلة</span>
                </div>
                
                {categories.length === 0 ? (
                    <div className="py-8 text-center text-sm text-muted-foreground">
                        لا توجد بنوك أسئلة. {canManage && "ابدأ بإنشاء بنك جديد."}
                    </div>
                ) : (
                    <div className="space-y-0.5">
                        {renderTree(categories)}
                    </div>
                )}
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {dialogMode === "create" ? (parentCategory ? `إضافة بنك فرعي في "${parentCategory.nameAr}"` : "إضافة بنك جديد") : "تعديل بنك الأسئلة"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">اسم البنك (بالعربية)</label>
                            <Input 
                                value={formData.nameAr} 
                                onChange={e => setFormData({ ...formData, nameAr: e.target.value })} 
                                placeholder="مثال: رياضيات الصف الأول"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>إلغاء</Button>
                        <Button onClick={handleSubmit}>حفظ</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
