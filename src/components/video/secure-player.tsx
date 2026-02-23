
"use client";

import { useEffect, useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

interface SecurePlayerProps {
    lessonId: string;
    autoPlay?: boolean;
}

export function SecurePlayer({ lessonId, autoPlay = false }: SecurePlayerProps) {
    const [embedUrl, setEmbedUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { accessToken, loading: authLoading } = useAuth();

    useEffect(() => {
        let mounted = true;

        const fetchStreamUrl = async () => {
            console.log('SecurePlayer fetchStreamUrl called. Token:', accessToken ? 'PRESENT' : 'MISSING', 'authLoading:', authLoading);
            if (authLoading) return; // Wait for auth to finish initializing

            try {
                setLoading(true);
                setError(null);

                // Fetch signed URL from our backend (works without token for free lessons)
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
                const headers: Record<string, string> = {};
                if (accessToken) {
                    headers['Authorization'] = `Bearer ${accessToken}`;
                }
                const response = await fetch(
                    `${apiUrl}/content/lessons/${lessonId}/stream-url`,
                    { headers }
                );

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
                    throw new Error(errorData.message || errorData.error?.message || `HTTP ${response.status}`);
                }

                const responseBody = await response.json();
                const videoUrl = responseBody.data?.url || responseBody.url; // Support both wrapped and direct formats

                if (mounted && videoUrl) {
                    // Append autoplay param if requested
                    const url = new URL(videoUrl);
                    if (autoPlay) {
                        url.searchParams.set("autoplay", "true");
                    }
                    // Ensure it's not muted by default unless necessary, though browsers block unmuted autoplay often
                    url.searchParams.set("muted", "false");

                    setEmbedUrl(url.toString());
                }
            } catch (err) {
                if (mounted) {
                    console.error("Failed to load video stream", err);
                    setError("فشل تحميل الفيديو. قد لا تكون لديك صلاحية مشاهدة هذا الدرس.");
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        if (lessonId) {
            fetchStreamUrl();
        }

        return () => {
            mounted = false;
        };
    }, [lessonId, autoPlay, accessToken, authLoading]);

    if (loading || authLoading) {
        return (
            <div className="w-full aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full aspect-video bg-gray-900 rounded-lg flex flex-col items-center justify-center text-white p-4">
                <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
                <p className="text-center text-sm">{error}</p>
            </div>
        );
    }

    if (!embedUrl) {
        return null;
    }

    return (
        <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black shadow-lg">
            <iframe
                src={embedUrl}
                loading="lazy"
                className="absolute top-0 left-0 w-full h-full border-0"
                allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                allowFullScreen
            />
        </div>
    );
}
