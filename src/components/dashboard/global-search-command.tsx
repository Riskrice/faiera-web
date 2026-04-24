'use client';

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, LayoutDashboard, Settings, Video, Users, CreditCard, PlusCircle, Calendar, BookOpen, Compass, FileText, Heart, LineChart, Banknote, Trophy, GraduationCap, BrainCircuit, BarChart3 } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";

export function GlobalSearchCommand() {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();
  const { user } = useAuth();
  
  const role = user?.role || 'student';

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = React.useCallback((command: () => unknown) => {
    setOpen(false);
    command();
  }, []);

  return (
    <>
      <div
        className="relative hidden md:flex items-center w-80 lg:w-96 group cursor-pointer"
        onClick={() => setOpen(true)}
      >
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
        <div className="flex h-9 w-full rounded-md border border-input bg-muted/50 px-3 py-2 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 pr-9">
            <span className="text-muted-foreground">ابحث في لوحة التحكم...</span>
        </div>
        <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <kbd className="pointer-events-none inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
            <span className="text-xs">⌘</span>K
          </kbd>
        </div>
      </div>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="ابحث عن صفحة أو إجراء..." />
        <CommandList>
          <CommandEmpty>لم يتم العثور على نتائج.</CommandEmpty>
          
          {(role === 'admin' || role === 'super_admin') && (
            <>
              <CommandGroup heading="الاختصارات (سريع)">
                <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/courses/create'))}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  <span>إضافة كورس جديد</span>
                </CommandItem>
                <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/sessions'))}>
                  <Calendar className="mr-2 h-4 w-4" />
                  <span>الجلسات المجدولة</span>
                </CommandItem>
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup heading="القائمة الرئيسية">
                <CommandItem onSelect={() => runCommand(() => router.push('/dashboard'))}>
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  <span>الرئيسية</span>
                </CommandItem>
                <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/courses'))}>
                  <BookOpen className="mr-2 h-4 w-4" />
                  <span>الكورسات</span>
                </CommandItem>
                <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/students'))}>
                  <Users className="mr-2 h-4 w-4" />
                  <span>الطلاب</span>
                </CommandItem>
                <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/withdrawals'))}>
                  <Banknote className="mr-2 h-4 w-4" />
                  <span>طلبات السحب</span>
                </CommandItem>
              </CommandGroup>
            </>
          )}

          {role === 'teacher' && (
            <>
              <CommandGroup heading="القائمة الرئيسية">
                <CommandItem onSelect={() => runCommand(() => router.push('/teacher'))}>
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  <span>الرئيسية</span>
                </CommandItem>
                <CommandItem onSelect={() => runCommand(() => router.push('/teacher/sessions'))}>
                  <Video className="mr-2 h-4 w-4" />
                  <span>حصصي</span>
                </CommandItem>
                <CommandItem onSelect={() => runCommand(() => router.push('/teacher/availability'))}>
                  <Calendar className="mr-2 h-4 w-4" />
                  <span>المواعيد المتاحة</span>
                </CommandItem>
                <CommandItem onSelect={() => runCommand(() => router.push('/teacher/students'))}>
                  <Users className="mr-2 h-4 w-4" />
                  <span>الطلاب</span>
                </CommandItem>
                <CommandItem onSelect={() => runCommand(() => router.push('/teacher/wallet'))}>
                  <BarChart3 className="mr-2 h-4 w-4" />
                  <span>المحفظة</span>
                </CommandItem>
              </CommandGroup>
            </>
          )}

          {role === 'student' && (
            <>
              <CommandGroup heading="القائمة الرئيسية">
                <CommandItem onSelect={() => runCommand(() => router.push('/student'))}>
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  <span>الرئيسية</span>
                </CommandItem>
                <CommandItem onSelect={() => runCommand(() => router.push('/student/courses'))}>
                  <BookOpen className="mr-2 h-4 w-4" />
                  <span>كورساتي</span>
                </CommandItem>
                <CommandItem onSelect={() => runCommand(() => router.push('/student/explore'))}>
                  <Compass className="mr-2 h-4 w-4" />
                  <span>كل كورسات المنصة</span>
                </CommandItem>
                <CommandItem onSelect={() => runCommand(() => router.push('/student/sessions'))}>
                  <Video className="mr-2 h-4 w-4" />
                  <span>الحصص المباشرة</span>
                </CommandItem>
                <CommandItem onSelect={() => runCommand(() => router.push('/student/wishlist'))}>
                  <Heart className="mr-2 h-4 w-4" />
                  <span>المحفوظات</span>
                </CommandItem>
              </CommandGroup>
            </>
          )}

          <CommandSeparator />
          <CommandGroup heading="إعدادات الحساب">
            <CommandItem onSelect={() => runCommand(() => {
              if (role === 'admin' || role === 'super_admin') router.push('/dashboard/settings');
              else if (role === 'teacher') router.push('/teacher/settings');
              else router.push('/student/settings');
            })}>
              <Settings className="mr-2 h-4 w-4" />
              <span>الإعدادات</span>
              <CommandShortcut>⌘S</CommandShortcut>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
