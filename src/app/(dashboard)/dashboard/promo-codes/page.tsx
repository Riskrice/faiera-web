'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger
} from '@/components/ui/dialog';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
    Ticket, Plus, Search, Copy, CheckCircle2, XCircle, RefreshCw,
    Loader2, Zap, TrendingUp, Users, BadgePercent, ToggleLeft, ToggleRight,
    AlertCircle, Clock, Shuffle, Trash2, BookOpen, Package, ChevronDown, X
} from 'lucide-react';
import {
    getPromoCodes, createPromoCode, generatePromoCodes, deactivatePromoCode,
    reactivatePromoCode, deletePromoCode, getPromoCodeAnalytics, getCourses, getSubscriptionPlans,
    type PromoCode, type PromoCodeAnalytics, type CreatePromoCodeInput, type GeneratePromoCodesInput
} from '@/lib/api';

const SCOPE_LABELS: Record<string, string> = { global: 'عام', course: 'كورس محدد', plan: 'باقة اشتراك' };
const SCOPE_COLORS: Record<string, string> = {
    global: 'bg-blue-100 text-blue-700',
    course: 'bg-purple-100 text-purple-700',
    plan: 'bg-amber-100 text-amber-700'
};

// ─── Searchable Entity Picker ────────────────────────────────────────────────
function SearchableEntityPicker({
    type, items, loading, value, onChange, placeholder
}: {
    type: 'course' | 'plan';
    items: any[];
    loading: boolean;
    value: string;
    onChange: (id: string, label: string) => void;
    placeholder?: string;
}) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const ref = useRef<HTMLDivElement>(null);

    const selected = items.find(i => i.id === value);
    const selectedLabel = selected ? (type === 'course' ? (selected.titleAr || selected.title) : selected.name) : '';

    const filtered = items.filter(i => {
        const label = type === 'course' ? (i.titleAr || i.title || '') : (i.name || '');
        return label.toLowerCase().includes(query.toLowerCase());
    });

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const Icon = type === 'course' ? BookOpen : Package;
    const color = type === 'course' ? 'text-purple-600' : 'text-amber-600';
    const bg = type === 'course' ? 'bg-purple-50 border-purple-200' : 'bg-amber-50 border-amber-200';

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                onClick={() => { setOpen(o => !o); setQuery(''); }}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg border bg-background text-sm transition-all
                    ${open ? 'border-primary ring-1 ring-primary/20' : 'border-border hover:border-primary/50'}`}
            >
                <div className="flex items-center gap-2 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${color}`} />
                    <span className={`truncate ${!selectedLabel ? 'text-muted-foreground' : 'font-medium'}`}>
                        {selectedLabel || placeholder || 'اختر...'}
                    </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                    {value && (
                        <span onClick={e => { e.stopPropagation(); onChange('', ''); }}
                            className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground">
                            <X className="w-3 h-3" />
                        </span>
                    )}
                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
                </div>
            </button>

            {open && (
                <div className="absolute z-50 top-full mt-1 w-full bg-popover border border-border rounded-lg shadow-lg overflow-hidden">
                    {/* Search box */}
                    <div className="p-2 border-b border-border">
                        <div className="relative">
                            <Search className="absolute right-2.5 top-2 w-3.5 h-3.5 text-muted-foreground" />
                            <input
                                autoFocus
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                placeholder="ابحث..."
                                className="w-full pr-8 pl-3 py-1.5 text-sm bg-muted rounded-md border-0 outline-none focus:ring-1 focus:ring-primary/30"
                            />
                        </div>
                    </div>
                    {/* Items list */}
                    <div className="max-h-52 overflow-y-auto">
                        {loading && (
                            <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                                <Loader2 className="w-4 h-4 animate-spin" /> جاري التحميل...
                            </div>
                        )}
                        {!loading && filtered.length === 0 && (
                            <div className="py-6 text-center text-sm text-muted-foreground">لا توجد نتائج</div>
                        )}
                        {!loading && filtered.map(item => {
                            const label = type === 'course' ? (item.titleAr || item.title) : item.name;
                            const sub = type === 'course' ? (item.titleEn || item.grade || '') : (item.description || '');
                            const isActive = item.id === value;
                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => { onChange(item.id, label); setOpen(false); setQuery(''); }}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-right hover:bg-muted transition-colors
                                        ${isActive ? 'bg-primary/5 border-r-2 border-primary' : ''}`}
                                >
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${bg}`}>
                                        <Icon className={`w-4 h-4 ${color}`} />
                                    </div>
                                    <div className="flex-1 text-right min-w-0">
                                        <p className="text-sm font-medium truncate">{label}</p>
                                        {sub && <p className="text-xs text-muted-foreground truncate">{sub}</p>}
                                    </div>
                                    {isActive && <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />}
                                </button>
                            );
                        })}
                    </div>
                    {filtered.length > 0 && (
                        <div className="px-3 py-1.5 border-t border-border bg-muted/30">
                            <p className="text-xs text-muted-foreground">{filtered.length} نتيجة</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
// ─────────────────────────────────────────────────────────────────────────────

function StatCard({ title, value, icon: Icon, color }: { title: string; value: string | number; icon: any; color: string }) {
    return (
        <Card className="border-border">
            <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-muted-foreground font-cairo">{title}</p>
                        <p className="text-2xl font-bold mt-1">{value}</p>
                    </div>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${color}`}>
                        <Icon className="w-6 h-6" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function CreateCodeDialog({ onSuccess, token }: { onSuccess: () => void; token: string }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState<CreatePromoCodeInput>({
        code: '', discountType: 'percentage', discountValue: 10,
        scope: 'global', startsAt: new Date().toISOString().split('T')[0],
        maxUsesPerUser: 1, isActive: true,
    });

    const [courses, setCourses] = useState<any[]>([]);
    const [plans, setPlans] = useState<any[]>([]);
    const [loadingScope, setLoadingScope] = useState(false);

    useEffect(() => {
        if (form.scope === 'course' && courses.length === 0) {
            setLoadingScope(true);
            getCourses({ pageSize: 100 })
                .then(res => setCourses((res as any)?.data || []))
                .catch(() => toast.error('فشل جلب الكورسات'))
                .finally(() => setLoadingScope(false));
        } else if (form.scope === 'plan' && plans.length === 0) {
            setLoadingScope(true);
            getSubscriptionPlans(token)
                .then(res => setPlans((res as any)?.data || []))
                .catch(() => toast.error('فشل جلب الباقات'))
                .finally(() => setLoadingScope(false));
        }
    }, [form.scope, courses.length, plans.length, token]);

    const generateCode = () => {
        const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
        const part = (n: number) => Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
        setForm(f => ({ ...f, code: `${part(4)}-${part(4)}` }));
    };

    const handleSubmit = async () => {
        if (!form.code || !form.discountValue) { toast.error('يرجى تعبئة الحقول المطلوبة'); return; }
        if (form.scope !== 'global' && !form.scopeReferenceId) {
            toast.error(form.scope === 'course' ? 'يرجى اختيار الكورس' : 'يرجى اختيار الباقة');
            return;
        }
        setLoading(true);
        try {
            await createPromoCode({ ...form, startsAt: new Date(form.startsAt).toISOString() }, token);
            toast.success('تم إنشاء كود الخصم بنجاح ✅');
            setOpen(false);
            onSuccess();
        } catch (e: any) {
            toast.error(e?.message || 'حدث خطأ');
        } finally { setLoading(false); }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2"><Plus className="w-4 h-4" />إنشاء كود</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md font-cairo overflow-y-auto max-h-[90vh]">
                <div dir="rtl">
                <DialogHeader>
                    <DialogTitle>إنشاء كود خصم جديد</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>كود الخصم *</Label>
                        <div className="flex gap-2">
                            <Input placeholder="مثال: SUMMER25" value={form.code}
                                onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} />
                            <Button variant="outline" size="icon" onClick={generateCode} title="توليد تلقائي">
                                <Shuffle className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <Label>نوع الخصم</Label>
                            <Select value={form.discountType} onValueChange={v => setForm(f => ({ ...f, discountType: v as any }))}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="percentage">نسبة مئوية %</SelectItem>
                                    <SelectItem value="fixed_amount">مبلغ ثابت EGP</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>قيمة الخصم *</Label>
                            <Input type="number" min={0.01} value={form.discountValue}
                                onChange={e => setForm(f => ({ ...f, discountValue: parseFloat(e.target.value) }))} />
                        </div>
                    </div>
                    {form.discountType === 'percentage' && (
                        <div className="space-y-2">
                            <Label>حد أقصى للخصم (EGP) — اختياري</Label>
                            <Input type="number" placeholder="مثال: 200" value={form.maxDiscountCap || ''}
                                onChange={e => setForm(f => ({ ...f, maxDiscountCap: e.target.value ? parseFloat(e.target.value) : undefined }))} />
                        </div>
                    )}
                    
                    {/* SCOPE SELECTION */}
                    <div className="space-y-2 p-3 bg-muted/50 rounded-lg border border-border">
                        <Label>النطاق</Label>
                        <Select value={form.scope} onValueChange={v => setForm(f => ({ ...f, scope: v as any, scopeReferenceId: undefined }))}>
                            <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="global">🌍 عام (كل الكورسات والباقات)</SelectItem>
                                <SelectItem value="course">📚 كورس محدد</SelectItem>
                                <SelectItem value="plan">💎 باقة اشتراك محددة</SelectItem>
                            </SelectContent>
                        </Select>

                        {form.scope === 'course' && (
                            <div className="mt-3 space-y-1.5 animate-in fade-in slide-in-from-top-1">
                                <Label className="text-xs text-muted-foreground">اختر الكورس المستهدف</Label>
                                <SearchableEntityPicker
                                    type="course"
                                    items={courses}
                                    loading={loadingScope}
                                    value={form.scopeReferenceId || ''}
                                    onChange={(id) => setForm(f => ({ ...f, scopeReferenceId: id || undefined }))}
                                    placeholder="ابحث واختر الكورس..."
                                />
                            </div>
                        )}

                        {form.scope === 'plan' && (
                            <div className="mt-3 space-y-1.5 animate-in fade-in slide-in-from-top-1">
                                <Label className="text-xs text-muted-foreground">اختر باقة الاشتراك المستهدفة</Label>
                                <SearchableEntityPicker
                                    type="plan"
                                    items={plans}
                                    loading={loadingScope}
                                    value={form.scopeReferenceId || ''}
                                    onChange={(id) => setForm(f => ({ ...f, scopeReferenceId: id || undefined }))}
                                    placeholder="ابحث واختر الباقة..."
                                />
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <Label>تاريخ البداية</Label>
                            <Input type="date" value={form.startsAt}
                                onChange={e => setForm(f => ({ ...f, startsAt: e.target.value }))} />
                        </div>
                        <div className="space-y-2">
                            <Label>تاريخ الانتهاء — اختياري</Label>
                            <Input type="date" value={form.expiresAt || ''}
                                onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value || undefined }))} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <Label>حد الاستخدام الكلي</Label>
                            <Input type="number" placeholder="بلا حد" value={form.maxTotalUses || ''}
                                onChange={e => setForm(f => ({ ...f, maxTotalUses: e.target.value ? parseInt(e.target.value) : undefined }))} />
                        </div>
                        <div className="space-y-2">
                            <Label>حد لكل مستخدم</Label>
                            <Input type="number" min={1} value={form.maxUsesPerUser}
                                onChange={e => setForm(f => ({ ...f, maxUsesPerUser: parseInt(e.target.value) }))} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>تصنيف الحملة — اختياري</Label>
                        <Input placeholder="مثال: eid_2026, back_to_school" value={form.campaignTag || ''}
                            onChange={e => setForm(f => ({ ...f, campaignTag: e.target.value || undefined }))} />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleSubmit} disabled={loading} className="w-full">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
                        حفظ الكود
                    </Button>
                </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function BatchGenerateDialog({ onSuccess, token }: { onSuccess: () => void; token: string }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState<GeneratePromoCodesInput>({
        count: 10, prefix: '', codeLength: 8,
        discountType: 'percentage', discountValue: 20, scope: 'global',
        startsAt: new Date().toISOString().split('T')[0], maxUsesPerUser: 1,
    });

    const [courses, setCourses] = useState<any[]>([]);
    const [plans, setPlans] = useState<any[]>([]);
    const [loadingScope, setLoadingScope] = useState(false);

    useEffect(() => {
        if (form.scope === 'course' && courses.length === 0) {
            setLoadingScope(true);
            getCourses({ pageSize: 100 })
                .then(res => setCourses((res as any)?.data || []))
                .catch(() => toast.error('فشل جلب الكورسات'))
                .finally(() => setLoadingScope(false));
        } else if (form.scope === 'plan' && plans.length === 0) {
            setLoadingScope(true);
            getSubscriptionPlans(token)
                .then(res => setPlans((res as any)?.data || []))
                .catch(() => toast.error('فشل جلب الباقات'))
                .finally(() => setLoadingScope(false));
        }
    }, [form.scope, courses.length, plans.length, token]);

    const handleGenerate = async () => {
        if (form.scope !== 'global' && !form.scopeReferenceId) {
            toast.error(form.scope === 'course' ? 'يرجى اختيار الكورس' : 'يرجى اختيار الباقة');
            return;
        }
        setLoading(true);
        try {
            const res = await generatePromoCodes({
                ...form,
                startsAt: new Date(form.startsAt).toISOString(),
                prefix: form.prefix || undefined,
            }, token);
            const count = (res as any)?.data?.length || form.count;
            toast.success(`تم توليد ${count} كود بنجاح 🎉`);
            setOpen(false);
            onSuccess();
        } catch (e: any) {
            toast.error(e?.message || 'حدث خطأ أثناء التوليد');
        } finally { setLoading(false); }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2"><Zap className="w-4 h-4" />توليد تلقائي</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md font-cairo overflow-y-auto max-h-[90vh]">
                <div dir="rtl">
                <DialogHeader>
                    <DialogTitle>توليد أكواد تلقائية (Batch)</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-2">
                            <Label>عدد الأكواد</Label>
                            <Input type="number" min={1} max={1000} value={form.count}
                                onChange={e => setForm(f => ({ ...f, count: parseInt(e.target.value) }))} />
                        </div>
                        <div className="space-y-2">
                            <Label>بادئة (Prefix)</Label>
                            <Input placeholder="EID" value={form.prefix || ''}
                                onChange={e => setForm(f => ({ ...f, prefix: e.target.value.toUpperCase() || '' }))} />
                        </div>
                        <div className="space-y-2">
                            <Label>طول الكود</Label>
                            <Input type="number" min={4} max={12} value={form.codeLength || 8}
                                onChange={e => setForm(f => ({ ...f, codeLength: parseInt(e.target.value) }))} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <Label>نوع الخصم</Label>
                            <Select value={form.discountType} onValueChange={v => setForm(f => ({ ...f, discountType: v as any }))}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="percentage">نسبة %</SelectItem>
                                    <SelectItem value="fixed_amount">مبلغ EGP</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>قيمة الخصم</Label>
                            <Input type="number" value={form.discountValue}
                                onChange={e => setForm(f => ({ ...f, discountValue: parseFloat(e.target.value) }))} />
                        </div>
                    </div>
                    
                    {/* SCOPE SELECTION */}
                    <div className="space-y-2 p-3 bg-muted/50 rounded-lg border border-border">
                        <Label>النطاق</Label>
                        <Select value={form.scope} onValueChange={v => setForm(f => ({ ...f, scope: v as any, scopeReferenceId: undefined }))}>
                            <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="global">🌍 عام (كل الكورسات والباقات)</SelectItem>
                                <SelectItem value="course">📚 كورس محدد</SelectItem>
                                <SelectItem value="plan">💎 باقة اشتراك محددة</SelectItem>
                            </SelectContent>
                        </Select>

                        {form.scope === 'course' && (
                            <div className="mt-3 space-y-1.5 animate-in fade-in slide-in-from-top-1">
                                <Label className="text-xs text-muted-foreground">اختر الكورس المستهدف</Label>
                                <SearchableEntityPicker
                                    type="course"
                                    items={courses}
                                    loading={loadingScope}
                                    value={form.scopeReferenceId || ''}
                                    onChange={(id) => setForm(f => ({ ...f, scopeReferenceId: id || undefined }))}
                                    placeholder="ابحث واختر الكورس..."
                                />
                            </div>
                        )}

                        {form.scope === 'plan' && (
                            <div className="mt-3 space-y-1.5 animate-in fade-in slide-in-from-top-1">
                                <Label className="text-xs text-muted-foreground">اختر باقة الاشتراك المستهدفة</Label>
                                <SearchableEntityPicker
                                    type="plan"
                                    items={plans}
                                    loading={loadingScope}
                                    value={form.scopeReferenceId || ''}
                                    onChange={(id) => setForm(f => ({ ...f, scopeReferenceId: id || undefined }))}
                                    placeholder="ابحث واختر الباقة..."
                                />
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <Label>تاريخ البداية</Label>
                            <Input type="date" value={form.startsAt}
                                onChange={e => setForm(f => ({ ...f, startsAt: e.target.value }))} />
                        </div>
                        <div className="space-y-2">
                            <Label>تاريخ الانتهاء</Label>
                            <Input type="date" value={form.expiresAt || ''}
                                onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value || undefined }))} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>تصنيف الحملة</Label>
                        <Input placeholder="مثال: eid_2026" value={form.campaignTag || ''}
                            onChange={e => setForm(f => ({ ...f, campaignTag: e.target.value || undefined }))} />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleGenerate} disabled={loading} className="w-full gap-2">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                        توليد {form.count} كود
                    </Button>
                </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default function PromoCodesPage() {
    const { accessToken } = useAuth();
    const [codes, setCodes] = useState<PromoCode[]>([]);
    const [analytics, setAnalytics] = useState<PromoCodeAnalytics | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [scopeFilter, setScopeFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        if (!accessToken) return;
        setLoading(true);
        try {
            const [codesRes, analyticsRes] = await Promise.all([
                getPromoCodes({}, accessToken),
                getPromoCodeAnalytics(accessToken),
            ]);
            setCodes((codesRes as any)?.data || []);
            setAnalytics((analyticsRes as any)?.data || null);
        } catch {
            toast.error('حدث خطأ أثناء تحميل البيانات');
        } finally {
            setLoading(false);
        }
    }, [accessToken]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleCopy = (code: string, id: string) => {
        navigator.clipboard.writeText(code);
        setCopiedId(id);
        toast.success('تم نسخ الكود!');
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleToggle = async (promo: PromoCode) => {
        try {
            if (promo.isActive) {
                await deactivatePromoCode(promo.id, accessToken!);
                toast.success('تم تعطيل الكود');
            } else {
                await reactivatePromoCode(promo.id, accessToken!);
                toast.success('تم إعادة تفعيل الكود');
            }
            fetchData();
        } catch (e: any) {
            toast.error(e?.message || 'حدث خطأ');
        }
    };

    const handleDelete = async (promo: PromoCode) => {
        if (!confirm(`هل أنت متأكد من حذف كود الخصم ${promo.code}؟`)) return;
        try {
            await deletePromoCode(promo.id, accessToken!);
            toast.success('تم حذف الكود بنجاح');
            fetchData();
        } catch (e: any) {
            toast.error(e?.message || 'حدث خطأ أثناء الحذف. تأكد من أن الكود لم يتم استخدامه.');
        }
    };

    const filtered = codes.filter(c => {
        if (scopeFilter !== 'all' && c.scope !== scopeFilter) return false;
        if (statusFilter === 'active' && !c.isActive) return false;
        if (statusFilter === 'inactive' && c.isActive) return false;
        if (search && !c.code.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });

    const isExpired = (c: PromoCode) => c.expiresAt && new Date(c.expiresAt) < new Date();

    if (loading) {
        return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
    }

    return (
        <div className="flex-1 space-y-6" dir="rtl">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight font-cairo flex items-center gap-2">
                        <Ticket className="w-8 h-8 text-primary" /> أكواد الخصم
                    </h2>
                    <p className="text-muted-foreground mt-1">إنشاء وإدارة أكواد الخصم للكورسات والاشتراكات</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={fetchData} size="icon"><RefreshCw className="w-4 h-4" /></Button>
                    <BatchGenerateDialog onSuccess={fetchData} token={accessToken!} />
                    <CreateCodeDialog onSuccess={fetchData} token={accessToken!} />
                </div>
            </div>

            {/* KPI Cards */}
            {analytics && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard title="إجمالي الأكواد" value={analytics.totalCodes} icon={Ticket} color="bg-blue-100 text-blue-600" />
                    <StatCard title="الأكواد النشطة" value={analytics.activeCodes} icon={CheckCircle2} color="bg-green-100 text-green-600" />
                    <StatCard title="إجمالي الاستخدامات" value={analytics.totalUses} icon={Users} color="bg-purple-100 text-purple-600" />
                    <StatCard title="إجمالي الخصومات" value={`${analytics.totalDiscountAmount?.toLocaleString() || 0} EGP`} icon={BadgePercent} color="bg-amber-100 text-amber-600" />
                </div>
            )}

            {/* Filters */}
            <div className="flex items-center gap-3 bg-card p-4 rounded-lg border border-border">
                <div className="relative flex-1">
                    <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="بحث عن كود..." className="pr-9" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <Select value={scopeFilter} onValueChange={setScopeFilter}>
                    <SelectTrigger className="w-[160px]"><SelectValue placeholder="النطاق" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">جميع النطاقات</SelectItem>
                        <SelectItem value="global">عام</SelectItem>
                        <SelectItem value="course">كورس</SelectItem>
                        <SelectItem value="plan">باقة</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[140px]"><SelectValue placeholder="الحالة" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">جميع الحالات</SelectItem>
                        <SelectItem value="active">نشط</SelectItem>
                        <SelectItem value="inactive">معطل</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Table */}
            <div className="bg-card rounded-lg border border-border overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-right">الكود</TableHead>
                            <TableHead className="text-right">الخصم</TableHead>
                            <TableHead className="text-right">النطاق</TableHead>
                            <TableHead className="text-right">الاستخدام</TableHead>
                            <TableHead className="text-right">الصلاحية</TableHead>
                            <TableHead className="text-right">الحالة</TableHead>
                            <TableHead className="text-right">إجراءات</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.length > 0 ? filtered.map(promo => (
                            <TableRow key={promo.id} className="group">
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <code className="font-mono font-bold text-sm bg-muted px-2 py-1 rounded">{promo.code}</code>
                                        <button onClick={() => handleCopy(promo.code, promo.id)}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground">
                                            {copiedId === promo.id ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                                        </button>
                                    </div>
                                    {promo.campaignTag && <span className="text-xs text-muted-foreground mt-0.5 block"># {promo.campaignTag}</span>}
                                </TableCell>
                                <TableCell>
                                    <div className="font-semibold text-emerald-600">
                                        {promo.discountType === 'percentage' ? `${promo.discountValue}%` : `${promo.discountValue} EGP`}
                                    </div>
                                    {promo.maxDiscountCap && <span className="text-xs text-muted-foreground">حد أقصى {promo.maxDiscountCap} EGP</span>}
                                </TableCell>
                                <TableCell>
                                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${SCOPE_COLORS[promo.scope]}`}>
                                        {SCOPE_LABELS[promo.scope]}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1 text-sm">
                                        <span className="font-mono font-bold">{promo.currentUses}</span>
                                        <span className="text-muted-foreground">/ {promo.maxTotalUses ?? '∞'}</span>
                                    </div>
                                    {promo.maxTotalUses && (
                                        <div className="w-16 bg-muted rounded-full h-1.5 mt-1">
                                            <div className="bg-primary h-1.5 rounded-full"
                                                style={{ width: `${Math.min((promo.currentUses / promo.maxTotalUses) * 100, 100)}%` }} />
                                        </div>
                                    )}
                                </TableCell>
                                <TableCell className="text-sm">
                                    {isExpired(promo) ? (
                                        <span className="flex items-center gap-1 text-red-500"><AlertCircle className="w-3.5 h-3.5" />منتهية</span>
                                    ) : promo.expiresAt ? (
                                        <span className="flex items-center gap-1 text-muted-foreground">
                                            <Clock className="w-3.5 h-3.5" />{new Date(promo.expiresAt).toLocaleDateString('ar-EG')}
                                        </span>
                                    ) : (
                                        <span className="text-muted-foreground">لا تنتهي</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {promo.isActive && !isExpired(promo) ? (
                                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 gap-1">
                                            <CheckCircle2 className="w-3 h-3" />نشط
                                        </Badge>
                                    ) : (
                                        <Badge variant="secondary" className="gap-1">
                                            <XCircle className="w-3 h-3" />{isExpired(promo) ? 'منتهي' : 'معطل'}
                                        </Badge>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <div className="flex gap-2 items-center">
                                        <button onClick={() => handleToggle(promo)}
                                            className="text-muted-foreground hover:text-foreground transition-colors" title={promo.isActive ? 'تعطيل' : 'إعادة تفعيل'}>
                                            {promo.isActive ? <ToggleRight className="w-6 h-6 text-green-500" /> : <ToggleLeft className="w-6 h-6" />}
                                        </button>
                                        <button onClick={() => handleDelete(promo)}
                                            className="text-red-500 hover:text-red-700 transition-colors" title="حذف">
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                                    {search || scopeFilter !== 'all' || statusFilter !== 'all'
                                        ? 'لا توجد أكواد مطابقة للبحث.' : 'لا توجد أكواد خصم بعد. قم بإنشاء أول كود!'}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
