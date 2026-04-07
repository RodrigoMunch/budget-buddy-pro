import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export const DashboardSkeleton = () => (
  <div className="max-w-6xl mx-auto space-y-6">
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-32" />
      </div>
      <Skeleton className="h-10 w-36 hidden sm:block" />
    </div>
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i}><CardContent className="p-5 space-y-3"><Skeleton className="h-4 w-20" /><Skeleton className="h-7 w-28" /></CardContent></Card>
      ))}
    </div>
    <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
      {[...Array(2)].map((_, i) => (
        <Card key={i}><CardHeader><Skeleton className="h-5 w-40" /></CardHeader><CardContent><Skeleton className="h-[250px] w-full" /></CardContent></Card>
      ))}
    </div>
    <Card>
      <CardHeader><Skeleton className="h-5 w-40" /></CardHeader>
      <CardContent className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </CardContent>
    </Card>
  </div>
);

export const ListSkeleton = ({ cards = 5 }: { cards?: number }) => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
    </div>
    <div className="space-y-3">
      {[...Array(cards)].map((_, i) => (
        <Skeleton key={i} className="h-16 w-full rounded-lg" />
      ))}
    </div>
  </div>
);

export const CardsSkeleton = ({ count = 4 }: { count?: number }) => (
  <div className="grid gap-4 md:grid-cols-2">
    {[...Array(count)].map((_, i) => (
      <Card key={i}>
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton className="w-12 h-12 rounded-xl" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);
