"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { User, Lock, Bell, Mail, Smartphone, Globe, Moon, Shield, Save, Upload, Camera, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/contexts"
import { updateProfile, uploadAvatar, changePassword } from "@/lib/api"

export default function StudentSettingsPage() {
    const { user, updateUser } = useAuth()
    const [isLoading, setIsLoading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [userData, setUserData] = useState({
        name: "",
        email: "",
        bio: "",
        phone: "",
        avatar: "",
        notifications: {
            email: true,
            push: true,
            marketing: false
        }
    })

    const [passwords, setPasswords] = useState({
        current: "",
        new: "",
        confirm: ""
    })

    useEffect(() => {
        if (user) {
            setUserData(prev => ({
                ...prev,
                name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
                email: user.email || "",
                phone: user.phone || "",
                bio: (user.metadata as any)?.bio || "",
                avatar: (user.metadata as any)?.avatar || ""
            }))
        }
    }, [user])

    const calculateStrength = (password: string) => {
        let strength = 0;
        if (password.length > 5) strength += 20;
        if (password.length > 7) strength += 20;
        if (/[A-Z]/.test(password)) strength += 20;
        if (/[0-9]/.test(password)) strength += 20;
        if (/[^A-Za-z0-9]/.test(password)) strength += 20;
        return strength;
    }

    const passwordStrength = calculateStrength(passwords.new);

    const getStrengthLabel = (strength: number) => {
        if (strength < 40) return "ضعيف";
        if (strength < 80) return "متوسط";
        return "قوي";
    }

    const getStrengthColor = (strength: number, bg = false) => {
        if (strength < 40) return bg ? "bg-destructive" : "text-destructive";
        if (strength < 80) return bg ? "bg-yellow-500" : "text-yellow-500";
        return bg ? "bg-green-500" : "text-green-500";
    }

    const handleSave = async () => {
        setIsLoading(true)
        try {
            const nameParts = userData.name.trim().split(' ');
            if (nameParts.length < 2) {
                toast.error("الرجاء إدخال الاسم بالكامل (الاسم الأول والأخير)");
                setIsLoading(false);
                return;
            }

            const firstName = nameParts[0];
            const lastName = nameParts.slice(1).join(' ');

            if (firstName.length < 2 || lastName.length < 2) {
                toast.error("يجب أن يتكون كل من الاسم الأول والأخير من حرفين على الأقل");
                setIsLoading(false);
                return;
            }

            const payload = {
                firstName,
                lastName,
                phone: userData.phone,
                bio: userData.bio
            };

            const response = await updateProfile(payload);

            // Check if response has data property (standard API response)
            const updatedUser = (response as any).data || response;

            if (updatedUser) {
                updateUser(updatedUser);
                toast.success("تم تحديث الملف الشخصي بنجاح");

                // Update local state to match guaranteed saved data
                setUserData(prev => ({
                    ...prev,
                    name: `${updatedUser.firstName || ''} ${updatedUser.lastName || ''}`.trim(),
                    phone: updatedUser.phone || prev.phone,
                    bio: (updatedUser.metadata as any)?.bio || prev.bio
                }));
            } else {
                throw new Error("لم يتم استلام بيانات المحدثة");
            }
        } catch (error: any) {
            console.error("Profile update error:", error);
            toast.error(error.message || "حدث خطأ أثناء التحديث");
        } finally {
            setIsLoading(false);
        }
    }

    const handlePasswordChange = async () => {
        setIsLoading(true)
        try {
            await changePassword({
                currentPassword: passwords.current,
                newPassword: passwords.new
            })
            toast.success("تم تغيير كلمة المرور بنجاح")
            setPasswords({ current: "", new: "", confirm: "" })
        } catch (error: any) {
            toast.error(error.message || "فشل تغيير كلمة المرور")
        } finally {
            setIsLoading(false)
        }
    }

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (file.size > 2 * 1024 * 1024) {
            toast.error("حجم الصورة يجب أن يكون أقل من 2 ميجابايت")
            return
        }

        const toastId = toast.loading("جاري رفع الصورة...")
        try {
            const res = await uploadAvatar(file)
            if (res.url) {
                setUserData(prev => ({ ...prev, avatar: res.url }))
                toast.success("تم تحديث الصورة الشخصية")
            }
        } catch (error) {
            toast.error("فشل رفع الصورة")
        } finally {
            toast.dismiss(toastId)
        }
    }

    return (
        <div className="flex-1 space-y-6 p-4 md:p-8 max-w-5xl mx-auto">
            <div className="flex flex-col gap-2">
                <h2 className="text-3xl font-bold tracking-tight text-foreground">إعدادات الحساب</h2>
                <p className="text-muted-foreground">قم بإدارة بياناتك الشخصية، الأمان، وتفضيلات الإشعارات.</p>
            </div>

            <Tabs defaultValue="profile" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
                    <TabsTrigger value="profile">الملف الشخصي</TabsTrigger>
                    <TabsTrigger value="account">أمان الحساب</TabsTrigger>
                    <TabsTrigger value="notifications">التفضيلات</TabsTrigger>
                </TabsList>

                <TabsContent value="profile" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="w-5 h-5 text-primary" />
                                المعلومات الشخصية
                            </CardTitle>
                            <CardDescription>هذه المعلومات ستكون ظاهرة في ملفك الشخصي.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-8">
                            <div className="flex flex-col sm:flex-row items-center gap-6">
                                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                    <Avatar className="h-24 w-24 border-4 border-muted">
                                        <AvatarImage src={userData.avatar || "https://github.com/shadcn.png"} alt="@user" />
                                        <AvatarFallback>UN</AvatarFallback>
                                    </Avatar>
                                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Camera className="w-8 h-8 text-white" />
                                    </div>
                                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                                </div>
                                <div className="text-center sm:text-right space-y-2">
                                    <h3 className="font-medium">الصورة الشخصية</h3>
                                    <p className="text-sm text-muted-foreground max-w-[250px]">نقبل صور بصيغة JPG, GIF أو PNG. الحجم الأقصى 2 ميجابايت.</p>
                                    <Button variant="outline" size="sm" className="mt-2" onClick={() => fileInputRef.current?.click()}>
                                        <Upload className="w-4 h-4 ml-2" />
                                        تغيير الصورة
                                    </Button>
                                </div>
                            </div>

                            <Separator />

                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="fullName">الاسم الكامل</Label>
                                    <Input id="fullName" value={userData.name} onChange={(e) => setUserData({ ...userData, name: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">رقم الهاتف</Label>
                                    <Input id="phone" value={userData.phone} dir="ltr" placeholder="+20 1xxxxxxxxx" onChange={(e) => setUserData({ ...userData, phone: e.target.value })} />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="bio">نبذة عني</Label>
                                    <Textarea id="bio" className="min-h-[100px] resize-none" placeholder="اكتب نبذة مختصرة عنك..." value={userData.bio} onChange={(e) => setUserData({ ...userData, bio: e.target.value })} />
                                    <p className="text-[0.8rem] text-muted-foreground">اكتب وصفاً مختصراً يظهر في ملفك الشخصي للمدربين والزملاء.</p>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="border-t bg-muted/50 px-6 py-4">
                            <Button className="gap-2" onClick={handleSave} disabled={isLoading}>
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                {isLoading ? "جاري الحفظ..." : "حفظ التغييرات"}
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                <TabsContent value="account" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="w-5 h-5 text-primary" />
                                الحساب والأمان
                            </CardTitle>
                            <CardDescription>إدارة كلمة المرور والبريد الإلكتروني المرتبط بحسابك.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">البريد الإلكتروني</Label>
                                    <div className="relative">
                                        <Mail className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input id="email" value={userData.email} disabled className="pr-9 bg-muted" />
                                    </div>
                                    <p className="text-[0.8rem] text-muted-foreground">لا يمكن تغيير البريد الإلكتروني. تواصل مع الدعم إذا كنت بحاجة لذلك.</p>
                                </div>
                            </div>

                            <Separator />

                            <div className="space-y-4">
                                <h3 className="text-lg font-medium">تغيير كلمة المرور</h3>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="current-password">كلمة المرور الحالية</Label>
                                        <div className="relative">
                                            <Lock className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input id="current-password" type="password" className="pr-9" value={passwords.current} onChange={(e) => setPasswords({ ...passwords, current: e.target.value })} />
                                        </div>
                                    </div>
                                </div>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="new-password">كلمة المرور الجديدة</Label>
                                        <div className="relative">
                                            <Lock className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input id="new-password" type="password" className="pr-9" value={passwords.new} onChange={(e) => setPasswords({ ...passwords, new: e.target.value })} />
                                        </div>
                                        {passwords.new && (
                                            <div className="space-y-2 mt-2">
                                                <div className="flex justify-between text-xs">
                                                    <span className={getStrengthColor(passwordStrength)}>{getStrengthLabel(passwordStrength)}</span>
                                                    <span className="text-muted-foreground">{passwordStrength}%</span>
                                                </div>
                                                <Progress value={passwordStrength} className="h-2" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="confirm-password">تأكيد كلمة المرور</Label>
                                        <div className="relative">
                                            <Lock className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input id="confirm-password" type="password" className="pr-9" value={passwords.confirm} onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} />
                                        </div>
                                        {passwords.confirm && passwords.new !== passwords.confirm && (
                                            <p className="text-xs text-destructive animate-pulse">كلمات المرور غير متطابقة</p>
                                        )}
                                        {passwords.confirm && passwords.new === passwords.confirm && (
                                            <p className="text-xs text-green-600 flex items-center gap-1">
                                                <Shield className="w-3 h-3" /> متطابقة
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="border-t bg-muted/50 px-6 py-4">
                            <Button className="gap-2" variant="secondary" disabled={isLoading || !passwords.current || !passwords.new || !passwords.confirm || passwords.new !== passwords.confirm} onClick={handlePasswordChange}>
                                {isLoading ? "جاري التحديث..." : "تحديث كلمة المرور"}
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                <TabsContent value="notifications" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Bell className="w-5 h-5 text-primary" />
                                الإشعارات والتفضيلات
                            </CardTitle>
                            <CardDescription>اختر كيف تريد أن نتواصل معك وما هي التنبيهات التي تود استلامها.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-8">
                            <div className="space-y-4">
                                <h3 className="font-medium flex items-center gap-2">
                                    <Mail className="w-4 h-4" />
                                    إشعارات البريد الإلكتروني
                                </h3>
                                <div className="flex items-center justify-between space-x-2 border p-4 rounded-lg">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">تحديثات الكورسات</Label>
                                        <p className="text-sm text-muted-foreground">استلام إشعارات عند إضافة دروس جديدة أو تحديثات في الكورسات المشترك بها.</p>
                                    </div>
                                    <Switch checked={userData.notifications.email} onCheckedChange={(checked) => setUserData({ ...userData, notifications: { ...userData.notifications, email: checked } })} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}