"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"
import { User, CreditCard, Bell, Upload, Save, Wallet, ArrowUpRight } from "lucide-react"
import { useAuth } from "@/contexts"
import api, { updateTeacherProfile, updateNotificationPreferences, getNotificationPreferences, updateProfile } from "@/lib/api"

export default function TeacherSettingsPage() {
    const { user, updateUser } = useAuth()
    const [isLoading, setIsLoading] = useState(false)
    const [profile, setProfile] = useState({
        name: "",
        email: "",
        bio: "",
        avatar: ""
    })
    const [payout, setPayout] = useState({
        method: 'bank', // 'bank' | 'wallet' | 'instapay'
        bankName: "",
        accountName: "",
        iban: "",
        walletNumber: "",
        instaPayHandle: ""
    })
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [notifications, setNotifications] = useState({
        email: true,
        sms: false,
        studentJoin: true,
        sessionReminder: true
    })

    useEffect(() => {
        if (user) {
            // Load base profile
            setProfile({
                name: `${user.firstName} ${user.lastName}`,
                email: user.email,
                bio: (user as any).bio || "", // Try user bio first
                avatar: user.metadata?.avatar || ""
            })

            // Load payout from metadata
            if (user.metadata?.payout) {
                setPayout(user.metadata.payout as any)
            }

            // Fetch Teacher specific profile (bio might be there)
            api.get<any>('/teachers/profile/me').then(res => {
                if (res.data) {
                    setProfile(prev => ({
                        ...prev,
                        bio: res.data.bioAr || res.data.bioEn || prev.bio
                    }))
                }
            }).catch(() => {
                console.log("Teacher profile not found or error")
            })

            // Fetch Notifications
            getNotificationPreferences().then(res => {
                if (res.data) {
                    setNotifications(prev => ({
                        ...prev,
                        ...res.data
                    }))
                }
            }).catch(console.error)
        }
    }, [user])

    const handleSave = async (section: 'profile' | 'payout' | 'notifications') => {
        setErrors({})
        const newErrors: Record<string, string> = {}
        let hasError = false

        if (section === 'profile') {
            if (!profile.name || profile.name.trim().length < 2) {
                newErrors.name = "الاسم يجب أن يكون حرفين على الأقل"
                hasError = true
            }
        }

        if (section === 'payout') {
            if (payout.method === 'bank') {
                if (!payout.bankName) {
                    newErrors.bankName = "اسم البنك مطلوب"
                    hasError = true
                }
                if (!payout.accountName) {
                    newErrors.accountName = "اسم صاحب الحساب مطلوب"
                    hasError = true
                }
                if (!payout.iban) {
                    newErrors.iban = "رقم IBAN مطلوب"
                    hasError = true
                }
            } else if (payout.method === 'wallet') {
                if (!/^01[0125][0-9]{8}$/.test(payout.walletNumber)) {
                    newErrors.walletNumber = "يرجى إدخال رقم محفظة صحيح (11 رقم)"
                    hasError = true
                }
            } else if (payout.method === 'instapay') {
                if (!payout.instaPayHandle || !payout.instaPayHandle.includes('@')) {
                    newErrors.instaPayHandle = "عنوان InstaPay غير صحيح (يجب أن يحتوي على @)"
                    hasError = true
                }
            }
        }

        if (hasError) {
            setErrors(newErrors)
            toast.error("يرجى تصحيح الأخطاء قبل الحفظ")
            return
        }

        setIsLoading(true)
        try {
            if (section === 'profile') {
                // Update User Name
                const nameParts = profile.name.trim().split(' ')
                const firstName = nameParts[0]
                const lastName = nameParts.slice(1).join(' ') || "" // Handle single name gracefully

                // 1. Update User basic info
                const userRes = await updateProfile({
                    firstName,
                    lastName: lastName || user?.lastName // Keep old last name if not provided? Or allow empty? Best to require full name.
                })

                // 2. Update Teacher Bio
                await updateTeacherProfile({
                    bioAr: profile.bio,
                    bioEn: profile.bio
                })

                if (userRes.data) {
                    updateUser(userRes.data)
                }
                toast.success("تم حفظ الملف الشخصي بنجاح")
            }

            if (section === 'payout') {
                // Update via User Metadata
                const currentMetadata = user?.metadata || {}
                const userRes = await updateProfile({
                    metadata: {
                        ...currentMetadata,
                        payout: payout
                    }
                })
                if (userRes.data) {
                    updateUser(userRes.data)
                }
                toast.success("تم حفظ بيانات الدفع بنجاح")
            }

            if (section === 'notifications') {
                await updateNotificationPreferences(notifications)
                toast.success("تم حفظ تفضيلات الإشعارات")
            }

        } catch (error: any) {
            console.error(error)
            toast.error(error.message || "حدث خطأ أثناء الحفظ")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex-1 p-8 space-y-8 max-w-4xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold font-cairo flex items-center gap-2">
                    <User className="w-8 h-8 text-primary" />
                    إعدادات الحساب
                </h1>
                <p className="text-muted-foreground mt-1">إدارة الملف الشخصي، طرق الدفع، والإشعارات.</p>
            </div>

            <Tabs defaultValue="profile" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3 lg:w-[500px]">
                    <TabsTrigger value="profile">الملف الشخصي</TabsTrigger>
                    <TabsTrigger value="payout">بيانات الدفع</TabsTrigger>
                    <TabsTrigger value="notifications">الإشعارات</TabsTrigger>
                </TabsList>




                {/* Profile Settings */}
                <TabsContent value="profile">
                    <Card>
                        <CardHeader>
                            <CardTitle>الملف الشخصي</CardTitle>
                            <CardDescription>هذه المعلومات ستظهر للطلاب في صفحة ملفك الشخصي.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center gap-6">
                                <Avatar className="w-24 h-24 border-2 border-muted">
                                    {profile.avatar && <AvatarImage src={profile.avatar} />}
                                    <AvatarFallback className="text-2xl">{profile.name.slice(0, 2)}</AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col gap-2">
                                    <input
                                        type="file"
                                        id="avatar-upload"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;

                                            try {
                                                const toastId = toast.loading("جاري رفع الصورة...");
                                                const res = await api.uploadImage<{ url: string }>('/upload/image', file);

                                                if (res.url) {
                                                    setProfile(prev => ({ ...prev, avatar: res.url }));
                                                    // Autosave metadata
                                                    await updateProfile({ metadata: { ...(user?.metadata || {}), avatar: res.url } });
                                                    if (user) {
                                                        updateUser({ ...user, metadata: { ...(user.metadata || {}), avatar: res.url } } as any);
                                                    }
                                                    toast.success("تم تحديث الصورة بنجاح", { id: toastId });
                                                }
                                            } catch (error) {
                                                console.error("Upload error:", error);
                                                toast.error("حدث خطأ أثناء رفع الصورة");
                                            }
                                        }}
                                    />
                                    <Button variant="outline" className="gap-2" onClick={() => document.getElementById('avatar-upload')?.click()}>
                                        <Upload className="w-4 h-4" />
                                        تغيير الصورة
                                    </Button>
                                    <p className="text-xs text-muted-foreground">يفضل استخدام صورة مربعة (أقل من 5 ميجابايت)</p>
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>الاسم الكامل</Label>
                                    <Input
                                        value={profile.name}
                                        onChange={e => setProfile({ ...profile, name: e.target.value })}
                                        className={errors.name ? "border-red-500" : ""}
                                    />
                                    {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label>البريد الإلكتروني</Label>
                                    <Input value={profile.email} disabled className="bg-muted" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>نبذة تعريفية (Bio)</Label>
                                <Textarea
                                    className="min-h-[120px]"
                                    value={profile.bio}
                                    onChange={e => setProfile({ ...profile, bio: e.target.value })}
                                    placeholder="اكتب نبذة مختصرة عن خبراتك ومؤهلاتك..."
                                />
                                <p className="text-xs text-muted-foreground">اكتب نبذة مختصرة عن خبراتك ومؤهلاتك لجذب الطلاب.</p>
                            </div>
                        </CardContent>
                        <CardFooter className="border-t px-6 py-4">
                            <Button onClick={() => handleSave('profile')} disabled={isLoading} className="gap-2">
                                {isLoading ? "جاري الحفظ..." : "حفظ التغييرات"}
                                {!isLoading && <Save className="w-4 h-4" />}
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                {/* Payout Settings */}
                <TabsContent value="payout">
                    <Card>
                        <CardHeader>
                            <CardTitle>بيانات استلام الأرباح</CardTitle>
                            <CardDescription>أدخل بيانات الحساب البنكي الذي تود تحويل أرباحك إليه.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-4">
                                <Label>طريقة استلام الأرباح</Label>
                                <div className="grid grid-cols-3 gap-4">
                                    <Button
                                        variant={payout.method === 'bank' ? "default" : "outline"}
                                        className="h-20 flex flex-col gap-2"
                                        onClick={() => setPayout({ ...payout, method: 'bank' })}
                                    >
                                        <CreditCard className="w-6 h-6" />
                                        حساب بنكي
                                    </Button>
                                    <Button
                                        variant={payout.method === 'wallet' ? "default" : "outline"}
                                        className="h-20 flex flex-col gap-2"
                                        onClick={() => setPayout({ ...payout, method: 'wallet' })}
                                    >
                                        <Wallet className="w-6 h-6" />
                                        محفظة إلكترونية
                                    </Button>
                                    <Button
                                        variant={payout.method === 'instapay' ? "default" : "outline"}
                                        className="h-20 flex flex-col gap-2"
                                        onClick={() => setPayout({ ...payout, method: 'instapay' })}
                                    >
                                        <ArrowUpRight className="w-6 h-6" />
                                        InstaPay
                                    </Button>
                                </div>
                            </div>

                            {payout.method === 'bank' && (
                                <>
                                    <div className="space-y-2">
                                        <Label>اسم البنك</Label>
                                        <Input
                                            placeholder="مثال: البنك الأهلي المصري"
                                            value={payout.bankName}
                                            onChange={e => setPayout({ ...payout, bankName: e.target.value })}
                                            className={errors.bankName ? "border-red-500" : ""}
                                        />
                                        {errors.bankName && <p className="text-sm text-red-500">{errors.bankName}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label>اسم صاحب الحساب</Label>
                                        <Input
                                            placeholder="الاسم كما يظهر في البطاقة البنكية"
                                            value={payout.accountName}
                                            onChange={e => setPayout({ ...payout, accountName: e.target.value })}
                                            className={errors.accountName ? "border-red-500" : ""}
                                        />
                                        {errors.accountName && <p className="text-sm text-red-500">{errors.accountName}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label>رقم الحساب الدولي (IBAN)</Label>
                                        <div className="relative">
                                            <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                            <Input
                                                className={`pl-9 font-mono dir-ltr ${errors.iban ? "border-red-500" : ""}`}
                                                placeholder="EG00 0000 0000 0000 0000 0000 0000"
                                                value={payout.iban}
                                                onChange={e => setPayout({ ...payout, iban: e.target.value })}
                                            />
                                        </div>
                                        {errors.iban && <p className="text-sm text-red-500">{errors.iban}</p>}
                                    </div>
                                </>
                            )}

                            {payout.method === 'wallet' && (
                                <div className="space-y-2">
                                    <Label>رقم المحفظة</Label>
                                    <div className="relative">
                                        <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <Input
                                            className={`pl-9 font-mono dir-ltr ${errors.walletNumber ? "border-red-500" : ""}`}
                                            placeholder="01xxxxxxxxx"
                                            value={payout.walletNumber}
                                            onChange={e => setPayout({ ...payout, walletNumber: e.target.value })}
                                        />
                                    </div>
                                    {errors.walletNumber && <p className="text-sm text-red-500">{errors.walletNumber}</p>}
                                    <p className="text-xs text-muted-foreground">تأكد من أن الرقم مسجل عليه محفظة إلكترونية (فودافون كاش، اتصالات كاش، إلخ).</p>
                                </div>
                            )}

                            {payout.method === 'instapay' && (
                                <div className="space-y-2">
                                    <Label>عنوان الدفع اللحظي (IPA)</Label>
                                    <div className="relative">
                                        <ArrowUpRight className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <Input
                                            className={`pl-9 font-mono dir-ltr ${errors.instaPayHandle ? "border-red-500" : ""}`}
                                            placeholder="username@instapay"
                                            value={payout.instaPayHandle}
                                            onChange={e => setPayout({ ...payout, instaPayHandle: e.target.value })}
                                        />
                                    </div>
                                    {errors.instaPayHandle && <p className="text-sm text-red-500">{errors.instaPayHandle}</p>}
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="border-t px-6 py-4">
                            <Button onClick={() => handleSave('payout')} disabled={isLoading} className="gap-2">
                                {isLoading ? "جاري الحفظ..." : "حفظ بيانات الدفع"}
                                {!isLoading && <Save className="w-4 h-4" />}
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                {/* Notification Settings */}
                <TabsContent value="notifications">
                    <Card>
                        <CardHeader>
                            <CardTitle>تفضيلات الإشعارات</CardTitle>
                            <CardDescription>اختر كيف ومتى تود استلام التنبيهات.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between space-x-2">
                                <Label htmlFor="email-notif" className="flex flex-col space-y-1">
                                    <span>إشعارات البريد الإلكتروني</span>
                                    <span className="font-normal text-xs text-muted-foreground">استلام ملخص اسبوعي وتقارير الأرباح.</span>
                                </Label>
                                <Switch
                                    id="email-notif"
                                    checked={notifications.email}
                                    onCheckedChange={c => setNotifications({ ...notifications, email: c })}
                                />
                            </div>
                            <div className="flex items-center justify-between space-x-2">
                                <Label htmlFor="sms-notif" className="flex flex-col space-y-1">
                                    <span>رسائل SMS</span>
                                    <span className="font-normal text-xs text-muted-foreground">تنبيهات فورية عند حجز حصة جديدة.</span>
                                </Label>
                                <Switch
                                    id="sms-notif"
                                    checked={notifications.sms}
                                    onCheckedChange={c => setNotifications({ ...notifications, sms: c })}
                                />
                            </div>
                            <div className="flex items-center justify-between space-x-2">
                                <Label htmlFor="join-notif" className="flex flex-col space-y-1">
                                    <span>انضمام طالب جديد</span>
                                    <span className="font-normal text-xs text-muted-foreground">إشعار عند اشتراك طالب جديد في باقاتك.</span>
                                </Label>
                                <Switch
                                    id="join-notif"
                                    checked={notifications.studentJoin}
                                    onCheckedChange={c => setNotifications({ ...notifications, studentJoin: c })}
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="border-t px-6 py-4">
                            <Button onClick={() => handleSave('notifications')} disabled={isLoading} className="gap-2">
                                {isLoading ? "جاري الحفظ..." : "حفظ التفضيلات"}
                                {!isLoading && <Save className="w-4 h-4" />}
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>


            </Tabs>
        </div>
    )
}
