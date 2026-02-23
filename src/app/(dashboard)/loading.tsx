export default function Loading() {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4">
                {/* Outer spinning ring */}
                <div className="relative w-20 h-20">
                    <div className="absolute inset-0 rounded-full border-4 border-muted" />
                    <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-emerald-500 animate-spin" />
                    {/* Inner pulsing dot */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                    </div>
                </div>
                <p className="text-sm text-muted-foreground animate-pulse">جاري التحميل...</p>
            </div>
        </div>
    );
}
