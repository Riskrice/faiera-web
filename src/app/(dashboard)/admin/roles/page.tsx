"use client";

import React, { useState, useEffect } from 'react';
import { ShieldAlert, Check, Search, Save, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { getPermissions, createRole, Permission } from '@/lib/rbac';
import { useToast } from '@/components/ui/use-toast';

export default function RoleBuilderPage() {
  const [permissionGroups, setPermissionGroups] = useState<any[]>([]);
  const { toast } = useToast();

  const resourceTranslations: Record<string, string> = {
    'users': 'إدارة المستخدمين',
    'roles': 'صلاحيات المشرفين',
    'courses': 'إدارة الكورسات',
    'sessions': 'إدارة الحصص',
    'payments': 'إدارة المدفوعات',
    'settings': 'الإعدادات العامة'
  };

  useEffect(() => {
    getPermissions().then((res: any) => {
      const data: Permission[] = res.data || res;
      if (Array.isArray(data)) {
         const grouped = data.reduce((acc: any, perm) => {
            if (!acc[perm.resource]) acc[perm.resource] = [];
            acc[perm.resource].push(perm);
            return acc;
         }, {});
         const mapped = Object.keys(grouped).map(resource => ({
            group: resourceTranslations[resource] || (resource.charAt(0).toUpperCase() + resource.slice(1) + ' Management'),
            id: resource,
            permissions: grouped[resource].map((p: any) => ({
               id: p.id,
               label: p.name, // The backend currently returns Arabic names
               description: p.description || عملية:  في قسم 
            }))
         }));
         setPermissionGroups(mapped);
      }
    }).catch(console.error);
  }, []);

  const [roleName, setRoleName] = useState('');
  const [roleDesc, setRoleDesc] = useState('');
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredGroups = permissionGroups.map(group => {
    return {
      ...group,
      permissions: group.permissions.filter((p: any) => p.label.toLowerCase().includes(searchTerm.toLowerCase()) || p.description.toLowerCase().includes(searchTerm.toLowerCase()))
    }
  }).filter(group => group.permissions.length > 0);

  const togglePermission = (id: string) => {
    setSelectedPerms(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleSelectGroup = (groupId: string, selectAll: boolean) => {
    const groupPerms = permissionGroups.find(g => g.id === groupId)?.permissions.map((p: any) => p.id) || [];
    if (selectAll) {
      setSelectedPerms(prev => Array.from(new Set([...prev, ...groupPerms])));
    } else {
      setSelectedPerms(prev => prev.filter(p => !groupPerms.includes(p)));
    }
  };

  const handleSave = async () => {
    if (!roleName) {
      toast({ title: "خطأ", description: "الرجاء كتابة اسم الصلاحية", variant: "destructive" });
      return;
    }
    if (selectedPerms.length === 0) {
      toast({ title: "خطأ", description: "الرجاء اختيار بعض الصلاحيات", variant: "destructive" });
      return;
    }
    try {
      await createRole({ name: roleName, description: roleDesc, permissionIds: selectedPerms });
      toast({ title: "اكتمل", description: "تم حفظ الصلاحية بنجاح." });
      setRoleName('');
      setRoleDesc('');
      setSelectedPerms([]);
    } catch(e: any) {
      toast({ title: "خطأ", description: e?.response?.data?.message || "حدث خطأ غير متوقع", variant: "destructive" });
    }
  };

  return (
    <div className="p-6 md:p-10 space-y-8 max-w-6xl mx-auto font-cairo" dir="rtl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">صلاحيات المشرفين</h1>
          <p className="text-muted-foreground mt-2">
            تمكنك هذه الشاشة من تجهيز باقات من الصلاحيات وتخصيصها لتعيين الموظفين الجدد لاحقاً.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Right Column: Form Details */}
        <div className="lg:col-span-1 space-y-6 lg:order-last">
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldAlert className="text-primary w-5 h-5" />
                تفاصيل الرتبة
              </CardTitle>
              <CardDescription>قم بتسمية وتوصيف هذا الدور والمهمة.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold">اسم الرتبة أو الصلاحية (مثال: محرر محتوى)</label>
                <Input
                  placeholder="محرر محتوى، مراجع مالي..."
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  className="bg-muted/30 font-cairo h-11"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold">الوصف والتوضيح</label>
                <textarea
                  className="w-full flex min-h-[100px] rounded-md border border-input bg-muted/30 px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed font-cairo"
                  placeholder="وصف مبسط لما يمكن لهذا الكيان الجديد فعله في لوحة التحكم..."
                  value={roleDesc}
                  onChange={(e) => setRoleDesc(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter className="bg-muted/20 border-t border-border/50 justify-between items-center py-4 rounded-b-xl">
              <p className="text-xs text-muted-foreground">
                تم تفعيل <span className="font-bold text-primary">{selectedPerms.length}</span> صلاحية
              </p>
              <Button size="sm" className="gap-1 shadow-md h-10 px-4" onClick={handleSave}>
                <Save className="w-4 h-4 ml-1" /> حفظ الصلاحيات
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Left Column: Permissions Matrix */}
        <div className="lg:col-span-2">
          <Card className="border-border/50 shadow-sm h-full">
            <CardHeader className="border-b border-border/50 pb-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-xl">مصفوفة الصلاحيات الجزئية</CardTitle>
                  <CardDescription className="mt-1">
                    حدد الصلاحيات بدقة من النظام. هذه الصلاحيات ستكون قالبًا جاهزًا في إدارة المهام والفِرق.
                  </CardDescription>
                </div>
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="ابحث يدوياً عن صلاحية..." 
                    className="pr-10 h-10 text-sm sm:w-[240px] font-cairo" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/50 max-h-[800px] overflow-y-auto">
                {filteredGroups.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">لا توجد صلاحيات لعرضها.</div>
                ) : filteredGroups.map((group) => {
                  const groupPermIds = group.permissions.map((p: any) => p.id);
                  const activeCount = groupPermIds.filter((id: string) => selectedPerms.includes(id)).length;
                  const isAllSelected = activeCount === groupPermIds.length && activeCount > 0;

                  return (
                    <div key={group.id} className="p-6 transition-colors hover:bg-muted/5 group">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-bold text-primary/80">{group.group}</h3>
                          <p className="text-xs text-muted-foreground">
                            {activeCount} من {group.permissions.length} صلاحيات مفعلة
                          </p>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <span className={ont-semibold }>
                             {isAllSelected ? 'إلغاء التحديد' : 'تحديد الكل'}
                          </span>
                          <Switch
                            checked={isAllSelected}
                            onCheckedChange={(val) => handleSelectGroup(group.id, val)}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
                        {group.permissions.map((perm: any) => (
                          <div
                            key={perm.id}
                            onClick={() => togglePermission(perm.id)}
                            className={cursor-pointer flex items-start gap-4 p-4 rounded-xl border transition-all duration-200 }
                          >
                            <div className={mt-0.5 min-w-5 h-5 rounded flex items-center justify-center border transition-colors }>
                              {selectedPerms.includes(perm.id) && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <div className="flex-1 space-y-1.5 overflow-hidden">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-bold leading-none">{perm.label}</p>
                                <Info className="w-4 h-4 text-muted-foreground/60 shrink-0" />
                              </div>
                              <p className="text-xs text-muted-foreground/80 line-clamp-2 leading-relaxed">
                                {perm.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
