'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { updateProgress } from '@/lib/api';
import { useAuth } from '@/contexts';
import { toast } from 'sonner';

export function LessonProgressButton({ 
    lessonId, 
    courseId, 
    title, 
    courseTitle, 
    courseThumbnail 
}: { 
    lessonId: string, 
    courseId: string, 
    title?: string,
    courseTitle?: string,
    courseThumbnail?: string
}) {
    const { accessToken } = useAuth();
    const [loading, setLoading] = useState(false);
    const [completed, setCompleted] = useState(false);

    // Mark as started when mounted
    useEffect(() => {
        if (!accessToken) return;
        setCompleted(false);

        let mounted = true;
        updateProgress({
            contentType: 'lesson',
            contentId: lessonId,
            progressPercent: 1, // Just enough to track it's started
            metadata: { 
                courseId, 
                titleAr: title || 'درس تعليمي',
                courseTitle: courseTitle || 'كورس تعليمي',
                courseThumbnail: courseThumbnail || ''
            }
        }, accessToken).catch(console.error);

        return () => { mounted = false; };
    }, [lessonId, accessToken, courseId, title]);

    const handleComplete = async () => {
        if (!accessToken) return;
        setLoading(true);
        try {
            await updateProgress({
                contentType: 'lesson',
                contentId: lessonId,
                progressPercent: 100,
                metadata: { 
                    courseId, 
                    titleAr: title || 'درس تعليمي',
                    courseTitle: courseTitle || 'كورس تعليمي',
                    courseThumbnail: courseThumbnail || ''
                }
            }, accessToken);
            setCompleted(true);
            toast.success('تم إكمال الدرس بنجاح!');
        } catch (e: any) {
            toast.error(e.message || 'حدث خطأ أثناء حفظ التقدم');
        } finally {
            setLoading(false);
        }
    };

    if (completed) {
        return (
            <div className="inline-flex items-center gap-2 text-green-600 font-medium font-cairo text-sm px-4 py-2 bg-green-50 rounded-md border border-green-200">
                <CheckCircle2 className="w-5 h-5" />
                تم إكمال الدرس
            </div>
        );
    }

    return (
        <Button 
            variant="outline" 
            onClick={handleComplete} 
            disabled={loading || !accessToken}
            className="font-cairo gap-2 border-primary/20 hover:bg-primary/10 hover:text-primary transition-colors"
        >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4 text-primary" />}
            تحديد كمكتمل
        </Button>
    );
}
