"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    Search,
    User,
    Mail,
    Calendar,
    MoreVertical,
    FileText,
    CheckCircle2,
    XCircle
} from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type Student = {
    id: string
    name: string
    email: string
    phone?: string
    avatar?: string
    enrollmentType: "package" | "session"
    enrollmentDetails: string
    status: "active" | "inactive"
    joinDate: Date
}

import { api } from "@/lib/api"
import { auth } from "@/lib/auth"

export default function TeacherStudentsPage() {
    const [searchQuery, setSearchQuery] = useState("")
    const [students, setStudents] = useState<Student[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const token = auth.getToken()
                if (!token) return

                const response = await api.get<{ data: any[] }>('/teachers/students/my', { token })
                if (response.data) {
                    const mappedStudents = response.data.map((user: any) => ({
                        id: user.id,
                        name: `${user.firstName} ${user.lastName}`,
                        email: user.email,
                        phone: user.phone || "غير متوفر",
                        avatar: user.avatarUrl,
                        enrollmentType: "package" as const, // Backend doesn't fully distinguish this per student list yet, defaulting
                        enrollmentDetails: user.grade ? `الصف ${user.grade}` : "غير محدد",
                        status: (user.isActive ? 'active' : 'inactive') as "active" | "inactive", // Mapping backend isActive to local status
                        joinDate: new Date(user.createdAt)
                    }))
                    setStudents(mappedStudents)
                }
            } catch (error) {
                console.error("Failed to fetch students", error)
            } finally {
                setLoading(false)
            }
        }

        fetchStudents()
    }, [])

    const filteredStudents = students.filter(student => {
        const query = searchQuery.toLowerCase().trim()
        if (!query) return true

        return (
            student.name.toLowerCase().includes(query) ||
            student.email.toLowerCase().includes(query) ||
            student.enrollmentDetails.toLowerCase().includes(query)
        )
    })

    return (
        <div className="flex-1 p-8 space-y-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold font-cairo flex items-center gap-2">
                        <User className="w-8 h-8 text-primary" />
                        الطلاب المسجلين
                    </h1>
                    <p className="text-muted-foreground mt-1">قائمة بجميع الطلاب المشتركين في حصصك أو باقاتك.</p>
                </div>
                <div className="relative w-full md:w-64">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="بحث عن طالب..."
                        className="pr-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid gap-4">
                {filteredStudents.map(student => (
                    <Card key={student.id} className="hover:shadow-sm transition-shadow">
                        <CardContent className="p-4 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <Avatar className="w-12 h-12 border-2 border-muted">
                                    <AvatarImage src={student.avatar} />
                                    <AvatarFallback>{student.name.slice(0, 2)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="font-semibold text-lg">{student.name}</h3>
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                            <Mail className="w-3 h-3" />
                                            {student.email}
                                        </div>
                                        {student.phone && (
                                            <div className="flex items-center gap-1">
                                                <span className="text-xs">📱</span>
                                                <span dir="ltr">{student.phone}</span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {student.joinDate.toLocaleDateString('ar-EG')}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                <div className="hidden md:block text-right">
                                    <p className="text-sm font-medium">نوع الاشتراك</p>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Badge variant="outline">{student.enrollmentType === 'package' ? 'باقة' : 'حصة'}</Badge>
                                        <span>{student.enrollmentDetails}</span>
                                    </div>
                                </div>
                                <div className="hidden md:block text-right">
                                    <p className="text-sm font-medium">الحالة</p>
                                    <div className={`flex items-center gap-1 text-sm ${student.status === 'active' ? 'text-emerald-600' : 'text-red-500'}`}>
                                        {student.status === 'active' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                        {student.status === 'active' ? 'نشط' : 'غير نشط'}
                                    </div>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                            <MoreVertical className="w-4 h-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem>
                                            <FileText className="w-4 h-4 ml-2" />
                                            سجل الحضور
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                            <Mail className="w-4 h-4 ml-2" />
                                            مراسلة الطالب
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
            {filteredStudents.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                    لا يوجد طلاب مطابقين للبحث.
                </div>
            )}
        </div>
    )
}
