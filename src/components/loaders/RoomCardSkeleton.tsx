import { Skeleton } from "@/components/ui/skeleton";

export default function RoomCardSkeleton() {
  return (
    <div className="space-y-3 rounded-xl border p-4">
      <Skeleton className="h-[220px] w-full rounded-xl" />
      <Skeleton className="h-5 w-[250px]" />
      <Skeleton className="h-4 w-[180px]" />
      <Skeleton className="h-10 w-full rounded-xl" />
    </div>
  );
}
