"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@/contexts";
import { toast } from "sonner";

interface JoinInfo {
    roomName: string;
    domain: string;
    joinToken: string;
    config: any;
}

interface UseSessionJoinOptions {
    onJoinSuccess?: (joinInfo: JoinInfo) => void;
    onJoinError?: (error: Error) => void;
    onLeaveSuccess?: () => void;
}

export function useSessionJoin(options: UseSessionJoinOptions = {}) {
    const { accessToken } = useAuth();
    const [loading, setLoading] = useState(false);
    const [joinInfo, setJoinInfo] = useState<JoinInfo | null>(null);
    const [error, setError] = useState<string | null>(null);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

    const getJoinLink = useCallback(async (sessionId: string): Promise<JoinInfo | null> => {
        if (!accessToken) {
            toast.error("يجب تسجيل الدخول أولاً");
            return null;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`${apiUrl}/sessions/${sessionId}/join-link`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${accessToken}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || "فشل في الحصول على رابط الجلسة");
            }

            const data = await response.json();
            const info: JoinInfo = data.data;

            setJoinInfo(info);
            options.onJoinSuccess?.(info);

            return info;
        } catch (err) {
            const message = err instanceof Error ? err.message : "حدث خطأ غير متوقع";
            setError(message);
            toast.error(message);
            options.onJoinError?.(err instanceof Error ? err : new Error(message));
            return null;
        } finally {
            setLoading(false);
        }
    }, [accessToken, apiUrl, options]);

    const recordJoin = useCallback(async (sessionId: string): Promise<boolean> => {
        if (!accessToken) return false;

        try {
            await fetch(`${apiUrl}/sessions/${sessionId}/join`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${accessToken}`,
                },
            });
            return true;
        } catch {
            return false;
        }
    }, [accessToken, apiUrl]);

    const recordLeave = useCallback(async (sessionId: string): Promise<boolean> => {
        if (!accessToken) return false;

        try {
            await fetch(`${apiUrl}/sessions/${sessionId}/leave`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${accessToken}`,
                },
            });
            options.onLeaveSuccess?.();
            return true;
        } catch {
            return false;
        }
    }, [accessToken, apiUrl, options]);

    const registerForSession = useCallback(async (sessionId: string): Promise<boolean> => {
        if (!accessToken) {
            toast.error("يجب تسجيل الدخول أولاً");
            return false;
        }

        try {
            const response = await fetch(`${apiUrl}/sessions/${sessionId}/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${accessToken}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || "فشل التسجيل في الجلسة");
            }

            toast.success("تم التسجيل في الجلسة بنجاح");
            return true;
        } catch (err) {
            const message = err instanceof Error ? err.message : "حدث خطأ غير متوقع";
            toast.error(message);
            return false;
        }
    }, [accessToken, apiUrl]);

    const unregisterFromSession = useCallback(async (sessionId: string): Promise<boolean> => {
        if (!accessToken) return false;

        try {
            const response = await fetch(`${apiUrl}/sessions/${sessionId}/register`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${accessToken}`,
                },
            });

            if (!response.ok) {
                throw new Error("فشل إلغاء التسجيل");
            }

            toast.success("تم إلغاء التسجيل");
            return true;
        } catch (err) {
            const message = err instanceof Error ? err.message : "حدث خطأ";
            toast.error(message);
            return false;
        }
    }, [accessToken, apiUrl]);

    const clearJoinInfo = useCallback(() => {
        setJoinInfo(null);
    }, []);

    return {
        loading,
        joinInfo,
        error,
        getJoinLink,
        recordJoin,
        recordLeave,
        registerForSession,
        unregisterFromSession,
        clearJoinInfo,
    };
}
