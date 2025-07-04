import { Skeleton } from "@/components/ui/skeleton";

export default function IncidentTableSkeleton() {
  return (
    <div className="glass-card overflow-x-auto w-full max-w-full rounded-lg bg-transparent scrollbar-thin scrollbar-thumb-rounded custom-scrollbar">
      <table className="w-full">
        <thead>
          <tr className="hover:bg-transparent border-b-white/10">
            <th><Skeleton className="h-4 w-20" /></th>
            <th className="hidden md:table-cell"><Skeleton className="h-4 w-16" /></th>
            <th><Skeleton className="h-4 w-16" /></th>
            <th><Skeleton className="h-4 w-16" /></th>
            <th className="hidden lg:table-cell"><Skeleton className="h-4 w-24" /></th>
            <th className="hidden md:table-cell"><Skeleton className="h-4 w-20" /></th>
            <th><Skeleton className="h-4 w-24" /></th>
            <th><Skeleton className="h-4 w-16" /></th>
            <th className="text-right"><Skeleton className="h-4 w-12" /></th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 6 }).map((_, i) => (
            <tr key={i} className="hover:bg-white/5 border-b-white/10 last:border-b-0">
              <td><Skeleton className="h-4 w-20" /></td>
              <td className="hidden md:table-cell"><Skeleton className="h-4 w-16" /></td>
              <td><Skeleton className="h-4 w-16" /></td>
              <td><Skeleton className="h-4 w-16" /></td>
              <td className="hidden lg:table-cell"><Skeleton className="h-4 w-24" /></td>
              <td className="hidden md:table-cell"><Skeleton className="h-4 w-20" /></td>
              <td><Skeleton className="h-4 w-24" /></td>
              <td><Skeleton className="h-4 w-16" /></td>
              <td className="text-right"><Skeleton className="h-4 w-12" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 