"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
    subscriptionPackageSchema,
    SubscriptionPackageFormValues,
    defaultSubscriptionPackageValues,
} from "@/lib/schemas/subscription-package";

interface SubscriptionPackageDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialData?: SubscriptionPackageFormValues | null;
    onSubmit: (data: SubscriptionPackageFormValues) => void;
    isLoading?: boolean;
}

export function SubscriptionPackageDialog({
    open,
    onOpenChange,
    initialData,
    onSubmit,
    isLoading,
}: SubscriptionPackageDialogProps) {
    const form = useForm<SubscriptionPackageFormValues>({
        resolver: zodResolver(subscriptionPackageSchema) as any,
        defaultValues: {
            ...defaultSubscriptionPackageValues,
            educationalStage: "عام", // Default for now since not in design
            billingCycle: "monthly",
        },
    });

    // Handle features as a single string for this simpler UI
    const [featureString, setFeatureString] = useState("");

    useEffect(() => {
        if (open) {
            const data = initialData || {
                ...defaultSubscriptionPackageValues,
                educationalStage: "عام",
                billingCycle: "monthly" as const
            };
            form.reset(data);
            // If there are features, take the first one or join them
            setFeatureString(data.features?.[0] || "");
        }
    }, [open, initialData, form]);

    const handleSubmit = (values: SubscriptionPackageFormValues) => {
        // Ensure features is set from the simple input
        const submissionData = {
            ...values,
            features: featureString ? [featureString] : [],
            educationalStage: "عام", // Enforce default to pass validation if hidden
        };
        onSubmit(submissionData);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md bg-white p-6 rounded-3xl">
                <DialogHeader className="mb-4">
                    <DialogTitle className="text-center text-xl font-bold font-cairo">
                        {initialData ? "تعديل الباقة" : "إعداد الباقة الشهرية"}
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">

                        {/* Toggle System */}
                        <FormField
                            control={form.control}
                            name="isActive"
                            render={({ field }) => (
                                <FormItem className="flex flex-row-reverse items-center justify-between space-y-0 rounded-lg border p-4 shadow-sm bg-gray-50/50">
                                    <FormLabel className="text-base font-semibold text-gray-700 mt-1 cursor-pointer">
                                        تفعيل نظام الباقات
                                    </FormLabel>
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                            className="data-[state=checked]:bg-[#10B981]" // Green color from design
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        {/* Package Name */}
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-sm font-medium text-gray-700 block mb-2 text-right">
                                        اسم الباقة
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="الباقة الشهرية المميزة"
                                            {...field}
                                            className="text-right h-12 rounded-xl border-gray-200 focus:border-[#10B981] focus:ring-[#10B981]"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Price */}
                        <FormField
                            control={form.control}
                            name="price"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-sm font-medium text-gray-700 block mb-2 text-right">
                                        السعر الشهري (EGP)
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            placeholder="350"
                                            {...field}
                                            className="text-right h-12 rounded-xl border-gray-200 focus:border-[#10B981] focus:ring-[#10B981]"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Simple Feature/Description Input */}
                        <div className="space-y-2">
                            <FormLabel className="text-sm font-medium text-gray-700 block mb-2 text-right">
                                المميزات (وصف مختصر)
                            </FormLabel>
                            <Input
                                value={featureString}
                                onChange={(e) => setFeatureString(e.target.value)}
                                placeholder="شامل 8 حصص شهرياً + مراجعات"
                                className="text-right h-12 rounded-xl border-gray-200 focus:border-[#10B981] focus:ring-[#10B981]"
                            />
                        </div>

                        <DialogFooter className="mt-8">
                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full h-12 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white font-bold text-base"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        جاري الحفظ...
                                    </>
                                ) : (
                                    "حفظ التغييرات"
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
