"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
    SubscriptionPackageDialog,
} from "@/components/teachers/subscription-package-dialog";
import { SubscriptionPackageFormValues } from "@/lib/schemas/subscription-package";

// Define the shape of the package coming from the API
export interface SubscriptionPackage extends SubscriptionPackageFormValues {
    id: string;
    teacherId: string;
    createdAt: string;
    updatedAt: string;
}

export function SubscriptionPackagesTab() {
    const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingPackage, setEditingPackage] = useState<SubscriptionPackage | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // TODO: Get real teacher ID from auth context if needed, or backend extracts it from token
    // For now assuming backend uses the token to identify the teacher.

    const fetchPackages = useCallback(async () => {
        try {
            setIsLoading(true);
            const data = await api.get<SubscriptionPackage[]>('/teachers/packages');
            setPackages(data);
        } catch {
            // Silently fail - this feature may not be set up yet
            setPackages([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPackages();
    }, [fetchPackages]);

    const handleCreate = () => {
        setEditingPackage(null);
        setIsDialogOpen(true);
    };

    const handleEdit = (pkg: SubscriptionPackage) => {
        setEditingPackage(pkg);
        setIsDialogOpen(true);
    };

    const handleSubmit = async (values: SubscriptionPackageFormValues) => {
        try {
            setIsSaving(true);
            if (editingPackage) {
                await api.patch<SubscriptionPackage>(`/teachers/packages/${editingPackage.id}`, values);
                toast.success("تم تحديث الباقة بنجاح");
            } else {
                await api.post<SubscriptionPackage>('/teachers/packages', values);
                toast.success("تم إنشاء الباقة بنجاح");
            }
            setIsDialogOpen(false);
            fetchPackages();
        } catch (error: any) {
            console.error("Failed to save package:", error);
            toast.error(error.message || "فشل في حفظ الباقة");
        } finally {
            setIsSaving(false);
        }
    };

    const toggleActive = async (pkg: SubscriptionPackage) => {
        try {
            // Optimistic update
            setPackages(prev => prev.map(p => p.id === pkg.id ? { ...p, isActive: !p.isActive } : p));

            await api.patch(`/teachers/packages/${pkg.id}/toggle`);
            toast.success(pkg.isActive ? "تم إيقاف تفعيل الباقة" : "تم تفعيل الباقة بنجاح");
        } catch (error) {
            console.error("Failed to toggle package:", error);
            toast.error("فشل في تحديث حالة الباقة");
            // Revert on error
            fetchPackages();
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="text-right">
                    <h3 className="text-lg font-medium">باقات الاشتراك</h3>
                    <p className="text-sm text-muted-foreground">
                        إدارة باقات الاشتراك للطلاب.
                    </p>
                </div>
                <Button onClick={handleCreate}>
                    <Plus className="w-4 h-4 ml-2" />
                    إنشاء باقة
                </Button>
            </div>

            {packages.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="rounded-full bg-primary/10 p-3 mb-4">
                            <Plus className="w-6 h-6 text-primary" />
                        </div>
                        <h3 className="text-lg font-semibold">لا توجد باقات حتى الآن</h3>
                        <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                            قم بإنشاء باقة الاشتراك الأولى للبدء في استقبال الطلاب.
                        </p>
                        <Button variant="outline" onClick={handleCreate}>
                            إنشاء باقة
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {packages.map((pkg) => (
                        <Card key={pkg.id} className={pkg.isActive ? "" : "opacity-75 bg-muted/50"}>
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle>{pkg.name}</CardTitle>
                                        <CardDescription>{pkg.educationalStage}</CardDescription>
                                    </div>
                                    <Badge variant={pkg.isActive ? "default" : "secondary"}>
                                        {pkg.isActive ? "نشط" : "غير نشط"}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <span className="text-2xl font-bold">
                                        {pkg.price} {pkg.currency}
                                    </span>
                                    <span className="text-muted-foreground ml-1">
                                        / {pkg.billingCycle}
                                    </span>
                                </div>
                                <div className="space-y-1">
                                    {pkg.features.slice(0, 3).map((feature, i) => (
                                        <div key={i} className="text-sm flex items-center text-muted-foreground">
                                            <span className="w-1.5 h-1.5 rounded-full bg-primary ml-2" />
                                            {feature}
                                        </div>
                                    ))}
                                    {pkg.features.length > 3 && (
                                        <div className="text-xs text-muted-foreground pr-3.5">
                                            +{pkg.features.length - 3} المزيد...
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                            <CardFooter className="flex justify-between border-t pt-4">
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        checked={pkg.isActive}
                                        onCheckedChange={() => toggleActive(pkg)}
                                    />
                                    <span className="text-sm text-muted-foreground">
                                        {pkg.isActive ? "نشط" : "غير نشط"}
                                    </span>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => handleEdit(pkg)}>
                                    <Pencil className="w-4 h-4 ml-2" />
                                    تعديل
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}

            <SubscriptionPackageDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                initialData={editingPackage}
                onSubmit={handleSubmit}
                isLoading={isSaving}
            />
        </div>
    );
}
