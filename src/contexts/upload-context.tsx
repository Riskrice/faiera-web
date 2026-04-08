"use client";

import React, { createContext, useContext, useState, ReactNode, useRef, useCallback } from 'react';
import * as tus from 'tus-js-client';
import api from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';

export type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

export interface UploadState {
    progress: number;
    status: UploadStatus;
    fileName?: string;
    errorMessage?: string;
    videoId?: string;
    durationSeconds?: number;
    /** Bytes uploaded so far */
    bytesUploaded?: number;
    /** Total file size in bytes */
    bytesTotal?: number;
    /** Whether a previous upload can be resumed */
    canResume?: boolean;
}

interface UploadContextType {
    uploads: Record<string, UploadState>;
    startUpload: (lessonId: string, file: File, onComplete?: (videoId: string, durationSeconds: number) => void) => Promise<void>;
    resumeUpload: (lessonId: string) => void;
    removeUpload: (lessonId: string) => void;
    cancelUpload: (lessonId: string) => void;
}

const UploadContext = createContext<UploadContextType | undefined>(undefined);

// Store TUS upload instances and associated data for resume support
interface TusUploadRef {
    upload: tus.Upload;
    file: File;
    onComplete?: (videoId: string, durationSeconds: number) => void;
    videoId: string;
    durationSeconds: number;
}

