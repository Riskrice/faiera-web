"use client";

import React, { createContext, useContext, useState, ReactNode, useRef, useCallback } from 'react';
import * as tus from 'tus-js-client';
import api from '@/lib/api';

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
            retryDelays: [0, 3000, 5000, 10000, 20000, 60000, 60000],
            chunkSize: 5 * 1024 * 1024, // 5MB chunks — optimal for large files
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

                // Check if it was a cancel (abort)
                const errorMsg = error?.message || 'حدث خطأ أثناء الرفع';
                const isCancelled = errorMsg.includes('abort') || errorMsg.includes('cancel');

                if (!isCancelled) {
                    setUploadState(lessonId, {
                        status: 'error',
                        errorMessage: errorMsg,
                        canResume: true, // TUS uploads can always be resumed
                    });
                }
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
                // Retry on network errors or 5xx server errors
                if (status && status >= 400 && status < 500) {
                    return false; // Don't retry client errors
                }
                console.log(`Retrying upload (attempt ${retryAttempt})...`);
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
            const responseData = await api.post<any>('/content/lessons/upload-url', { title: file.name });

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

            // 4. Check for previous uploads and resume if available
            const previousUploads = await upload.findPreviousUploads();
            if (previousUploads.length) {
                upload.resumeFromPreviousUpload(previousUploads[0]);
            }

            // 5. Start the upload
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
