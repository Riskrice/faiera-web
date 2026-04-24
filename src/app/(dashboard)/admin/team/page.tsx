"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck, UserPlus, Users, Shield, History, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/auth-context";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  createAdmin,
  getAdmins,
  getAuditLogs,
  getRoles,
  revokeAdmin,
  updateAdminRole,
  type AdminAuditLog,
  type AdminRole,
  type AdminUser,
} from "@/lib/rbac";

interface NewAdminForm {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  roleId: string;
}

const defaultForm: NewAdminForm = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  phone: "",
  roleId: "",
};

function randomIndex(max: number) {
  const bytes = new Uint32Array(1);
  window.crypto.getRandomValues(bytes);
  return bytes[0] % max;
}

function generateSecurePassword(length = 14) {
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const digits = "0123456789";
  const symbols = "!@#$%^&*()-_=+[]{}";
  const all = lowercase + uppercase + digits + symbols;

  const chars: string[] = [
    lowercase[randomIndex(lowercase.length)],
    uppercase[randomIndex(uppercase.length)],
    digits[randomIndex(digits.length)],
    symbols[randomIndex(symbols.length)],
  ];

  for (let i = chars.length; i < length; i += 1) {
    chars.push(all[randomIndex(all.length)]);
  }

  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = randomIndex(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join("");
}

function formatDate(value?: string) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("ar-EG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function displayName(admin: AdminUser) {
  const first = admin.user?.firstName || "";
  const last = admin.user?.lastName || "";
  const full = `${first} ${last}`.trim();
  return full || admin.user?.email || "-";
}

function roleLabel(role?: AdminRole) {
  return role?.name || "-";
}

function actionLabel(action: string, resource: string) {
  const map: Record<string, string> = {
    "admin.create:admins": "إنشاء مشرف",
    "admin.assign:admins": "تعيين مشرف",
    "admin.role_update:admins": "تحديث دور مشرف",
    "admin.revoke:admins": "إلغاء صلاحيات مشرف",
    "role.create:roles": "إنشاء دور",
    "role.update:roles": "تعديل دور",
    "role.delete:roles": "حذف دور",
  };

  return map[`${action}:${resource}`] || `${action} / ${resource}`;
}

export default function TeamManagementPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newAdmin, setNewAdmin] = useState<NewAdminForm>(defaultForm);
  const [pendingRoleByUser, setPendingRoleByUser] = useState<Record<string, string>>({});

  const hasAdminAccess = user?.role === "admin" || user?.role === "super_admin";

  const assignableRoles = useMemo(() => roles.filter((role) => role.name !== "Super Admin"), [roles]);

  const filteredAdmins = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return admins;

    return admins.filter((admin) => {
      const name = displayName(admin).toLowerCase();
      const email = admin.user?.email?.toLowerCase() || "";
      const role = roleLabel(admin.role).toLowerCase();
      return name.includes(query) || email.includes(query) || role.includes(query);
    });
  }, [admins, searchTerm]);

  const reload = async () => {
    setLoading(true);
    try {
      const [adminsData, rolesData, auditData] = await Promise.all([
        getAdmins(),
        getRoles(),
        getAuditLogs({ page: 1, pageSize: 10 }),
      ]);

      setAdmins(adminsData);
      setRoles(rolesData);
      setAuditLogs(auditData.logs);

      setPendingRoleByUser(
        Object.fromEntries(adminsData.map((admin) => [admin.userId, admin.role?.id || ""])),
      );

      if (!newAdmin.roleId && rolesData.length > 0) {
        setNewAdmin((prev) => ({
          ...prev,
          roleId: rolesData.find((role) => role.name !== "Super Admin")?.id || rolesData[0].id,
        }));
      }
    } catch (error: any) {
      toast.error(error?.message || "تعذر تحميل بيانات المشرفين");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      router.replace("/login");
      return;
    }

    if (!hasAdminAccess) {
      router.replace("/dashboard");
      return;
    }

    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, hasAdminAccess, router]);

  if (authLoading) {
    return (
      <div className="mx-auto w-full max-w-7xl p-6 text-center text-sm text-muted-foreground md:p-10" dir="rtl">
        جاري التحقق من الجلسة...
      </div>
    );
  }

  if (!user || !hasAdminAccess) {
    return null;
  }

  const resetForm = () => {
    setNewAdmin({
      ...defaultForm,
      roleId: assignableRoles[0]?.id || "",
    });
  };

  const handleCreateAdmin = async () => {
    if (!newAdmin.firstName || !newAdmin.lastName || !newAdmin.email || !newAdmin.password || !newAdmin.roleId) {
      toast.error("يرجى استكمال بيانات المشرف الجديدة");
      return;
    }

    setSaving(true);
    try {
      await createAdmin({
        firstName: newAdmin.firstName,
        lastName: newAdmin.lastName,
        email: newAdmin.email,
        password: newAdmin.password,
        phone: newAdmin.phone || undefined,
        roleId: newAdmin.roleId,
      });

      toast.success("تم إنشاء المشرف وإرسال رسالة ترحيب له عبر البريد الإلكتروني");
      setDialogOpen(false);
      resetForm();
      await reload();
    } catch (error: any) {
      toast.error(error?.message || "فشل إنشاء المشرف");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateRole = async (admin: AdminUser) => {
    const nextRoleId = pendingRoleByUser[admin.userId];
    if (!nextRoleId || nextRoleId === admin.role?.id) {
      return;
    }

    setSaving(true);
    try {
      await updateAdminRole(admin.userId, nextRoleId);
      toast.success("تم تحديث الدور بنجاح");
      await reload();
    } catch (error: any) {
      toast.error(error?.message || "تعذر تحديث الدور");
    } finally {
      setSaving(false);
    }
  };

  const handleRevoke = async (admin: AdminUser) => {
    const confirmed = window.confirm("تأكيد إلغاء صلاحيات هذا المشرف؟");
    if (!confirmed) return;

    setSaving(true);
    try {
      await revokeAdmin(admin.userId);
      toast.success("تم إلغاء صلاحيات المشرف");
      await reload();
    } catch (error: any) {
      toast.error(error?.message || "تعذر إلغاء الصلاحيات");
    } finally {
      setSaving(false);
    }
  };

  const handleGeneratePassword = () => {
    const generatedPassword = generateSecurePassword();
    setNewAdmin((prev) => ({ ...prev, password: generatedPassword }));
    toast.success("تم توليد كلمة مرور قوية تلقائيًا");
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-6 md:p-10" dir="rtl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">إدارة المشرفين</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            إضافة المشرفين وتعديل الأدوار ومتابعة سجل تغييرات الصلاحيات من شاشة واحدة.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/roles">إدارة الأدوار</Link>
          </Button>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="ml-2 h-4 w-4" />
                إضافة مشرف
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[560px]">
              <div dir="rtl">
                <DialogHeader>
                  <DialogTitle>إضافة مشرف جديد</DialogTitle>
                  <DialogDescription>
                    سيتم إنشاء حساب جديد وتعيين دور إداري له مباشرة، وإرسال رسالة ترحيب عبر البريد الإلكتروني.
                  </DialogDescription>
                </DialogHeader>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Input
                  placeholder="الاسم الأول"
                  value={newAdmin.firstName}
                  onChange={(event) => setNewAdmin((prev) => ({ ...prev, firstName: event.target.value }))}
                />
                <Input
                  placeholder="الاسم الأخير"
                  value={newAdmin.lastName}
                  onChange={(event) => setNewAdmin((prev) => ({ ...prev, lastName: event.target.value }))}
                />
                <Input
                  placeholder="البريد الإلكتروني"
                  type="email"
                  value={newAdmin.email}
                  onChange={(event) => setNewAdmin((prev) => ({ ...prev, email: event.target.value }))}
                  className="sm:col-span-2"
                />
                <div className="space-y-2">
                  <Input
                    placeholder="كلمة المرور"
                    type="password"
                    value={newAdmin.password}
                    onChange={(event) => setNewAdmin((prev) => ({ ...prev, password: event.target.value }))}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={handleGeneratePassword}
                  >
                    توليد تلقائي لكلمة المرور
                  </Button>
                </div>
                <Input
                  placeholder="رقم الهاتف (اختياري)"
                  value={newAdmin.phone}
                  onChange={(event) => setNewAdmin((prev) => ({ ...prev, phone: event.target.value }))}
                />

                <div className="sm:col-span-2">
                  <Select
                    value={newAdmin.roleId}
                    onValueChange={(roleId) => setNewAdmin((prev) => ({ ...prev, roleId }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الدور الإداري" />
                    </SelectTrigger>
                    <SelectContent>
                      {assignableRoles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                </div>

                <DialogFooter className="mt-4">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    إلغاء
                  </Button>
                  <Button onClick={handleCreateAdmin} disabled={saving}>
                    {saving ? "جارٍ الحفظ..." : "إنشاء المشرف"}
                  </Button>
                </DialogFooter>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>إجمالي المشرفين النشطين</CardDescription>
            <CardTitle className="text-2xl">{admins.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>الأدوار المتاحة للتعيين</CardDescription>
            <CardTitle className="text-2xl">{assignableRoles.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <Shield className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>آخر عمليات سجل التدقيق</CardDescription>
            <CardTitle className="text-2xl">{auditLogs.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <History className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>فريق الإدارة</CardTitle>
            <CardDescription>تعديل دور كل مشرف أو إلغاء صلاحياته.</CardDescription>
          </div>

          <div className="flex w-full items-center gap-2 sm:w-auto">
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="بحث بالاسم أو البريد أو الدور"
              className="sm:w-80"
            />
            <Button variant="outline" size="icon" onClick={reload} disabled={loading || saving}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="py-10 text-center text-sm text-muted-foreground">جارٍ تحميل بيانات المشرفين...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>المشرف</TableHead>
                  <TableHead>البريد</TableHead>
                  <TableHead>الدور الحالي</TableHead>
                  <TableHead>تعديل الدور</TableHead>
                  <TableHead className="text-left">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAdmins.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                      لا يوجد مشرفون مطابقون لبحثك.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAdmins.map((admin) => (
                    <TableRow key={admin.id}>
                      <TableCell className="font-medium">{displayName(admin)}</TableCell>
                      <TableCell>{admin.user?.email || "-"}</TableCell>
                      <TableCell>
                        <div className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
                          <ShieldCheck className="ml-1 h-3.5 w-3.5" />
                          {roleLabel(admin.role)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={pendingRoleByUser[admin.userId] || admin.role?.id || ""}
                          onValueChange={(roleId) =>
                            setPendingRoleByUser((prev) => ({
                              ...prev,
                              [admin.userId]: roleId,
                            }))
                          }
                        >
                          <SelectTrigger className="h-9 w-52">
                            <SelectValue placeholder="اختر الدور" />
                          </SelectTrigger>
                          <SelectContent>
                            {assignableRoles.map((role) => (
                              <SelectItem key={role.id} value={role.id}>
                                {role.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="space-x-2 space-x-reverse text-left">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={saving}
                          onClick={() => handleUpdateRole(admin)}
                        >
                          حفظ الدور
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={saving}
                          onClick={() => handleRevoke(admin)}
                        >
                          إلغاء الصلاحيات
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>آخر عمليات التدقيق</CardTitle>
          <CardDescription>آخر 10 عمليات إدارية مسجلة على النظام.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {auditLogs.length === 0 ? (
            <div className="text-sm text-muted-foreground">لا توجد عمليات بعد.</div>
          ) : (
            auditLogs.map((log) => (
              <div
                key={log.id}
                className="rounded-lg border border-border/60 bg-muted/20 p-3 text-sm"
              >
                <div className="font-semibold">{actionLabel(log.action, log.resource)}</div>
                <div className="text-muted-foreground">
                  بواسطة {log.actor?.firstName || "-"} {log.actor?.lastName || ""}
                  {log.targetUser ? ` - على ${log.targetUser.firstName} ${log.targetUser.lastName}` : ""}
                </div>
                <div className="text-xs text-muted-foreground">{formatDate(log.createdAt)}</div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
