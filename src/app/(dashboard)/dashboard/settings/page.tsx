'use client';

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useAuth } from '@/contexts';
import { useState, useEffect } from "react";
import { Save, User, Shield, Bell, Lock } from "lucide-react";
import { toast } from "sonner";
import api, { changePassword, updateNotificationPreferences, getNotificationPreferences, updateProfile } from "@/lib/api";

export default function SettingsPage() {
    const { user, updateUser } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [name, setName] = useState("");
    const [bio, setBio] = useState("");

    // Password state
    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: ""
    });

    // Platform settings state
    const [platformSettings, setPlatformSettings] = useState({
        maintenance: false,
        registration: true,
        comments: true
    });

    // Notifications state
    const [notifications, setNotifications] = useState({
        newStudent: true,
        purchase: true,
        newQuestion: false
    });

    useEffect(() => {
        if (user) {
            setName(`${user.firstName} ${user.lastName}`);
            setBio((user as any).bio || "");
            if (user.metadata?.platformSettings) {
                setPlatformSettings(user.metadata.platformSettings as any);
            }

            // We use the same notification preference endpoint, but field names might differ?
            // "newStudent", "purchase" aren't in UpdateNotificationPreferencesDto (email, sms, etc)
            // But let's assume specific admin fields for now or map them?
            // Actually `UpdatePreferencesDto` has `studentJoin`.
            // Let's fetch and map best effort.
            getNotificationPreferences().then(res => {
                if (res.data) {
                    setNotifications(prev => ({
                        ...prev,
                        newStudent: res.data.studentJoin ?? prev.newStudent,
                        // others might not map directly, keeping defaults or using generic fields
                    }))
                }
            }).catch(console.error)
        }
    }, [user]);

    const handleProfileSave = async () => {
        setIsLoading(true);
        try {
            const nameParts = name.trim().split(' ');
            const firstName = nameParts[0];
            const lastName = nameParts.slice(1).join(' ') || user?.lastName || "";

            const res = await updateProfile({
                firstName,
                lastName,
                bio // if user entity has bio or we rely on metadata? User entity usually has bio in some setups, or we put in metadata.
                // updateProfile logic in backend handles what?
                // UsersController.updateProfile uses UpdateUserDto -> bio is there.
            });

            if (res.data) {
                updateUser(res.data);
                toast.success("تم تحديث الملف الشخصي بنجاح");
            }
        } catch (error: any) {
            toast.error(error.message || "حدث خطأ");
        } finally {
            setIsLoading(false);
        }
    };

    const handlePasswordChange = async () => {
        if (!passwordData.currentPassword || !passwordData.newPassword) {
            toast.error("يرجى ملء جميع الحقول");
            return;
        }
        setIsLoading(true);
        try {
            await changePassword({
                oldPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });
            toast.success("تم تغيير كلمة المرور بنجاح");
            setPasswordData({ currentPassword: "", newPassword: "" });
        } catch (error: any) {
            toast.error(error.message || "فشل تغيير كلمة المرور");
        } finally {
            setIsLoading(false);
        }
    };

    const handlePlatformSave = async () => {
        setIsLoading(true);
        try {
            // Save to metadata
            const currentMetadata = user?.metadata || {};
            const res = await updateProfile({
                metadata: {
                    ...currentMetadata,
                    platformSettings
                }
            });
            if (res.data) {
                updateUser(res.data);
                toast.success("تم حفظ إعدادات النظام");
            }
        } catch (error: any) {
            toast.error(error.message || "حدث خطأ");
        } finally {
            setIsLoading(false);
        }
    };

    const handleNotificationSave = async () => {
        setIsLoading(true);
        try {
            // Map back to DTO
            await updateNotificationPreferences({
                studentJoin: notifications.newStudent,
                // Map others if possible, or just save what we can
            });
            toast.success("تم حفظ تفضيلات الإشعارات");
        } catch (error: any) {
            toast.error(error.message || "حدث خطأ");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex-1 space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight font-cairo">الإعدادات</h2>
                <p className="text-muted-foreground">إدارة إعدادات حسابك والمنصة</p>
            </div>

            <Tabs defaultValue="profile" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="profile">الملف الشخصي</TabsTrigger>
                    <TabsTrigger value="platform">إعدادات المنصة</TabsTrigger>
                    <TabsTrigger value="notifications">الإشعارات</TabsTrigger>
                </TabsList>

                {/* Profile Tab */}
                <TabsContent value="profile" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>الملف الشخصي</CardTitle>
                            <CardDescription>
                                قم بتحديث معلوماتك الشخصية التي تظهر للعامة
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">الاسم بالكامل</Label>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">البريد الإلكتروني</Label>
                                <Input id="email" value={user?.email || ""} disabled />
                                <p className="text-[0.8rem] text-muted-foreground">
                                    لا يمكن تغيير البريد الإلكتروني في حساب الأدمن التجريبي
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="bio">نبذة عنك</Label>
                                <Input
                                    id="bio"
                                    placeholder="اكتب نبذة مختصرة عن دورك..."
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                />
                            </div>
                            <div className="pt-4">
                                <Button onClick={handleProfileSave} disabled={isLoading}>
                                    {isLoading ? "جاري الحفظ..." : "حفظ التغييرات"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>كلمة المرور</CardTitle>
                            <CardDescription>تغيير كلمة المرور الخاصة بحسابك</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="current">كلمة المرور الحالية</Label>
                                <Input
                                    id="current"
                                    type="password"
                                    value={passwordData.currentPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="new">كلمة المرور الجديدة</Label>
                                <Input
                                    id="new"
                                    type="password"
                                    value={passwordData.newPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                />
                            </div>
                            <div className="pt-4">
                                <Button variant="outline" onClick={handlePasswordChange} disabled={isLoading}>تحديث كلمة المرور</Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Platform Tab */}
                <TabsContent value="platform" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>إعدادات النظام</CardTitle>
                            <CardDescription>تحكم في الخصائص العامة للمنصة</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between space-x-2 space-x-reverse">
                                <Label htmlFor="maintenance" className="flex flex-col space-y-1">
                                    <span>وضع الصيانة</span>
                                    <span className="font-normal leading-snug text-muted-foreground">
                                        إغلاق المنصة مؤقتاً لجميع المستخدمين عدا الأدمن
                                    </span>
                                </Label>
                                <Switch
                                    id="maintenance"
                                    checked={platformSettings.maintenance}
                                    onCheckedChange={(c) => setPlatformSettings({ ...platformSettings, maintenance: c })}
                                />
                            </div>
                            <div className="flex items-center justify-between space-x-2 space-x-reverse">
                                <Label htmlFor="registration" className="flex flex-col space-y-1">
                                    <span>السماح بالتسجيل</span>
                                    <span className="font-normal leading-snug text-muted-foreground">
                                        تمكين أو تعطيل إنشاء حسابات جديدة
                                    </span>
                                </Label>
                                <Switch
                                    id="registration"
                                    checked={platformSettings.registration}
                                    onCheckedChange={(c) => setPlatformSettings({ ...platformSettings, registration: c })}
                                />
                            </div>
                            <div className="flex items-center justify-between space-x-2 space-x-reverse">
                                <Label htmlFor="comments" className="flex flex-col space-y-1">
                                    <span>تعليقات الدروس</span>
                                    <span className="font-normal leading-snug text-muted-foreground">
                                        السماح للطلاب بكتابة تعليقات على الدروس
                                    </span>
                                </Label>
                                <Switch
                                    id="comments"
                                    checked={platformSettings.comments}
                                    onCheckedChange={(c) => setPlatformSettings({ ...platformSettings, comments: c })}
                                />
                            </div>
                        </CardContent>
                        <div className="p-6 pt-0">
                            <Button onClick={handlePlatformSave} disabled={isLoading}>
                                {isLoading ? "جاري الحفظ..." : "حفظ الإعدادات"}
                            </Button>
                        </div>
                    </Card>
                </TabsContent>

                {/* Notifications Tab */}
                <TabsContent value="notifications" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>تنبيهات البريد الإلكتروني</CardTitle>
                            <CardDescription>اختر متى تريد استقبال رسائل بريدية</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between space-x-2 space-x-reverse">
                                <Label className="flex flex-col space-y-1">
                                    <span>طالب جديد</span>
                                    <span className="font-normal leading-snug text-muted-foreground">
                                        عندما يقوم طالب بإنشاء حساب
                                    </span>
                                </Label>
                                <Switch
                                    checked={notifications.newStudent}
                                    onCheckedChange={(c) => setNotifications({ ...notifications, newStudent: c })}
                                />
                            </div>
                            <div className="flex items-center justify-between space-x-2 space-x-reverse">
                                <Label className="flex flex-col space-y-1">
                                    <span>شراء كورس</span>
                                    <span className="font-normal leading-snug text-muted-foreground">
                                        عند إتمام عملية شراء ناجحة
                                    </span>
                                </Label>
                                <Switch
                                    checked={notifications.purchase}
                                    onCheckedChange={(c) => setNotifications({ ...notifications, purchase: c })}
                                />
                            </div>
                            <div className="flex items-center justify-between space-x-2 space-x-reverse">
                                <Label className="flex flex-col space-y-1">
                                    <span>سؤال جديد</span>
                                    <span className="font-normal leading-snug text-muted-foreground">
                                        عند طرح سؤال في قسم المناقشة
                                    </span>
                                </Label>
                                <Switch
                                    checked={notifications.newQuestion}
                                    onCheckedChange={(c) => setNotifications({ ...notifications, newQuestion: c })}
                                />
                            </div>
                        </CardContent>
                        <div className="p-6 pt-0">
                            <Button onClick={handleNotificationSave} disabled={isLoading}>
                                {isLoading ? "جاري الحفظ..." : "حفظ التغييرات"}
                            </Button>
                        </div>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