export function UploadProvider({ children }: { children: ReactNode }) {
    const [uploads, setUploads] = useState<Record<string, UploadState>>({});
    const tusRefs = useRef<Record<string, TusUploadRef>>({});
    const { accessToken } = useAuth();

    const detectVideoDuration = (videoFile: File): Promise<number> => {
        return new Promise((resolve) => {
            const video = document.createElement('video');
            video.preload = 'metadata';
            video.onloadedmetadata = () => {
                const duration = video.duration;
                window.URL.revokeObjectURL(video.src);
                resolve(Math.floor(duration));
            };
            video.onerror = () => resolve(0);
            video.src = URL.createObjectURL(videoFile);
        });
    };

    const setUploadState = useCallback((lessonId: string, newState: Partial<UploadState>) => {
        setUploads(prev => ({
            ...prev,
            [lessonId]: {
                ...(prev[lessonId] || { progress: 0, status: 'idle' }),
                ...newState
            }
        }));
    }, []);

    const createTusUpload = (
        lessonId: string,
        file: File,
        videoId: string,
        libraryId: string,
        signature: string,
        expirationTime: number,
        durationSeconds: number,
        onComplete?: (videoId: string, durationSeconds: number) => void,
    ): tus.Upload => {
        const upload = new tus.Upload(file, {
            endpoint: 'https://video.bunnycdn.com/tusupload',
            // Longer retry delays — Bunny.net needs 2-5 min to release locks on large files
            retryDelays: [0, 5000, 10000, 30000, 60000, 90000, 120000],
            chunkSize: 20 * 1024 * 1024, // 20MB chunks — reduces lock contention on large files
            storeFingerprintForResuming: true,
            removeFingerprintOnSuccess: true,
            fingerprint: async (inputFile) => {
                return [
                    'faiera',
                    lessonId,
                    videoId,
                    inputFile.name,
                    inputFile.type,
                    inputFile.size,
                    inputFile.lastModified,
                ].join('-');
            },
            headers: {
                AuthorizationSignature: signature,
                AuthorizationExpire: expirationTime.toString(),
                VideoId: videoId,
                LibraryId: libraryId,
            },
            metadata: {
                filetype: file.type,
                title: file.name,
            },
            onError: (error) => {
                console.error('TUS upload error:', error);

                const detailedError = error as tus.DetailedError;
                const status = detailedError.originalResponse?.getStatus();
                const rawErrorMsg = error?.message || 'حدث خطأ أثناء الرفع';
                const isLocked = status === 423 || /locked/i.test(rawErrorMsg);
                const isCancelled = rawErrorMsg.includes('abort') || rawErrorMsg.includes('cancel');

                if (isCancelled) return;

                if (isLocked) {
                    // Auto-resume after 30s for 423 Locked — server needs time to process
                    console.log(`[TUS] 423 Locked for ${lessonId}, auto-resuming in 30s...`);
                    setUploadState(lessonId, {
                        status: 'uploading',
                        errorMessage: undefined,
                    });
                    setTimeout(() => {
                        const ref = tusRefs.current[lessonId];
                        if (ref) {
                            console.log(`[TUS] Auto-resuming upload for ${lessonId}`);
                            ref.upload.start();
                        }
                    }, 30000);
                    return;
                }

                // Handle specifically the 400 error from Bunny CDN (Expiry/Signature issues)
                if (status === 400) {
                    setUploadState(lessonId, {
                        status: 'error',
                        errorMessage: 'فشلت عملية المصادقة مع سيرفر الفيديو. يرجى إعادة المحاولة من جديد.',
                        canResume: false, // Don't resume a 400 error, retry from scratch
                    });
                    return;
                }

                setUploadState(lessonId, {
                    status: 'error',
                    errorMessage: rawErrorMsg,
                    canResume: true,
                });
            },
            onProgress: (bytesUploaded, bytesTotal) => {
                const percentage = Math.round((bytesUploaded / bytesTotal) * 100);
                setUploadState(lessonId, {
                    progress: percentage,
                    bytesUploaded,
                    bytesTotal,
                });
            },
            onSuccess: () => {
                setUploadState(lessonId, {
                    status: 'success',
                    progress: 100,
                    videoId,
                    durationSeconds,
                    canResume: false,
                });
                if (onComplete) {
                    onComplete(videoId, durationSeconds);
                }
                // Cleanup ref
                delete tusRefs.current[lessonId];
            },
            onShouldRetry: (error, retryAttempt, _options) => {
                const status = error.originalResponse?.getStatus();
                const message = (error?.message || '').toLowerCase();
                if (status === 423 || message.includes('locked')) {
                    // Allow many retries for lock errors — Bunny needs time
                    return retryAttempt < 10;
                }
                // Don't retry client errors (4xx except 423)
                if (status && status >= 400 && status < 500) {
                    return false;
                }
                console.log(`[TUS] Retrying upload (attempt ${retryAttempt})...`);
                return true; // Retry on network errors and 5xx
            },
        });

        return upload;
    };

    const startUpload = async (
        lessonId: string,
        file: File,
        onComplete?: (videoId: string, durationSeconds: number) => void,
    ) => {
        setUploadState(lessonId, {
            status: 'uploading',
            progress: 0,
            fileName: file.name,
            errorMessage: undefined,
            canResume: false,
            bytesUploaded: 0,
            bytesTotal: file.size,
        });

        try {
            // 1. Detect Duration
            const durationSeconds = await detectVideoDuration(file);

            // 2. Get TUS upload credentials from backend
            const responseData = await api.post<any>(
                '/content/lessons/upload-url',
                { title: file.name },
                { token: accessToken || undefined },
            );

            if (!responseData.success || !responseData.data) {
                throw new Error('فشل في الحصول على بيانات الرفع');
            }

            const { videoId, libraryId, authorizationSignature, expirationTime } = responseData.data;

            // 3. Create TUS upload
            const upload = createTusUpload(
                lessonId, file, videoId, libraryId,
                authorizationSignature, expirationTime,
                durationSeconds, onComplete,
            );

            // Store reference for cancel/resume
            tusRefs.current[lessonId] = {
                upload,
                file,
                onComplete,
                videoId,
                durationSeconds,
            };

            // 4. Start the upload for the current Bunny video object.
            // We do not reuse persisted uploads from previous attempts because the
            // backend creates a new video ID each time, and resuming an older upload
            // can point to a locked or unrelated Bunny upload URL.
            upload.start();
        } catch (error: any) {
            console.error('Upload initialization error:', error);
            setUploadState(lessonId, {
                status: 'error',
                errorMessage: error?.message || 'حدث خطأ غير متوقع',
                canResume: false,
            });
        }
    };

    const resumeUpload = (lessonId: string) => {
        const ref = tusRefs.current[lessonId];
        if (ref) {
            setUploadState(lessonId, {
                status: 'uploading',
                errorMessage: undefined,
            });
            ref.upload.start();
        }
    };

    const removeUpload = (lessonId: string) => {
        // Abort if still running
        const ref = tusRefs.current[lessonId];
        if (ref) {
            try { ref.upload.abort(); } catch { /* ignore */ }
            delete tusRefs.current[lessonId];
        }
        setUploads(prev => {
            const next = { ...prev };
            delete next[lessonId];
            return next;
        });
    };

    const cancelUpload = (lessonId: string) => {
        const ref = tusRefs.current[lessonId];
        if (ref) {
            ref.upload.abort();
            delete tusRefs.current[lessonId];
        }
        setUploadState(lessonId, {
            status: 'error',
            errorMessage: 'تم إلغاء الرفع',
            canResume: false,
        });
    };

    return (
        <UploadContext.Provider value={{ uploads, startUpload, resumeUpload, removeUpload, cancelUpload }}>
            {children}
        </UploadContext.Provider>
    );
}

export function useUpload() {
    const context = useContext(UploadContext);
    if (context === undefined) {
        throw new Error('useUpload must be used within an UploadProvider');
    }
    return context;
}
