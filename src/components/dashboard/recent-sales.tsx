import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface RecentSale {
    id: string
    studentName: string
    studentEmail: string
    amount: number
    currency: string
    date: string
    avatarUrl?: string
}

interface RecentSalesProps {
    data?: RecentSale[]
}

export function RecentSales({ data = [] }: RecentSalesProps) {
    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
                لا توجد مبيعات حتى الآن
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {data.map((sale) => (
                <div key={sale.id} className="flex items-center">
                    <Avatar className="h-9 w-9">
                        <AvatarImage
                            src={sale.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${sale.studentEmail}`}
                            alt={sale.studentName}
                        />
                        <AvatarFallback>{sale.studentName.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="mr-4 space-y-1 text-right">
                        <p className="text-sm font-medium leading-none font-cairo">{sale.studentName}</p>
                        <p className="text-xs text-muted-foreground font-sans">
                            {sale.studentEmail}
                        </p>
                    </div>
                    <div className="mr-auto font-medium text-emerald-500 font-sans">
                        +{sale.amount.toFixed(2)} {sale.currency}
                    </div>
                </div>
            ))}
        </div>
    );
}
