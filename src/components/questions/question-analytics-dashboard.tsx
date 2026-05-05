"use client"

import React, { useMemo } from "react"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import { CheckCircle2, AlertTriangle, ArrowUpRight, ArrowDownRight, Archive, Eye } from "lucide-react"
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend,
    RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
    ScatterChart, Scatter, ReferenceLine, ZAxis
} from 'recharts'
import { QuestionAnalytics } from "@/lib/api"

interface QuestionAnalyticsDashboardProps {
    data: QuestionAnalytics | null
    isLoading: boolean
    onEditQuestion?: (id: string) => void
    onArchiveQuestion?: (id: string) => void
}

const COLORS = ['#22c55e', '#3b82f6', '#a855f7', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6'];
const DIFFICULTY_COLORS = { 'EASY': '#22c55e', 'MEDIUM': '#eab308', 'HARD': '#f97316', 'EXPERT': '#ef4444' };

export function QuestionAnalyticsDashboard({ data, isLoading, onEditQuestion, onArchiveQuestion }: QuestionAnalyticsDashboardProps) {
    if (isLoading || !data) {
        return (
            <div className="space-y-6 dir-rtl text-right">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-80 rounded-xl" />)}
                </div>
                <Skeleton className="h-96 rounded-xl" />
                <Skeleton className="h-64 rounded-xl" />
                <div className="grid gap-4 md:grid-cols-2">
                    {[1, 2].map(i => <Skeleton key={i} className="h-64 rounded-xl" />)}
                </div>
            </div>
        )
    }

    if (data.totalQuestions === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center dir-rtl">
                <div className="bg-primary/10 p-4 rounded-full mb-4">
                    <CheckCircle2 className="h-12 w-12 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">لا توجد بيانات كافية بعد</h3>
                <p className="text-muted-foreground max-w-md">
                    أضف أسئلة للبنك وابدأ في استخدامها في الاختبارات لتفعيل لوحة التحليلات الذكية.
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-6 dir-rtl text-right">
            {/* ROW 1: KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">إجمالي الأسئلة</CardTitle>
                        <Badge variant="secondary" className="bg-primary/10 text-primary">العدد الكلي</Badge>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.totalQuestions}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            سؤال متوفر في هذا النطاق
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">متوسط الجودة</CardTitle>
                        {data.avgCorrectRate > 50 ? (
                            <ArrowUpRight className="h-4 w-4 text-green-500" />
                        ) : (
                            <ArrowDownRight className="h-4 w-4 text-orange-500" />
                        )}
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.avgCorrectRate.toFixed(1)}%</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            متوسط معدل الإجابات الصحيحة
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                            الأسئلة المُعلَّمة
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.flaggedCount}</div>
                        <p className="text-xs text-muted-foreground mt-1 text-amber-500">
                            سؤال يحتاج إلى مراجعة الجودة
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">متوسط وقت الإجابة</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.avgTimeSeconds.toFixed(0)} ثانية</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            معدل الوقت الفعلي للطلاب
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* ROW 2: Charts */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle className="text-sm">توزيع مستوى الصعوبة</CardTitle>
                    </CardHeader>
                    <CardContent className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.difficultyDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                <XAxis dataKey="value" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                                <RechartsTooltip 
                                    cursor={{ fill: 'hsl(var(--muted))' }}
                                    contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                                />
                                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                    {data.difficultyDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={DIFFICULTY_COLORS[entry.value as keyof typeof DIFFICULTY_COLORS] || COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle className="text-sm">توزيع أنواع الأسئلة</CardTitle>
                    </CardHeader>
                    <CardContent className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.typeDistribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="count"
                                    nameKey="value"
                                >
                                    {data.typeDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <RechartsTooltip contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }} />
                                <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '12px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle className="text-sm">توزيع مستويات Bloom</CardTitle>
                    </CardHeader>
                    <CardContent className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data.bloomDistribution}>
                                <PolarGrid stroke="hsl(var(--border))" />
                                <PolarAngleAxis dataKey="value" fontSize={10} />
                                <PolarRadiusAxis angle={30} domain={[0, 'auto']} fontSize={10} />
                                <Radar name="الأسئلة" dataKey="count" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.5} />
                                <RechartsTooltip contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* ROW 3: Scatter Plot (Item Analysis) */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center justify-between">
                        <span>تحليل جودة الأسئلة (Item Analysis Scatter Plot)</span>
                        <Badge variant="outline" className="font-normal text-xs" title="مؤشر التمييز سيتوفر لاحقاً عند توفر بيانات محاولات كافية">
                            يعتمد على معدل الصحة
                        </Badge>
                    </CardTitle>
                    <CardDescription>كل نقطة تمثل سؤالاً. المنطقة بين الخطين هي المنطقة المثالية (متوازن).</CardDescription>
                </CardHeader>
                <CardContent className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis type="number" dataKey="usageCount" name="الاستخدام" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis type="number" dataKey="correctRate" name="معدل الصحة" unit="%" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                            <ZAxis type="category" dataKey="type" name="النوع" />
                            
                            {/* Colored Zones Background - Optional approach, using ReferenceLines instead for standard look */}
                            <ReferenceLine y={85} stroke="#eab308" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: 'سهل جداً (>85%)', fill: '#eab308', fontSize: 12 }} />
                            <ReferenceLine y={30} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'insideBottomLeft', value: 'صعب جداً (<30%)', fill: '#ef4444', fontSize: 12 }} />
                            
                            <RechartsTooltip 
                                cursor={{ strokeDasharray: '3 3' }} 
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        const d = payload[0].payload;
                                        return (
                                            <div className="bg-background border border-border p-3 rounded-lg shadow-md max-w-xs dir-rtl text-right">
                                                <p className="font-semibold text-sm line-clamp-2 mb-2">{d.text}</p>
                                                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                                                    <div>معدل الصحة: <span className="font-medium text-foreground">{d.correctRate}%</span></div>
                                                    <div>الاستخدام: <span className="font-medium text-foreground">{d.usageCount}</span></div>
                                                    <div>النوع: <span className="font-medium text-foreground">{d.type}</span></div>
                                                </div>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            
                            <Scatter name="الأسئلة" data={data.scatterData}>
                                {data.scatterData.map((entry, index) => {
                                    let fill = COLORS[0];
                                    if (entry.correctRate < 30) fill = '#ef4444'; // Red for hard
                                    else if (entry.correctRate > 85) fill = '#eab308'; // Yellow for easy
                                    else fill = '#22c55e'; // Green for ideal
                                    
                                    return <Cell key={`cell-${index}`} fill={fill} />
                                })}
                            </Scatter>
                        </ScatterChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* ROW 4: Flagged Questions Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">الأسئلة المُعلَّمة (تحتاج مراجعة)</CardTitle>
                    <CardDescription>أسئلة أداؤها خارج المنطقة المثالية أو لم تُستخدم إطلاقاً.</CardDescription>
                </CardHeader>
                <CardContent>
                    {data.flaggedQuestions.length === 0 ? (
                        <div className="flex flex-col items-center py-8 text-center">
                            <CheckCircle2 className="h-10 w-10 text-green-500 mb-3" />
                            <p className="text-lg font-medium">جميع الأسئلة بجودة عالية ✓</p>
                            <p className="text-sm text-muted-foreground">لا توجد أسئلة تتطلب تدخلاً حالياً.</p>
                        </div>
                    ) : (
                        <div className="rounded-md border overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50">
                                        <TableHead className="text-right w-1/2">نص السؤال</TableHead>
                                        <TableHead className="text-right">معدل الصحة</TableHead>
                                        <TableHead className="text-right">الاستخدام</TableHead>
                                        <TableHead className="text-right">السبب</TableHead>
                                        <TableHead className="text-center w-[100px]">إجراء</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.flaggedQuestions.map((q) => (
                                        <TableRow key={q.id}>
                                            <TableCell className="font-medium">
                                                <div className="line-clamp-1" title={q.text}>{q.text}</div>
                                            </TableCell>
                                            <TableCell>{q.correctRate}%</TableCell>
                                            <TableCell>{q.usageCount}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={
                                                    q.reason.includes('صعب') ? 'bg-red-50 text-red-600 border-red-200' :
                                                    q.reason.includes('سهل') ? 'bg-yellow-50 text-yellow-600 border-yellow-200' :
                                                    q.reason.includes('وقت') ? 'bg-orange-50 text-orange-600 border-orange-200' :
                                                    'bg-gray-50 text-gray-600 border-gray-200'
                                                }>
                                                    {q.reason.includes('صعب') ? '🔴' : q.reason.includes('سهل') ? '🟡' : q.reason.includes('وقت') ? '🟠' : '⚪'} {q.reason}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Button variant="ghost" size="icon" onClick={() => onEditQuestion?.(q.id)} title="مراجعة">
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* ROW 5: Top / Least Used */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <ArrowUpRight className="h-4 w-4 text-primary" />
                            أكثر 5 أسئلة استخداماً
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {data.topUsed.length > 0 ? data.topUsed.slice(0, 5).map(q => (
                                <div key={q.id} className="flex flex-col gap-1.5">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="font-medium line-clamp-1 flex-1 ml-4" title={q.text}>{q.text}</span>
                                        <span className="text-muted-foreground whitespace-nowrap">{q.usageCount} مرة</span>
                                    </div>
                                    <Progress value={Math.min(q.usageCount * 5, 100)} className="h-1.5" />
                                </div>
                            )) : <p className="text-sm text-muted-foreground">لا توجد بيانات كافية</p>}
                        </div>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                            أقل 5 أسئلة استخداماً
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {data.leastUsed.length > 0 ? data.leastUsed.slice(0, 5).map(q => (
                                <div key={q.id} className="flex flex-col gap-1.5">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="font-medium line-clamp-1 flex-1 ml-4" title={q.text}>{q.text}</span>
                                        <span className="text-muted-foreground whitespace-nowrap">{q.usageCount} مرة</span>
                                    </div>
                                    <Progress value={Math.min(q.usageCount * 5, 100)} className="h-1.5 bg-muted" />
                                </div>
                            )) : <p className="text-sm text-muted-foreground">لا توجد بيانات كافية</p>}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
