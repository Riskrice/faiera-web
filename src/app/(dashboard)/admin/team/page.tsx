"use client";

import React, { useState } from 'react';
import { Search, Plus, ShieldCheck, Users, Mail, Phone, Calendar, MoreVertical, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function TeamManagementPage() {
  const [searchTerm, setSearchTerm] = useState('');

  // Dummy team - To be replaced by actual API data fetched via getAdmins()
  const team = [
    { id: '1', name: 'أحمد أشرف', role: 'مدير النظام (Super Admin)', email: 'ahmed@faiera.com', phone: '+20 100 000 0000', status: 'نشط', joinedAt: '2023-01-15' },
    { id: '2', name: 'سارة محمود', role: 'محرر محتوى (Content Editor)', email: 'sarah@faiera.com', phone: '+20 111 111 1111', status: 'نشط', joinedAt: '2023-03-22' },
    { id: '3', name: 'عمر خالد', role: 'مراجع مالي (Finance)', email: 'omar@faiera.com', phone: '+20 122 222 2222', status: 'غير نشط', joinedAt: '2023-06-10' },
  ];

  const filteredTeam = team.filter(member => 
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 md:p-10 space-y-8 max-w-7xl mx-auto font-cairo" dir="rtl">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/50 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">إدارة فريق العمل</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            نظام متكامل لإدارة المشرفين، الموظفين، والمستخدمين ذوي الصلاحيات الخاصة.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="hidden sm:flex border-border/50 shadow-sm">
            <Settings className="w-4 h-4 ml-2" />
            إعدادات الرتب
          </Button>
          <Button className="shadow-md">
            <Plus className="w-4 h-4 ml-2" />
            إضافة مشرف جديد
          </Button>
        </div>
      </div>

      {/* Quick Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 flex items-center gap-4 bg-primary/5 border-primary/20 shadow-sm">
          <div className="p-3 bg-primary/10 rounded-xl">
            <Users className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-muted-foreground">إجمالي المشرفين</p>
            <h3 className="text-2xl font-bold mt-1">12</h3>
          </div>
        </Card>
        
        <Card className="p-6 flex items-center gap-4 border-border/50 shadow-sm hover:border-primary/30 transition-colors">
          <div className="p-3 bg-green-500/10 rounded-xl">
            <ShieldCheck className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-muted-foreground">الرتب الفعالة</p>
            <h3 className="text-2xl font-bold mt-1">8</h3>
          </div>
        </Card>

        <Card className="p-6 flex items-center gap-4 border-border/50 shadow-sm hover:border-primary/30 transition-colors">
          <div className="p-3 bg-orange-500/10 rounded-xl">
             <Info className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-muted-foreground">تحت المراجعة</p>
            <h3 className="text-2xl font-bold mt-1">2</h3>
          </div>
        </Card>
      </div>

      {/* Directory Section */}
      <Card className="border-border/50 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border/50 bg-muted/20 flex flex-col sm:flex-row justify-between items-center gap-4">
          <h2 className="text-lg font-bold">دليل المشرفين والموظفين</h2>
          <div className="relative w-full sm:w-72">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="ابحث بالاسم، البريد أو الرتبة..." 
              className="pr-10 bg-background h-10 border-border/50 font-cairo"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm whitespace-nowrap">
            <thead className="bg-muted/40 text-muted-foreground">
              <tr>
                <th className="px-6 py-4 font-bold border-b border-border/50">المشرف / الموظف</th>
                <th className="px-6 py-4 font-bold border-b border-border/50">الرتبة التوظيفية</th>
                <th className="px-6 py-4 font-bold border-b border-border/50">بيانات الاتصال</th>
                <th className="px-6 py-4 font-bold border-b border-border/50">حالة الحساب</th>
                <th className="px-6 py-4 font-bold border-b border-border/50 text-left">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filteredTeam.length === 0 ? (
                <tr>
                   <td colSpan={5} className="text-center py-10 text-muted-foreground">لا يوجد مشرفين يتطابقون مع بحثك.</td>
                </tr>
              ) : filteredTeam.map((member) => (
                <tr key={member.id} className="hover:bg-muted/20 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shadow-sm border border-primary/20">
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-bold text-base">{member.name}</p>
                        <p className="text-xs text-muted-foreground flex items-center mt-1">
                          <Calendar className="w-3 h-3 ml-1" />
                          انضم في {member.joinedAt}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-primary/70" />
                      <span className="font-semibold text-primary/80">{member.role}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Mail className="w-3 h-3 ml-2 shrink-0" />
                        <span className="truncate max-w-[150px]" title={member.email}>{member.email}</span>
                      </div>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Phone className="w-3 h-3 ml-2 shrink-0" />
                        {member.phone}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={member.status === 'نشط' ? 'default' : 'secondary'} className={
                      member.status === 'نشط' 
                        ? 'bg-green-500/15 text-green-700 hover:bg-green-500/25 border-green-500/20 shadow-none' 
                        : 'bg-muted text-muted-foreground'
                    }>
                      {member.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-left">
                    <DropdownMenu dir="rtl">
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="sr-only">فتح القائمة</span>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="font-cairo w-48 shadow-lg border-border/50">
                        <DropdownMenuLabel className="text-muted-foreground text-xs font-bold">إدارة المشرف</DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-border/50" />
                        <DropdownMenuItem className="cursor-pointer font-bold focus:bg-primary/10 focus:text-primary">
                          تعديل الصلاحيات والمسمى
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer">
                          عرض سجل النشاطات
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-border/50" />
                        <DropdownMenuItem className="text-destructive focus:bg-destructive/10 cursor-pointer font-bold flex justify-between">
                          إيقاف الحساب
                          <Settings className="w-3 h-3" />
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      
    </div>
  );
}

// Missing icon fallback for TeamManagement
function Info(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
}
