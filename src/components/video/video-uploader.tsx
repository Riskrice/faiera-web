
"use client";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Upload, X, CheckCircle, FileVideo, AlertCircle, XCircle, RotateCcw, Play } from "lucide-react";
import { useUpload } from "@/contexts/upload-context";

interface VideoUploaderProps {
    lessonId: string;
    onUploadComplete: (videoId: string, duration: number) => void;
    className?: string;
}

/** Format bytes to human-readable size */
function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const k = 1024;
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(i > 1 ? 1 : 0)} ${units[i]}`;
}

export function VideoUploader({ lessonId, onUploadComplete, className }: VideoUploaderProps) {
    const { uploads, startUpload, resumeUpload, cancelUpload, removeUpload } = useUpload();

    // Get state for this specific lesson upload
    const uploadStateObj = uploads[lessonId] || { status: 'idle', progress: 0 };
    const uploadState = uploadStateObj.status;
    const progress = uploadStateObj.progress;
    const errorMessage = uploadStateObj.errorMessage;
    const canResume = uploadStateObj.canResume;
    const bytesUploaded = uploadStateObj.bytesUploaded || 0;
    const bytesTotal = uploadStateObj.bytesTotal || 0;
    const file = uploadStateObj.fileName ? { name: uploadStateObj.fileName } as any : null;

    const MAX_FILE_SIZE = 11 * 1024 * 1024 * 1024; // 11GB

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            if (!selectedFile.type.startsWith("video/")) {
                toast.error("يرجى اختيار ملف فيديو صحيح");
                return;
            }
            if (selectedFile.size > MAX_FILE_SIZE) {
                toast.error("حجم الملف يتجاوز الحد المسموح به (11GB)");
                return;
            }
            startUpload(lessonId, selectedFile, onUploadComplete).catch(() => { });
        }
    };

    const handleCancel = () => {
        cancelUpload(lessonId);
        toast.info("تم إلغاء الرفع");
    };

    const handleResume = () => {
        resumeUpload(lessonId);
        toast.info("جاري استئناف الرفع...");
    };

    const clearFile = () => {
        removeUpload(lessonId);
    };

    return (
        <div className={`p-6 border-2 border-dashed rounded-lg transition-colors ${uploadState === "error" ? "border-red-200 bg-red-50" :
            uploadState === "success" ? "border-green-200 bg-green-50" :
                uploadState === "uploading" ? "border-primary/40 bg-primary/5" :
                    "border-gray-200 hover:border-primary/50"
            } ${className}`}>

            {!file ? (
                <div className="flex flex-col items-center justify-center text-center space-y-4">
                    <div className="p-4 bg-primary/10 rounded-full">
                        <Upload className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                        <h3 className="text-lg font-medium">رفع فيديو الدرس</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            اسحب الملف هنا أو اضغط للاختيار
                        </p>
                    </div>
                    <input
                        type="file"
                        accept="video/*"
                        className="hidden"
                        id={`video-upload-${lessonId}`}
                        onChange={handleFileSelect}
                    />
                    <label htmlFor={`video-upload-${lessonId}`}>
                        <Button variant="outline" className="mt-2 cursor-pointer" asChild>
                            <span>اختر الفيديو</span>
                        </Button>
                    </label>
                    <p className="text-xs text-muted-foreground">
                        MP4, MOV, AVI — حتى 11GB (رفع مجزأ قابل للاستئناف)
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="p-2 bg-primary/10 rounded-md shrink-0">
                                <FileVideo className="w-6 h-6 text-primary" />
                            </div>
                            <div className="space-y-0.5 overflow-hidden">
                                <p className="font-medium text-sm truncate">{file.name}</p>
                                <p className="text-xs text-muted-foreground whitespace-nowrap">
                                    {uploadState === "uploading"
                                        ? `جاري الرفع... ${formatFileSize(bytesUploaded)} / ${formatFileSize(bytesTotal)}`
                                        : uploadState === "success"
                                            ? "تم الرفع بنجاح ✓"
                                            : ""}
                                </p>
                            </div>
                        </div>

                        {/* Cancel button during uploading */}
                        {uploadState === "uploading" && (
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={handleCancel}
                                className="gap-1.5 h-8 px-2.5 text-xs shrink-0"
                            >
                                <XCircle className="w-3.5 h-3.5" />
                                إلغاء الرفع
                            </Button>
                        )}

                        {/* Clear button when idle or error */}
                        {(uploadState === "idle" || uploadState === "error") && (
                            <Button variant="ghost" size="icon" onClick={clearFile} className="h-8 w-8 shrink-0 text-muted-foreground">
                                <X className="w-4 h-4" />
                            </Button>
                        )}
                    </div>

                    {uploadState === "uploading" && (
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>جاري الرفع إلى Bunny.net (رفع مجزأ)...</span>
                                <span className="font-bold tabular-nums">{progress}%</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                        </div>
                    )}

                    {uploadState === "success" && (
                        <div className="flex items-center space-x-2 text-green-600 bg-green-100 p-3 rounded-md gap-2">
                            <CheckCircle className="w-5 h-5 flex-shrink-0" />
                            <span className="text-sm font-medium">اكتمل الرفع بنجاح!</span>
                        </div>
                    )}

                    {uploadState === "error" && (
                        <div className="flex items-center space-x-2 text-red-600 bg-red-100 p-3 rounded-md gap-2">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <span className="text-sm font-medium">{errorMessage}</span>
                        </div>
                    )}

                    {uploadState === "error" && (
                        <div className="flex justify-end gap-2 pt-2">
                            {canResume && (
                                <Button onClick={handleResume} variant="default" className="gap-1.5">
                                    <Play className="w-4 h-4" />
                                    استئناف الرفع
                                </Button>
                            )}
                            <Button onClick={() => {
                                // Re-select file for full retry
                                removeUpload(lessonId);
                            }} variant="secondary" className="gap-1.5">
                                <RotateCcw className="w-4 h-4" />
                                إعادة المحاولة
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
