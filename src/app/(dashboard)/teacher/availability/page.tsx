"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Calendar, Clock, Plus, Trash2, Save, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/contexts"
import { getTeacherAvailability, setTeacherAvailability, DayOfWeek, TeacherAvailability } from "@/lib/api"

const DAYS = [
    { id: 'sunday', value: DayOfWeek.SUNDAY, label: 'الأحد' },
    { id: 'monday', value: DayOfWeek.MONDAY, label: 'الاثنين' },
    { id: 'tuesday', value: DayOfWeek.TUESDAY, label: 'الثلاثاء' },
    { id: 'wednesday', value: DayOfWeek.WEDNESDAY, label: 'الاربعاء' },
    { id: 'thursday', value: DayOfWeek.THURSDAY, label: 'الخميس' },
    { id: 'friday', value: DayOfWeek.FRIDAY, label: 'الجمعة' },
    { id: 'saturday', value: DayOfWeek.SATURDAY, label: 'السبت' },
]

export default function TeacherAvailabilityPage() {
    const { user } = useAuth()
    const [isLoading, setIsLoading] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [availability, setAvailability] = useState<Record<string, string[]>>({})

    // Dialog State
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [selectedDay, setSelectedDay] = useState<typeof DAYS[0] | null>(null)
    const [newSlot, setNewSlot] = useState({ start: "09:00", end: "10:00" })

    useEffect(() => {
        if (user) {
            fetchAvailability()
        }
    }, [user])

    const fetchAvailability = async () => {
        if (!user) return
        try {
            setIsLoading(true)
            const response = await getTeacherAvailability(user.id)
            const data: any = response // Cast because response structure might differ slightly (wrapper)
            const slots = data.data || data // Handle potential missing data wrapper

            // Transform API data to UI state
            const newAvailability: Record<string, string[]> = {}

            if (Array.isArray(slots)) {
                slots.forEach((slot: TeacherAvailability) => {
                    const dayObj = DAYS.find(d => d.value === slot.dayOfWeek)
                    if (dayObj) {
                        const timeRange = `${slot.startTime.slice(0, 5)} - ${slot.endTime.slice(0, 5)}`
                        if (!newAvailability[dayObj.id]) {
                            newAvailability[dayObj.id] = []
                        }
                        newAvailability[dayObj.id].push(timeRange)
                    }
                })
            }
            setAvailability(newAvailability)
        } catch (error) {
            console.error(error)
            toast.error("فشل تحميل المواعيد")
        } finally {
            setIsLoading(false)
        }
    }

    const handleSave = async () => {
        if (!user) return
        setIsSaving(true)
        try {
            // Transform UI state to API payload
            const payload: { dayOfWeek: DayOfWeek; startTime: string; endTime: string }[] = []

            Object.entries(availability).forEach(([dayId, slots]) => {
                const dayObj = DAYS.find(d => d.id === dayId)
                if (dayObj && slots.length > 0) {
                    slots.forEach(slot => {
                        const [start, end] = slot.split(' - ')
                        payload.push({
                            dayOfWeek: dayObj.value,
                            startTime: start,
                            endTime: end
                        })
                    })
                }
            })

            await setTeacherAvailability(payload)
            toast.success("تم تحديث أوقات العمل بنجاح ✅")
        } catch (error) {
            console.error(error)
            toast.error("فشل حفظ التغييرات")
        } finally {
            setIsSaving(false)
        }
    }

    const handleAddSlot = () => {
        if (!selectedDay) return

        if (newSlot.start >= newSlot.end) {
            toast.error("وقت البداية يجب أن يكون قبل وقت النهاية")
            return
        }

        const slotString = `${newSlot.start} - ${newSlot.end}`
        const currentSlots = availability[selectedDay.id] || []

        // Check for duplicates
        if (currentSlots.includes(slotString)) {
            toast.error("هذا الموعد موجود بالفعل")
            return
        }

        setAvailability({
            ...availability,
            [selectedDay.id]: [...currentSlots, slotString].sort()
        })

        setIsDialogOpen(false)
        setNewSlot({ start: "09:00", end: "10:00" })
    }

    const openAddDialog = (day: typeof DAYS[0]) => {
        setSelectedDay(day)
        setIsDialogOpen(true)
    }

    const removeSlot = (dayId: string, slotIndex: number) => {
        const newSlots = availability[dayId].filter((_, i) => i !== slotIndex)
        setAvailability({ ...availability, [dayId]: newSlots })
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="flex-1 p-8 space-y-8 max-w-5xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold font-cairo flex items-center gap-2">
                    <Calendar className="w-8 h-8 text-primary" />
                    أوقات العمل
                </h1>
                <p className="text-muted-foreground mt-1">حدد الأوقات التي تكون فيها متاحاً لاستقبال حجوزات الطلاب.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>الجدول الأسبوعي</CardTitle>
                    <CardDescription>قم بإضافة الفترات الزمنية لكل يوم على حدة.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {DAYS.map((day) => (
                        <div key={day.id} className="flex items-start gap-4 p-4 border rounded-lg bg-card hover:bg-accent/5 transition-colors">
                            <div className="w-24 font-bold pt-2">{day.label}</div>

                            <div className="flex-1 space-y-3">
                                <div className="flex flex-wrap gap-2">
                                    {(availability[day.id] || []).length > 0 ? (
                                        availability[day.id].map((slot, idx) => (
                                            <Badge key={idx} variant="secondary" className="px-3 py-1.5 gap-2 text-sm font-normal">
                                                <Clock className="w-3 h-3 opacity-50" />
                                                <span dir="ltr">{slot}</span>
                                                <button
                                                    className="hover:text-destructive transition-colors"
                                                    onClick={() => removeSlot(day.id, idx)}
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </Badge>
                                        ))
                                    ) : (
                                        <span className="text-sm text-muted-foreground py-1.5 italic">لا توجد مواعيد مضافة</span>
                                    )}
                                </div>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-2 text-xs"
                                    onClick={() => openAddDialog(day)}
                                >
                                    <Plus className="w-3 h-3" />
                                    إضافة فترة
                                </Button>
                            </div>
                        </div>
                    ))}
                </CardContent>
                <div className="p-6 border-t flex justify-end">
                    <Button onClick={handleSave} disabled={isSaving} className="gap-2 min-w-[150px]">
                        {isSaving ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                جاري الحفظ...
                            </>
                        ) : (
                            <>
                                حفظ التغييرات
                                <Save className="w-4 h-4" />
                            </>
                        )}
                    </Button>
                </div>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>إضافة موعد - {selectedDay?.label}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="start">من</Label>
                                <Input
                                    id="start"
                                    type="time"
                                    value={newSlot.start}
                                    onChange={(e) => setNewSlot({ ...newSlot, start: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="end">إلى</Label>
                                <Input
                                    id="end"
                                    type="time"
                                    value={newSlot.end}
                                    onChange={(e) => setNewSlot({ ...newSlot, end: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" onClick={handleAddSlot}>إضافة</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
