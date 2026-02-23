"use client";

import React, { createContext, useContext, useState, ReactNode, useRef } from 'react';
import api from '@/lib/api';

export type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

export interface UploadState {
    progress: number;
    status: UploadStatus;
    fileName?: string;
    errorMessage?: string;
    videoId?: string;
    durationSeconds?: number;
}

interface UploadContextType {
    uploads: Record<string, UploadState>;
    startUpload: (lessonId: string, file: File, onComplete?: (videoId: string, durationSeconds: number) => void) => Promise<void>;
    removeUpload: (lessonId: string) => void;
    cancelUpload: (lessonId: string) => void;
}

const UploadContext = createContext<UploadContextType | undefined>(undefined);

export function UploadProvider({ children }: { children: ReactNode }) {
    const [uploads, setUploads] = useState<Record<string, UploadState>>({});
    const xhrRefs = useRef<Record<string, XMLHttpRequest>>({});

    const detectVideoDuration = (videoFile: File): Promise<number> => {
        return new Promise((resolve) => {
            const video = document.createElement('video');
            video.preload = 'metadata';
            video.onloadedmetadata = () => {
                const duration = video.duration;
                window.URL.revokeObjectURL(video.src);
                resolve(Math.floor(duration)); // exact seconds, no rounding
            };
            video.onerror = () => resolve(0);
            video.src = URL.createObjectURL(videoFile);
        });
    };

    const setUploadState = (lessonId: string, newState: Partial<UploadState>) => {
        setUploads(prev => ({
            ...prev,
            [lessonId]: {
                ...(prev[lessonId] || { progress: 0, status: 'idle' }),
                ...newState
            }
        }));
    };

    const startUpload = async (lessonId: string, file: File, onComplete?: (videoId: string, durationSeconds: number) => void) => {
        setUploadState(lessonId, { status: 'uploading', progress: 0, fileName: file.name, errorMessage: undefined });

        try {
            // 1. Detect Duration (in seconds)
            const durationSeconds = await detectVideoDuration(file);

            // 2. Get Bunny Upload URL from our backend
            const responseData = await api.post<any>('/content/lessons/upload-url', { title: file.name });

            if (!responseData.success || !responseData.data) {
                throw new Error("Failed to get upload credentials");
            }

            const { videoId, libraryId, apiKey, uploadSignature, authorizationSignature, expirationTime } = responseData.data;

            // 3. Upload directly to Bunny.net via XMLHttpRequest
            return new Promise<void>((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhrRefs.current[lessonId] = xhr;

                // Bunny.net upload URL
                const bunnyUrl = `https://video.bunnycdn.com/library/${libraryId}/videos/${videoId}`;

                xhr.open("PUT", bunnyUrl, true);

                // Set headers requested by Bunny.net
                xhr.setRequestHeader("AccessKey", apiKey);
                xhr.setRequestHeader("Content-Type", "application/octet-stream");

                xhr.upload.onprogress = (event) => {
                    if (event.lengthComputable) {
                        const percentComplete = Math.round((event.loaded / event.total) * 100);
                        setUploadState(lessonId, { progress: percentComplete });
                    }
                };

                xhr.onload = () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        setUploadState(lessonId, { status: 'success', progress: 100, videoId, durationSeconds });
                        if (onComplete) {
                            onComplete(videoId, durationSeconds);
                        }
                        resolve();
                    } else {
                        const errorMsg = "Upload failed. Error " + xhr.status;
                        setUploadState(lessonId, { status: 'error', errorMessage: errorMsg });
                        reject(new Error(errorMsg));
                    }
                };

                xhr.onerror = () => {
                    setUploadState(lessonId, { status: 'error', errorMessage: "Network error during upload" });
                    reject(new Error("Network error"));
                };

                xhr.onabort = () => {
                    setUploadState(lessonId, { status: 'error', errorMessage: "Upload cancelled" });
                    reject(new Error("Upload cancelled"));
                };

                xhr.send(file);
            });
        } catch (error: any) {
            console.error("Upload error", error);
            setUploadState(lessonId, { status: 'error', errorMessage: error?.message || "An unknown error occurred" });
        }
    };

    const removeUpload = (lessonId: string) => {
        setUploads(prev => {
            const next = { ...prev };
            delete next[lessonId];
            return next;
        });
    };

    const cancelUpload = (lessonId: string) => {
        const xhr = xhrRefs.current[lessonId];
        if (xhr) {
            xhr.abort();
            delete xhrRefs.current[lessonId];
        }
        setUploadState(lessonId, { status: 'error', errorMessage: 'Upload cancelled' });
    };

    return (
        <UploadContext.Provider value={{ uploads, startUpload, removeUpload, cancelUpload }}>
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
