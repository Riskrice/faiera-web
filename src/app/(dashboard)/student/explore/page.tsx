"use client"

import { Suspense } from 'react'
import { ExploreContent } from '@/app/explore/page'
import { Loader2 } from 'lucide-react'

export default function StudentExplorePage() {
    return (
        <div className="flex flex-col space-y-6">
            <div className="mb-6 space-y-4">
                <h1 className="text-3xl font-bold font-cairo tracking-tight text-foreground">
                    استكشف كل الكورسات
                </h1>
                <p className="text-muted-foreground text-sm font-cairo">
                    اكتشف أحدث الكورسات والمسارات التعليمية المتاحة على المنصة 
                </p>
            </div>
            
            <div className="bg-card border border-border rounded-xl md:p-6 overflow-hidden">
                <Suspense fallback={
                    <div className="flex h-64 items-center justify-center">     
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                }>
                    <ExploreContent isDashboard={true} />
                </Suspense>
            </div>
        </div>
    )
}
