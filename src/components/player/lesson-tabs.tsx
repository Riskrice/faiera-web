'use client';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Course, Lesson } from '@/data/courses';
import { FileText, MessageSquare, StickyNote, Download, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';

interface LessonTabsProps {
    lesson: Lesson;
    course: Course;
}

export function LessonTabs({ lesson, course }: LessonTabsProps) {
    return (
        <Tabs defaultValue="overview" className="w-full">
            <div className="border-b border-white/5">
                <TabsList className="bg-transparent p-0 gap-6">
                    <TabsTrigger value="overview" className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-0 py-3 text-gray-400 data-[state=active]:text-primary text-base transition-all data-[state=active]:text-shadow-glow">
                        <Info className="w-4 h-4 ml-2" />
                        نظرة عامة
                    </TabsTrigger>
                    <TabsTrigger value="qa" className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-0 py-3 text-gray-400 data-[state=active]:text-primary text-base">
                        <MessageSquare className="w-4 h-4 ml-2" />
                        سؤال وجواب (Q&A)
                    </TabsTrigger>
                    <TabsTrigger value="notes" className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-0 py-3 text-gray-400 data-[state=active]:text-primary text-base">
                        <StickyNote className="w-4 h-4 ml-2" />
                        ملاحظاتي
                    </TabsTrigger>
                </TabsList>
            </div>

            <TabsContent value="overview" className="py-6 space-y-6 animate-in fade-in-50 slide-in-from-bottom-2">
                <div className="space-y-4">
                    <h2 className="text-2xl font-bold font-cairo text-foreground">{lesson.title}</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        في هذا الدرس سوف نتعلم الأساسيات الخاصة بهذا الموضوع، مع التركيز على النقاط الهامة التي تأتي دائماً في الامتحانات. تأكد من متابعة الشرح للنهاية وحل التدريبات المرفقة.
                    </p>
                </div>

                <div className="flex items-center gap-4 bg-card p-4 rounded-xl border border-border">
                    <Avatar className="w-12 h-12 border-2 border-border">
                        <AvatarImage src={course.author.avatar} />
                        <AvatarFallback>MR</AvatarFallback>
                    </Avatar>
                    <div>
                        <h4 className="font-bold text-foreground">{course.author.name}</h4>
                        <p className="text-xs text-muted-foreground">{course.author.role}</p>
                    </div>
                </div>

                <div className="space-y-3">
                    <h3 className="font-bold text-foreground text-lg font-cairo">ملفات ومرفقات</h3>
                    <div className="grid sm:grid-cols-2 gap-3">
                        <Button variant="outline" className="justify-start border-border hover:bg-muted h-auto py-3 text-right">
                            <FileText className="w-5 h-5 ml-3 text-blue-500" />
                            <div className="flex flex-col items-start text-foreground">
                                <span className="font-bold">ملخص الدرس PDF</span>
                                <span className="text-xs text-muted-foreground">2.5 MB</span>
                            </div>
                            <Download className="w-4 h-4 mr-auto text-muted-foreground" />
                        </Button>
                        <Button variant="outline" className="justify-start border-border hover:bg-muted h-auto py-3 text-right">
                            <FileText className="w-5 h-5 ml-3 text-emerald-500" />
                            <div className="flex flex-col items-start text-foreground">
                                <span className="font-bold">ورقة التدريبات (Workshop)</span>
                                <span className="text-xs text-muted-foreground">1.2 MB</span>
                            </div>
                            <Download className="w-4 h-4 mr-auto text-muted-foreground" />
                        </Button>
                    </div>
                </div>
            </TabsContent>

            <TabsContent value="qa" className="py-6">
                <div className="text-center py-16 bg-card rounded-xl border border-border dashed">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                        <MessageSquare className="w-8 h-8 text-primary/80" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2 font-cairo">عندك سؤال؟</h3>
                    <p className="text-muted-foreground max-w-sm mx-auto mb-8 leading-relaxed">
                        اسأل المعلم أو زمايلك في الكورس وهيتم الرد عليك في أسرع وقت.
                    </p>
                    <div className="max-w-xl mx-auto flex gap-3 px-6">
                        <Input
                            placeholder="اكتب سؤالك هنا..."
                            className="bg-background border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary h-12"
                        />
                        <Button className="h-12 px-8 font-bold">إرسال</Button>
                    </div>
                </div>
            </TabsContent>

            <TabsContent value="notes" className="py-6">
                <textarea
                    className="w-full h-64 bg-card border border-border rounded-xl p-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none font-cairo leading-relaxed"
                    placeholder="اكتب ملاحظاتك هنا أثناء المشاهدة... (سيتم حفظها تلقائياً)"
                />
            </TabsContent>
        </Tabs>
    );
}
