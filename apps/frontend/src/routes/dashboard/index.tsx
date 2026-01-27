import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@repo/ui/components/ui/card'
import { useDashboardStats } from '../../hooks/use-dashboard-stats'
import {
    Area,
    AreaChart,
    ResponsiveContainer,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar
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
    TrendingUp,
    Calendar
} from 'lucide-react'
import { Skeleton } from '@repo/ui/components/ui/skeleton'

export const Route = createFileRoute('/dashboard/')({
    component: DashboardIndex,
})

const STATUS_COLORS: Record<string, string> = {
    posted: "hsl(var(--chart-1))",
    queued: "hsl(var(--chart-2))",
    pending: "hsl(var(--chart-3))",
    draft: "hsl(var(--chart-4))",
    failed: "hsl(var(--chart-5))",
};

const STATUS_LABELS: Record<string, string> = {
    posted: "Posted",
    queued: "Queued",
    pending: "Pending",
    draft: "Draft",
    failed: "Failed",
};

function DashboardIndex() {
    const { data, isLoading } = useDashboardStats();

    if (isLoading) {
        return <DashboardSkeleton />;
    }

    const stats = data?.stats || [];
    const history = data?.history || [];
    const distribution = data?.distribution || [];

    const totalPosted = stats.find(s => s.status === 'posted')?.count || 0;
    const totalPending = (stats.find(s => s.status === 'pending')?.count || 0) + (stats.find(s => s.status === 'queued')?.count || 0);
    const totalFailed = stats.find(s => s.status === 'failed')?.count || 0;
    const totalDrafts = stats.find(s => s.status === 'draft')?.count || 0;

    // Transform history for area chart
    const chartData = Object.values(history.reduce((acc: any, curr) => {
        if (!acc[curr.date]) {
            acc[curr.date] = { date: curr.date, posted: 0, failed: 0 };
        }
        if (curr.status === 'posted') acc[curr.date].posted = curr.count;
        if (curr.status === 'failed') acc[curr.date].failed = curr.count;
        return acc;
    }, {}));

    // Transform distribution for heatmap (showing as a bar chart for now due to complexity of actual heatmap in rechart but with a grid-like feel)
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const distributionData = distribution.reduce((acc: any[], curr) => {
        const item = acc.find(a => a.day === dayLabels[curr.dayOfWeek]);
        if (item) {
            item.count += curr.count;
        } else {
            acc.push({ day: dayLabels[curr.dayOfWeek], count: curr.count });
        }
        return acc;
    }, []).sort((a, b) => dayLabels.indexOf(a.day) - dayLabels.indexOf(b.day));

    return (
        <div className="space-y-8 p-1">
            <div className="flex flex-col gap-2">
                <h2 className="text-3xl font-bold tracking-tight text-foreground/90">Dashboard</h2>
                <p className="text-muted-foreground">Real-time overview of your Twitter scheduling performance.</p>
            </div>

            {/* KPI Stat Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total Posted"
                    value={totalPosted}
                    icon={<CheckCircle2 className="text-emerald-500" size={20} />}
                    description="Successfully delivered tweets"
                />
                <StatCard
                    title="In Queue"
                    value={totalPending}
                    icon={<Clock className="text-blue-500" size={20} />}
                    description="Scheduled for future"
                />
                <StatCard
                    title="Failed Tasks"
                    value={totalFailed}
                    icon={<AlertCircle className={`text-rose-500 ${totalFailed > 0 ? 'animate-pulse' : ''}`} size={20} />}
                    description="Action required"
                />
                <StatCard
                    title="Drafts"
                    value={totalDrafts}
                    icon={<Send className="text-amber-500" size={20} />}
                    description="Work in progress"
                />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Activity Volume Area Chart */}
                <Card className="lg:col-span-4 border-border/50 bg-card/30 backdrop-blur-md shadow-xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp size={18} className="text-primary" />
                            Activity Volume
                        </CardTitle>
                        <CardDescription>Daily posting and failure trends</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px] pl-2">
                        <ChartContainer config={{
                            posted: { label: "Posted", color: "hsl(var(--chart-1))" },
                            failed: { label: "Failed", color: "hsl(var(--chart-5))" }
                        }}>
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorPosted" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="hsl(var(--chart-5))" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="hsl(var(--chart-5))" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                                <XAxis
                                    dataKey="date"
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(val) => new Date(val).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                                />
                                <YAxis tickLine={false} axisLine={false} />
                                <Tooltip content={<ChartTooltipContent />} />
                                <Area
                                    type="monotone"
                                    dataKey="posted"
                                    stroke="hsl(var(--chart-1))"
                                    fillOpacity={1}
                                    fill="url(#colorPosted)"
                                    strokeWidth={2}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="failed"
                                    stroke="hsl(var(--chart-5))"
                                    fillOpacity={1}
                                    fill="url(#colorFailed)"
                                    strokeWidth={2}
                                />
                            </AreaChart>
                        </ChartContainer>
                    </CardContent>
                </Card>

                {/* Status Breakthrough Donut */}
                <Card className="lg:col-span-3 border-border/50 bg-card/30 backdrop-blur-md shadow-xl">
                    <CardHeader>
                        <CardTitle>Content Breakdown</CardTitle>
                        <CardDescription>Distribution across all statuses</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px] flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats}
                                    dataKey="count"
                                    nameKey="status"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={90}
                                    paddingAngle={5}
                                >
                                    {stats.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status] || "hsl(var(--muted))"} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            const status = payload[0].name;
                                            return (
                                                <div className="bg-background border border-border px-3 py-2 rounded-lg shadow-lg">
                                                    <p className="font-bold" style={{ color: STATUS_COLORS[status] }}>
                                                        {STATUS_LABELS[status]}
                                                    </p>
                                                    <p className="text-sm font-mono text-muted-foreground">{payload[0].value} tweets</p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-x-0 bottom-6 flex justify-center gap-4 flex-wrap px-4">
                            {stats.map((s) => (
                                <div key={s.status} className="flex items-center gap-1.5 text-xs">
                                    <div className="h-2 w-2 rounded-full" style={{ background: STATUS_COLORS[s.status] }} />
                                    <span className="text-muted-foreground capitalize">{s.status}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Posting Distribution Bar Chart */}
                <Card className="lg:col-span-7 border-border/50 bg-card/30 backdrop-blur-md shadow-xl">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar size={18} className="text-primary" />
                                Weekly Distribution
                            </CardTitle>
                            <CardDescription>Frequency of posts across the week</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="h-[250px] pt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={distributionData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.3} />
                                <XAxis dataKey="day" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} />
                                <Tooltip
                                    cursor={{ fill: 'hsl(var(--muted)/0.5)' }}
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="bg-background border border-border px-3 py-2 rounded-lg shadow-lg">
                                                    <p className="font-bold text-primary">{payload[0].payload.day}</p>
                                                    <p className="text-sm font-mono text-muted-foreground">{payload[0].value} scheduled posts</p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Bar
                                    dataKey="count"
                                    fill="hsl(var(--primary))"
                                    radius={[4, 4, 0, 0]}
                                    barSize={40}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

function StatCard({ title, value, icon, description }: { title: string, value: number, icon: React.ReactNode, description: string }) {
    return (
        <Card className="border-border/50 bg-card/30 backdrop-blur-md shadow-lg transition-all hover:bg-card/40">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                {icon}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold tabular-nums">{value}</div>
                <p className="text-xs text-muted-foreground mt-1">{description}</p>
            </CardContent>
        </Card>
    )
}

function DashboardSkeleton() {
    return (
        <div className="space-y-8 p-1">
            <div className="space-y-2">
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-4 w-64" />
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-32 w-full" />
                ))}
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Skeleton className="lg:col-span-4 h-[400px] w-full" />
                <Skeleton className="lg:col-span-3 h-[400px] w-full" />
                <Skeleton className="lg:col-span-7 h-[300px] w-full" />
            </div>
        </div>
    );
}

