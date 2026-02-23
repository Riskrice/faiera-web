"use client"

import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { CoursesTable } from '@/components/dashboard/courses-table';
import { useAuth } from '@/contexts/auth-context';

import { AddCourseWizard } from '@/components/courses/add-course-wizard';

export default function CoursesPage() {
    const { user } = useAuth();
    const isTeacher = user?.role === 'teacher';

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight font-cairo">إدارة الكورسات</h2>
                    <p className="text-muted-foreground">أدر المحتوى التعليمي، عدل الدروس، وتابع حالات النشر.</p>
                </div>
                {!isTeacher && (
                    <AddCourseWizard>
                        <Button className="font-cairo gap-2" variant="emerald">
                            <Plus className="w-4 h-4" />
                            كورس جديد
                        </Button>
                    </AddCourseWizard>
                )}
            </div>

            <CoursesTable />
        </div>
    );
}
