"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import Image from "next/image";
import { cn } from "@/lib/utils";
import api from "@/lib/api";

interface ImageUploaderProps {
    value?: string;
    onChange: (url: string) => void;
    className?: string;
    endpoint?: string;
    title?: string;
    description?: string;
    variant?: "default" | "avatar";
}

export function ImageUploader({
    value,
    onChange,
    className,
    endpoint = "/upload/image",
    title = "صورة الكورس المصغرة",
    description = "اسحب وأفلت الصورة هنا، أو اضغط للاختيار",
    variant = "default",
}: ImageUploaderProps) {
    const { accessToken } = useAuth();
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];

            // Validate type
            if (!file.type.startsWith("image/")) {
                toast.error("يرجى اختيار ملف صورة صحيح (JPG, PNG, WEBP)");
                return;
            }

            // Validate size (5MB)
            if (file.size > 5 * 1024 * 1024) {
                toast.error("حجم الصورة يجب ألا يتعدى 5 ميجابايت");
                return;
            }

            await uploadImage(file);
        }
    };

    const uploadImage = async (file: File) => {
        if (!accessToken) {
            toast.error("يجب تسجيل الدخول لرفع الصور");
            return;
        }

        try {
            setUploading(true);
            // 使用 API client 进行上传
            const data = await api.upload<{ url: string; data?: { url: string } }>(
                endpoint,
                file,
                accessToken || undefined
            );

            // Backend response structure might vary (url direct or in data)
            const imageUrl = data.url || data.data?.url;

            if (imageUrl) {
                onChange(imageUrl);
                toast.success("تم رفع الصورة بنجاح");
            } else {
                throw new Error("لم يتم استلام رابط الصورة");
            }


        } catch (error) {
            console.error("Upload error:", error);
            toast.error("فشل رفع الصورة: " + (error as Error).message);
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const handleRemove = () => {
        onChange("");
    };

    return (
        <div className={cn("w-full mx-auto", variant === "avatar" && "max-w-[200px]", className)}>
            {value ? (
                <div className={cn("relative overflow-hidden border bg-muted/30 group", variant === "avatar" ? "rounded-full aspect-square" : "rounded-lg aspect-video")}>
                    <Image
                        src={value}
                        alt="Uploaded image"
                        fill
                        className="object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button
                            variant="destructive"
                            size="icon"
                            onClick={handleRemove}
                            className="rounded-full"
                        >
                            <X className="w-5 h-5" />
                        </Button>
                    </div>
                </div>
            ) : (
                <div
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                        "border-2 border-dashed p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors hover:bg-muted/10 h-full",
                        variant === "avatar" ? "rounded-full aspect-square" : "rounded-lg min-h-[200px]",
                        uploading ? "opacity-50 pointer-events-none" : "hover:border-primary/50"
                    )}
                >
                    <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mb-4 shrink-0">
                        {uploading ? (
                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        ) : (
                            <ImageIcon className="w-8 h-8 text-muted-foreground" />
                        )}
                    </div>
                    {variant !== "avatar" && (
                        <h3 className="font-semibold text-lg mb-1">
                            {uploading ? "جاري الرفع..." : title}
                        </h3>
                    )}
                    <p className={cn("text-muted-foreground", variant === "avatar" ? "text-xs font-medium" : "text-sm")}>
                        {uploading ? "يرجى الانتظار" : variant === "avatar" ? title : description}
                    </p>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png, image/jpeg, image/webp, image/gif"
                        className="hidden"
                        onChange={handleFileSelect}
                    />
                </div>
            )}
        </div>
    );
}
