import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent } from '@repo/ui/components/ui/card'
import { useDashboardStats } from '../../hooks/use-dashboard-stats'
import {
    Area,
    AreaChart,
    CartesianGrid,
    XAxis,
    YAxis,
} from 'recharts'
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent
} from '@repo/ui/components/ui/chart'
import {
    CheckCircle2,
    Clock,
    AlertCircle,
    Send,
    Zap,
    ArrowUpRight
} from 'lucide-react'
import { Title } from '../../components/title'
import { PostsTable } from '../../components/dashboard/posts-table'
import { DashboardHomeSkeleton } from '../../components/dashboard/skeletons'
import { apiclient } from '../../lib/api.client'

export const Route = createFileRoute('/dashboard/')({
    loader: async ({ context }) => {
        const { queryClient, auth } = context;
        if (!auth.user?.id) return;

        await queryClient.ensureQueryData({
            queryKey: ["dashboard-stats", auth.user.id],
            queryFn: async () => {
                const res = await apiclient.analytics.dashboard.$get();
                if (!res.ok) throw new Error("Failed to fetch dashboard stats");
                const data = await res.json();
                return data.data;
            },
        });
    },
    pendingComponent: DashboardHomeSkeleton,
    component: DashboardIndex,
})

function DashboardIndex() {
    const { data } = useDashboardStats();

    const stats = data?.stats || [];
    const history = data?.history || [];

    const totalPosted = stats.find(s => s.status === 'posted')?.count || 0;
    const totalPending = (stats.find(s => s.status === 'pending')?.count || 0) + (stats.find(s => s.status === 'queued')?.count || 0);
    const totalFailed = stats.find(s => s.status === 'failed')?.count || 0;
    const totalDrafts = stats.find(s => s.status === 'draft')?.count || 0;

    // Transform history for area chart
    const chartData = Object.values(history.reduce((acc: Record<string, any>, curr) => {
        if (!acc[curr.date]) {
            acc[curr.date] = { date: curr.date, posted: 0, failed: 0 };
        }
        if (curr.status === 'posted') acc[curr.date].posted = curr.count;
        if (curr.status === 'failed') acc[curr.date].failed = curr.count;
        return acc;
    }, {}));

    return (
        <div className="space-y-12 p-6 md:p-10 pb-20 max-w-[1600px] mx-auto">
            <Title
                title="Analytics Center"
                subtitle="Track your content reaching the world. Real-time insights from your scheduling pipeline."
            />

            {/* KPI Stat Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Completed"
                    value={totalPosted}
                    icon={<CheckCircle2 className="text-[hsl(var(--chart-1))]" size={24} />}
                    description="Successfully delivered"
                    trend="+12% this week"
                    colorVar="var(--chart-1)"
                />
                <StatCard
                    title="In Flight"
                    value={totalPending}
                    icon={<Clock className="text-[hsl(var(--chart-2))]" size={24} />}
                    description="Scheduled & Queued"
                    trend="Next: 2h 15m"
                    colorVar="var(--chart-2)"
                />
                <StatCard
                    title="Attention"
                    value={totalFailed}
                    icon={<AlertCircle className="text-[hsl(var(--chart-5))]" size={24} />}
                    description="Action required"
                    trend={totalFailed > 0 ? "Critical priority" : "Clear queue"}
                    colorVar="var(--chart-5)"
                />
                <StatCard
                    title="Ideation"
                    value={totalDrafts}
                    icon={<Send className="text-[hsl(var(--chart-3))]" size={24} />}
                    description="Work in progress"
                    trend="Newest: 5m ago"
                    colorVar="var(--chart-3)"
                />
            </div>

            <Card variant="borderless">
                <CardContent className="p-0">
                    <div className="flex flex-col gap-6">
                        <div>
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <Zap size={18} className="text-primary fill-primary/20" />
                                Performance History
                            </h3>
                            <p className="text-sm text-muted-foreground">Detailed view of your posting volume over time</p>
                        </div>

                        <div className="w-full">
                            <ChartContainer
                                config={{
                                    posted: { label: "Posted", color: "hsl(var(--chart-1))" },
                                    failed: { label: "Failed", color: "hsl(var(--chart-5))" }
                                }}
                                className="aspect-auto h-[400px] w-full overflow-hidden"
                            >
                                <AreaChart
                                    data={chartData}
                                    margin={{ left: 12, right: 12, top: 12, bottom: 12 }}
                                >
                                    <defs>
                                        <linearGradient id="glowPosted" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="hsl(var(--chart-1))" stopOpacity={0.2} />
                                            <stop offset="100%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="glowFailed" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="hsl(var(--chart-5))" stopOpacity={0.2} />
                                            <stop offset="100%" stopColor="hsl(var(--chart-5))" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.1} />
                                    <XAxis
                                        dataKey="date"
                                        tickLine={false}
                                        axisLine={false}
                                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                                        tickFormatter={(val) => new Date(val).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                                        dy={10}
                                    />
                                    <YAxis tickLine={false} axisLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                    <Area
                                        type="monotone"
                                        dataKey="posted"
                                        stroke="hsl(var(--chart-1))"
                                        strokeWidth={2}
                                        fillOpacity={1}
                                        fill="url(#glowPosted)"
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="failed"
                                        stroke="hsl(var(--chart-5))"
                                        strokeWidth={2}
                                        fillOpacity={1}
                                        fill="url(#glowFailed)"
                                    />
                                </AreaChart>
                            </ChartContainer>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card variant="borderless">
                <CardContent className="p-0">
                    <div className="flex flex-col gap-6">
                        <div>
                            <h3 className="text-xl font-bold">Recent Posts</h3>
                            <p className="text-sm text-muted-foreground">Manage and track your latest scheduled content</p>
                        </div>
                        <PostsTable />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

function StatCard({ title, value, icon, description, trend, colorVar }: { title: string, value: number, icon: React.ReactNode, description: string, trend: string, colorVar: string }) {
    return (
        <Card variant="borderless" className="bg-transparent transition-colors hover:bg-muted/5 group border" style={{ borderColor: `hsl(${colorVar} / 0.2)` }}>
            <div className="p-6">
                <div className="flex flex-row items-center justify-between pb-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">{title}</span>
                    <div className="p-2 bg-muted/20 rounded-lg group-hover:bg-muted/40 transition-colors" style={{ backgroundColor: `hsl(${colorVar} / 0.1)` }}>
                        {icon}
                    </div>
                </div>
                <div className="space-y-1">
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold tabular-nums tracking-tight">{value}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{description}</p>
                </div>
                <div className="mt-4 pt-4 border-t border-border/10 flex items-center justify-between">
                    <span className="text-xs font-semibold text-primary/70">{trend}</span>
                    <ArrowUpRight size={14} className="text-muted-foreground/30" />
                </div>
            </div>
        </Card>
    )
}

