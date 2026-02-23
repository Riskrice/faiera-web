"use client";

import { useEffect, useRef, useState } from "react";
import { JitsiMeeting as JitsiMeetingSDK } from "@jitsi/react-sdk";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, VideoOff, PhoneOff, AlertCircle } from "lucide-react";

interface JitsiConfig {
    domain: string;
    roomName: string;
    displayName: string;
    email?: string;
    isHost: boolean;
    subject?: string;
    jwt?: string;
    configOverwrite: Record<string, unknown>;
    interfaceConfigOverwrite: Record<string, unknown>;
}

interface JitsiMeetingProps {
    config: JitsiConfig;
    sessionTitle: string;
    onJoin?: () => void;
    onLeave?: () => void;
    onError?: (error: Error) => void;
    embedded?: boolean;
}

export function JitsiMeeting({
    config,
    sessionTitle,
    onJoin,
    onLeave,
    onError,
    embedded = true,
}: JitsiMeetingProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [hasJoined, setHasJoined] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [errorDetails, setErrorDetails] = useState<string | null>(null);
    const apiRef = useRef<any>(null);

    useEffect(() => {
        // Config logged in dev only
        if (process.env.NODE_ENV === 'development') {
            console.log("Jitsi Config:", {
                domain: config.domain,
                roomName: config.roomName,
                hasJwt: !!config.jwt,
            });
        }
    }, [config]);

    const handleApiReady = (api: any) => {
        apiRef.current = api;
        setIsLoading(false);

        api.addEventListener("videoConferenceJoined", () => {
            // Joined successfully
            setHasJoined(true);
            onJoin?.();
        });

        api.addEventListener("videoConferenceLeft", () => {
            setHasJoined(false);
            onLeave?.();
        });

        api.addEventListener("errorOccurred", (errorData: any) => {
            const errorName = errorData?.error?.name || errorData?.name;

            // Only log unexpected errors
            if (errorName !== "conference.connectionError.membersOnly") {
                console.error("Jitsi SDK error:", errorData);
            }

            if (errorName === "conference.connectionError.membersOnly") {
                if (config.isHost) {
                    setError("مطلوب تسجيل دخول المضيف");
                    setErrorDetails("اضغط 'فتح في تبويب جديد'، سجّل الدخول بجوجل/فيسبوك لبدء الجلسة، ثم عُد هنا.");
                } else {
                    setError("في انتظار المعلم");
                    setErrorDetails("لم يبدأ المعلم الجلسة بعد. يرجى الانتظار.");
                }
            }
        });

        api.addEventListener("conferenceFailed", (errorData: any) => {
            const errorName = errorData?.error?.name || errorData?.error || errorData?.type;

            // Only log unexpected errors
            if (errorName !== "conference.connectionError.membersOnly") {
                console.error("Conference failed:", errorData);
            }

            if (errorName === "conference.connectionError.membersOnly") {
                if (config.isHost) {
                    setError("مطلوب تسجيل دخول المضيف");
                    setErrorDetails("اضغط 'فتح في تبويب جديد'، سجّل الدخول بجوجل/فيسبوك لبدء الجلسة، ثم عُد هنا.");
                } else {
                    setError("في انتظار المعلم");
                    setErrorDetails("لم يبدأ المعلم الجلسة بعد. يرجى الانتظار.");
                }
            } else {
                setError("فشل الاتصال بالجلسة");
                setErrorDetails(errorName || "خطأ غير معروف");
            }
        });

        api.addEventListener("readyToClose", () => {
            setHasJoined(false);
            onLeave?.();
        });
    };

    const handleReadyToClose = () => {
        setHasJoined(false);
        onLeave?.();
    };

    const handleLeave = () => {
        if (apiRef.current) {
            apiRef.current.executeCommand("hangup");
        }
    };

    const getExternalLink = () => {
        return "https://" + config.domain + "/" + config.roomName;
    };

    if (error) {
        return (
            <Card className="w-full">
                <CardContent className="py-16 text-center">
                    <AlertCircle className="w-16 h-16 mx-auto text-destructive mb-4" />
                    <h3 className="text-xl font-semibold mb-2">{error}</h3>
                    {errorDetails && (
                        <p className="text-muted-foreground mb-4 text-sm">{errorDetails}</p>
                    )}
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Button onClick={() => window.location.reload()}>
                            إعادة المحاولة
                        </Button>
                        <Button variant="outline" onClick={() => window.open(getExternalLink(), "_blank")}>
                            فتح في تبويب جديد
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="w-full h-full min-h-[500px] relative">
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
                    <div className="text-center">
                        <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary mb-4" />
                        <p className="text-lg font-medium">جاري تحميل الجلسة...</p>
                        <p className="text-sm text-muted-foreground">{sessionTitle}</p>
                    </div>
                </div>
            )}

            <JitsiMeetingSDK
                domain={config.domain}
                roomName={config.roomName}
                configOverwrite={config.configOverwrite}
                interfaceConfigOverwrite={config.interfaceConfigOverwrite}
                userInfo={{
                    displayName: config.displayName,
                    email: config.email || "",
                }}
                onApiReady={handleApiReady}
                onReadyToClose={handleReadyToClose}
                getIFrameRef={(iframeRef) => {
                    if (iframeRef) {
                        iframeRef.style.width = "100%";
                        iframeRef.style.height = embedded ? "600px" : "100vh";
                        iframeRef.style.border = "none";
                        iframeRef.style.borderRadius = "12px";
                    }
                }}
            />

            {hasJoined && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20">
                    <Button variant="destructive" size="lg" onClick={handleLeave} className="shadow-lg">
                        <PhoneOff className="w-5 h-5 ml-2" />
                        مغادرة الجلسة
                    </Button>
                </div>
            )}
        </div>
    );
}
