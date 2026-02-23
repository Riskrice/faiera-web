import { z } from "zod";

export const BillingCycleEnum = z.enum(["monthly", "quarterly", "term", "yearly"]);

export const subscriptionPackageSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, "Name is required").max(255),
    price: z.coerce.number().min(0, "Price must be non-negative"),
    currency: z.string().length(3).default("EGP"),
    billingCycle: BillingCycleEnum.default("monthly"),
    educationalStage: z.string().min(1, "Educational stage is required").max(100),
    features: z.array(z.string()).default([]),
    isActive: z.boolean().default(true),
});

export type SubscriptionPackageFormValues = z.infer<typeof subscriptionPackageSchema>;

export const defaultSubscriptionPackageValues: SubscriptionPackageFormValues = {
    name: "",
    price: 0,
    currency: "EGP",
    billingCycle: "monthly",
    educationalStage: "",
    features: [],
    isActive: true,
};
