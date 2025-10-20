import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const DashboardSkeleton = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8 sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50 -mx-4 px-4 py-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-10 w-28" />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-8">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="glass-card p-6">
              <div className="flex items-center gap-4">
                <Skeleton className="h-16 w-16 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2 mb-8">
          {[1, 2].map((i) => (
            <Card key={i} className="glass-card p-8">
              <div className="space-y-4">
                <Skeleton className="h-20 w-20 mx-auto rounded-2xl" />
                <Skeleton className="h-8 w-48 mx-auto" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
