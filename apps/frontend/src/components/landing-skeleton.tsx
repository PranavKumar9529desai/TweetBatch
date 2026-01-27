import { Skeleton } from "@repo/ui/components/ui/skeleton";

export function LandingSkeleton() {
    return (
        <div className='h-screen flex flex-col items-center justify-center gap-4'>
            <div className="w-full max-w-sm">
                <Skeleton className="h-[56px] w-full rounded-md" /> {/* Button Skeleton */}
            </div>
        </div>
    );
}
