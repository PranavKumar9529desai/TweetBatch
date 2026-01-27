import { Skeleton } from "@repo/ui/components/ui/skeleton";

export function LandingSkeleton() {
    return (
        <div className='h-screen flex flex-col items-center justify-center gap-4'>
            <Skeleton className="h-12 w-64 mb-4" /> {/* Title Skeleton */}
            <div className="flex flex-col items-center gap-2 mb-8">
                <Skeleton className="h-4 w-80" /> {/* Description Line 1 */}
                <Skeleton className="h-4 w-48" /> {/* Description Line 2 */}
            </div>
            <div className="w-full max-w-sm">
                <Skeleton className="h-[56px] w-full rounded-md" /> {/* Button Skeleton */}
            </div>
        </div>
    );
}
