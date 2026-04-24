'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronLeft, Home } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

const segmentMap: Record<string, string> = {
  dashboard: 'لوحة التحكم',
  courses: 'كورساتي',
  create: 'إضافة جديد',
  students: 'الطلاب',
  settings: 'الإعدادات',
  withdrawals: 'المحفظة والسحب',
  sessions: 'الجلسات المجدولة',
  analytics: 'التحليلات',
  assessments: 'الاختبارات',
  'question-bank': 'بنك الأسئلة',
  subscriptions: 'الاشتراكات',
  teachers: 'المعلمين',
};

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0 || segments[0] !== 'dashboard') {
    return null; // Only show in dashboard context
  }

  return (
    <Breadcrumb dir="rtl">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/dashboard" className="flex items-center gap-1">
              <Home className="w-3.5 h-3.5" />
              <span className="sr-only">الرئيسية</span>
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>

        {segments.map((segment, index) => {
          const isLast = index === segments.length - 1;
          const href = `/${segments.slice(0, index + 1).join('/')}`;
          const title = segmentMap[segment] || segment;

          return (
            <React.Fragment key={segment}>
              <BreadcrumbSeparator>
                <ChevronLeft className="w-3.5 h-3.5" />
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{title}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={href}>{title}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}