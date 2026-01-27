import { Skeleton } from "@repo/ui/components/ui/skeleton";
import { Card } from "@repo/ui/components/ui/card";

export function DashboardHomeSkeleton() {
    return (
        <div className="space-y-12 p-6 md:p-10 pb-20 max-w-[1600px] mx-auto">
            <div className="flex-1 flex flex-col gap-6 w-full">
                <div className="block">
                    <Skeleton className="h-10 w-64 mb-2" />
                    <Skeleton className="h-4 w-96 opacity-50" />
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <Card key={i} variant="borderless" className="h-44 w-full rounded-xl bg-card/20 border">
                        <div className="p-6 space-y-4">
                            <div className="flex justify-between items-center">
                                <Skeleton className="h-3 w-20" />
                                <Skeleton className="h-8 w-8 rounded-lg" />
                            </div>
                            <div className="space-y-2">
                                <Skeleton className="h-10 w-16" />
                                <Skeleton className="h-3 w-32" />
                            </div>
                            <div className="pt-4 border-t border-border/10">
                                <Skeleton className="h-3 w-24" />
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            <Card variant="borderless" className="h-[450px] w-full rounded-2xl bg-card/10 border p-6">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-64 opacity-50" />
                    </div>
                    <Skeleton className="h-[320px] w-full" />
                </div>
            </Card>

            <Card variant="borderless" className="h-[400px] w-full rounded-2xl bg-card/10 border p-6">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-4 w-64 opacity-50" />
                    </div>
                    <div className="space-y-2 pt-4">
                        {[...Array(5)].map((_, i) => (
                            <Skeleton key={i} className="h-12 w-full" />
                        ))}
                    </div>
                </div>
            </Card>
        </div>
    );
}

export function ManageTweetSkeleton() {
    return (
        <div className="h-full bg-background flex flex-col">
            {/* CalendarHeader Skeleton */}
            <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-9 w-32" />
                    <div className="flex gap-1">
                        <Skeleton className="h-9 w-10" />
                        <Skeleton className="h-9 w-10" />
                    </div>
                    <Skeleton className="h-9 w-20" />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-9 w-24" />
                    <Skeleton className="h-9 w-24" />
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden relative">
                <div className="flex-1 relative min-w-0 h-full overflow-hidden p-4">
                    <div className="grid grid-cols-7 gap-px bg-border h-full">
                        {[...Array(35)].map((_, i) => (
                            <div key={i} className="bg-background p-2">
                                <Skeleton className="h-4 w-6 mb-2" />
                                <div className="space-y-1">
                                    {i % 5 === 0 && <Skeleton className="h-12 w-full rounded" />}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Desktop Sidebar */}
                <div className="hidden md:block border-l border-border w-[350px] h-full p-4 space-y-4">
                    <Skeleton className="h-8 w-32" />
                    <div className="space-y-3">
                        {[...Array(4)].map((_, i) => (
                            <Skeleton key={i} className="h-24 w-full rounded-xl" />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export function CreateTweetSkeleton() {
    return (
        <div className="flex flex-col lg:flex-row container mx-auto p-4 lg:py-10 max-w-[100rem] pb-32">
            <div className="flex-1 flex flex-col gap-6 w-full">
                <div className="w-full justify-center sm:text-left p-2">
                    <Skeleton className="h-10 w-64 mb-2" />
                    <Skeleton className="h-4 w-96 opacity-50" />
                </div>
                <Card className="flex-1 p-6 space-y-6">
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <Skeleton className="h-4 w-32" />
                    </div>
                    <Skeleton className="h-40 w-full" />
                    <div className="flex justify-between items-center pt-4">
                        <div className="flex gap-2">
                            <Skeleton className="h-9 w-9" />
                            <Skeleton className="h-9 w-9" />
                            <Skeleton className="h-9 w-9" />
                        </div>
                        <div className="flex gap-2">
                            <Skeleton className="h-9 w-24" />
                            <Skeleton className="h-9 w-24" />
                        </div>
                    </div>
                </Card>
            </div>

            <div className="w-full lg:w-[400px] flex-shrink-0 flex items-center justify-center p-4 lg:p-10 mt-8 lg:mt-0">
                <div className="w-[300px] h-[600px] border-[12px] border-zinc-900 rounded-[3rem] p-4 relative overflow-hidden bg-card/50">
                    <div className="w-32 h-6 bg-zinc-900 absolute top-0 left-1/2 -translate-x-1/2 rounded-b-2xl" />
                    <div className="space-y-4 mt-8">
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <div className="space-y-2">
                                <Skeleton className="h-3 w-20" />
                                <Skeleton className="h-2 w-16 opacity-50" />
                            </div>
                        </div>
                        <Skeleton className="h-32 w-full rounded-xl" />
                        <div className="flex justify-between px-2">
                            <Skeleton className="h-4 w-4" />
                            <Skeleton className="h-4 w-4" />
                            <Skeleton className="h-4 w-4" />
                            <Skeleton className="h-4 w-4" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function ImportTweetSkeleton() {
    return (
        <div className="flex flex-col container mx-auto p-4 lg:py-10 max-w-[100rem] pb-32">
            <div className="flex-1 flex flex-col gap-6 w-full max-w-4xl mx-auto">
                <div className="w-full justify-center text-center sm:text-left p-2">
                    <Skeleton className="h-10 w-64 mb-2" />
                    <Skeleton className="h-4 w-96 opacity-50" />
                </div>

                <div className="flex flex-col gap-8">
                    <Card variant="borderless" className="w-full p-6">
                        <div className="space-y-8">
                            <div className="flex items-center justify-between">
                                <Skeleton className="h-10 w-[400px] rounded-lg" />
                            </div>

                            <Skeleton className="h-[300px] w-full rounded-xl border-2 border-dashed" />

                            <div className="flex justify-end">
                                <Skeleton className="h-11 w-48" />
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
