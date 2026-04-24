import { Card, CardHeader, CardFooter, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchX, FolderOpen, UserX, CalendarX, PackageOpen } from "lucide-react";
import { ReactNode } from "react";

export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="rounded-md border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            {Array.from({ length: columns }).map((_, i) => (
              <TableHead key={i}><Skeleton className="h-4 w-20" /></TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <TableRow key={rowIndex}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <TableCell key={colIndex}>
                  <Skeleton className="h-4 w-full" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function ContentEmptyState({
  type = "default",
  title,
  description,
  action,
}: {
  type?: "default" | "search" | "courses" | "students" | "sessions";
  title?: string;
  description?: string;
  action?: ReactNode;
}) {
  const iconMap = {
    default: PackageOpen,
    search: SearchX,
    courses: FolderOpen,
    students: UserX,
    sessions: CalendarX,
  };

  const Icon = iconMap[type];

  return (
    <Card className="w-full text-center p-8 bg-muted/20 border-dashed">
      <CardContent className="flex flex-col items-center justify-center p-6 sm:p-10">
        <EmptyState
          icon={Icon}
          title={title || "لا توجد بيانات"}
          description={description || "لم يتم العثور على أي سجلات لعرضها هنا. البيانات التي ستنشئها ستظهر في هذه الصفحة."}
          action={action}
        />
      </CardContent>
    </Card>
  );
}