"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Pencil, Plus, ShieldAlert, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/auth-context";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  createRole,
  deleteRole,
  getPermissions,
  getRoles,
  updateRole,
  type AdminRole,
  type Permission,
} from "@/lib/rbac";

interface RoleForm {
  name: string;
  description: string;
  permissionIds: string[];
}

const defaultForm: RoleForm = {
  name: "",
  description: "",
  permissionIds: [],
};

function mapPermissionLabel(permission: Permission) {
  if (permission.name?.trim()) return permission.name;
  return `${permission.action} : ${permission.resource}`;
}

export default function RoleBuilderPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [form, setForm] = useState<RoleForm>(defaultForm);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const hasAdminAccess = user?.role === "admin" || user?.role === "super_admin";

  const permissionGroups = useMemo(() => {
    const grouped: Record<string, Permission[]> = {};

    for (const permission of permissions) {
      const key = permission.resource || "other";
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(permission);
    }

    return Object.entries(grouped)
      .map(([resource, items]) => ({
        resource,
        label: resource === "all" ? "صلاحيات عامة" : resource,
        items: items.sort((a, b) => mapPermissionLabel(a).localeCompare(mapPermissionLabel(b), "ar")),
      }))
      .sort((a, b) => a.label.localeCompare(b.label, "ar"));
  }, [permissions]);

  const filteredRoles = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return roles;

    return roles.filter((role) => {
      return (
        role.name.toLowerCase().includes(query) ||
        (role.description || "").toLowerCase().includes(query)
      );
    });
  }, [roles, searchTerm]);

  const reload = async () => {
    setLoading(true);
    try {
      const [rolesData, permissionsData] = await Promise.all([getRoles(), getPermissions()]);
      setRoles(rolesData);
      setPermissions(permissionsData);
    } catch (error: any) {
      toast.error(error?.message || "تعذر تحميل الأدوار والصلاحيات");
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
    setForm(defaultForm);
    setSelectedRoleId(null);
  };

  const openCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (role: AdminRole) => {
    setSelectedRoleId(role.id);
    setForm({
      name: role.name,
      description: role.description || "",
      permissionIds: role.permissions?.map((permission) => permission.id) || [],
    });
    setDialogOpen(true);
  };

  const togglePermission = (permissionId: string) => {
    setForm((prev) => ({
      ...prev,
      permissionIds: prev.permissionIds.includes(permissionId)
        ? prev.permissionIds.filter((id) => id !== permissionId)
        : [...prev.permissionIds, permissionId],
    }));
  };

  const selectGroup = (permissionIds: string[]) => {
    const allSelected = permissionIds.every((id) => form.permissionIds.includes(id));

    setForm((prev) => ({
      ...prev,
      permissionIds: allSelected
        ? prev.permissionIds.filter((id) => !permissionIds.includes(id))
        : Array.from(new Set([...prev.permissionIds, ...permissionIds])),
    }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("اسم الدور مطلوب");
      return;
    }

    if (form.permissionIds.length === 0) {
      toast.error("اختر صلاحية واحدة على الأقل");
      return;
    }

    setSaving(true);
    try {
      if (selectedRoleId) {
        await updateRole(selectedRoleId, {
          name: form.name,
          description: form.description,
          permissionIds: form.permissionIds,
        });
        toast.success("تم تحديث الدور بنجاح");
      } else {
        await createRole({
          name: form.name,
          description: form.description,
          permissionIds: form.permissionIds,
        });
        toast.success("تم إنشاء الدور بنجاح");
      }

      setDialogOpen(false);
      resetForm();
      await reload();
    } catch (error: any) {
      toast.error(error?.message || "تعذر حفظ الدور");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRole = async (role: AdminRole) => {
    if (role.isSystem || role.name === "Super Admin") {
      toast.error("لا يمكن حذف دور نظام محمي");
      return;
    }

    const confirmed = window.confirm(`تأكيد حذف الدور: ${role.name}؟`);
    if (!confirmed) return;

    setSaving(true);
    try {
      await deleteRole(role.id);
      toast.success("تم حذف الدور");
      await reload();
    } catch (error: any) {
      toast.error(error?.message || "تعذر حذف الدور");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-6 md:p-10" dir="rtl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">إدارة الأدوار والصلاحيات</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            إنشاء أدوار جديدة وتحديث صلاحياتها وفق نموذج صلاحيات دقيق.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/team">العودة للمشرفين</Link>
          </Button>
          <Button onClick={openCreate}>
            <Plus className="ml-2 h-4 w-4" />
            دور جديد
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>قائمة الأدوار</CardTitle>
            <CardDescription>عرض وتعديل وحذف الأدوار الإدارية.</CardDescription>
          </div>
          <Input
            placeholder="بحث باسم الدور أو الوصف"
            className="sm:w-80"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-10 text-center text-sm text-muted-foreground">جارٍ تحميل الأدوار...</div>
          ) : filteredRoles.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">لا توجد أدوار لعرضها.</div>
          ) : (
            <div className="space-y-3">
              {filteredRoles.map((role) => (
                <div
                  key={role.id}
                  className="flex flex-col gap-3 rounded-lg border border-border/60 bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold">{role.name}</h3>
                      {role.isSystem && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                          نظام
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{role.description || "بدون وصف"}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      عدد الصلاحيات: {role.permissions?.length || 0}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEdit(role)}>
                      <Pencil className="ml-1 h-4 w-4" />
                      تعديل
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteRole(role)}
                      disabled={saving}
                    >
                      <Trash2 className="ml-1 h-4 w-4" />
                      حذف
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <div dir="rtl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-primary" />
                {selectedRoleId ? "تعديل الدور" : "إنشاء دور جديد"}
              </DialogTitle>
              <DialogDescription>
                اختر اسم الدور ووصفه ثم فعل الصلاحيات المناسبة لهذا الدور.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Input
              placeholder="اسم الدور"
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            />
            <Input
              placeholder="وصف الدور (اختياري)"
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            />
            </div>

            <div className="mt-4 space-y-4">
            {permissionGroups.map((group) => {
              const groupIds = group.items.map((permission) => permission.id);
              const activeCount = groupIds.filter((id) => form.permissionIds.includes(id)).length;
              const allSelected = groupIds.length > 0 && activeCount === groupIds.length;

              return (
                <Card key={group.resource}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base">{group.label}</CardTitle>
                        <CardDescription>
                          {activeCount} من {groupIds.length} صلاحيات مفعلة
                        </CardDescription>
                      </div>

                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => selectGroup(groupIds)}
                      >
                        {allSelected ? "إلغاء الكل" : "تحديد الكل"}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="grid gap-2 sm:grid-cols-2">
                    {group.items.map((permission) => {
                      const checked = form.permissionIds.includes(permission.id);

                      return (
                        <label
                          key={permission.id}
                          className="flex cursor-pointer items-center justify-between rounded-md border border-border/60 p-2 text-sm"
                        >
                          <span>{mapPermissionLabel(permission)}</span>
                          <span className="ml-2 inline-flex items-center gap-1">
                            {checked && <Check className="h-3.5 w-3.5 text-primary" />}
                            <Checkbox checked={checked} onCheckedChange={() => togglePermission(permission.id)} />
                          </span>
                        </label>
                      );
                    })}
                  </CardContent>
                </Card>
              );
            })}
            </div>

            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                إلغاء
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "جارٍ الحفظ..." : selectedRoleId ? "تحديث الدور" : "إنشاء الدور"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
