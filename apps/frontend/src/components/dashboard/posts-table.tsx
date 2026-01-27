import * as React from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@repo/ui/components/ui/table"
import { Input } from "@repo/ui/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@repo/ui/components/ui/select"
import { useManageTweets } from "../../hooks/use-manage-tweets"
import { Badge } from "@repo/ui/components/ui/badge"
import { format } from "date-fns"
import { Search, Loader2, MoreVertical } from "lucide-react"
import { cn } from "@repo/ui/lib/utils"
import { TweetActionsMenu } from "../manage-tweets/tweet-actions-menu"
import { Button } from "@repo/ui/components/ui/button"

const statusConfig: Record<string, { label: string; className: string }> = {
    posted: { label: "Posted", className: "bg-[hsl(var(--chart-1)/0.1)] text-[hsl(var(--chart-1))] border-[hsl(var(--chart-1)/0.2)] hover:bg-[hsl(var(--chart-1)/0.2)]" },
    queued: { label: "Queued", className: "bg-[hsl(var(--chart-2)/0.1)] text-[hsl(var(--chart-2))] border-[hsl(var(--chart-2)/0.2)] hover:bg-[hsl(var(--chart-2)/0.2)]" },
    pending: { label: "Pending", className: "bg-muted text-muted-foreground border-border hover:bg-muted/80" },
    draft: { label: "Draft", className: "bg-[hsl(var(--chart-3)/0.1)] text-[hsl(var(--chart-3))] border-[hsl(var(--chart-3)/0.2)] hover:bg-[hsl(var(--chart-3)/0.2)]" },
    failed: { label: "Failed", className: "bg-[hsl(var(--chart-5)/0.1)] text-[hsl(var(--chart-5))] border-[hsl(var(--chart-5)/0.2)] hover:bg-[hsl(var(--chart-5)/0.2)]" },
    cancelled: { label: "Cancelled", className: "bg-muted text-muted-foreground border-border hover:bg-muted/80" },
}

export function PostsTable() {
    const [search, setSearch] = React.useState("")
    const [statusFilter, setStatusFilter] = React.useState<string>("all")

    const { posts, isLoading } = useManageTweets({
        search: search || undefined,
        limit: 10,
    })

    const filteredPosts = posts.filter(post =>
        statusFilter === "all" || post.status === statusFilter
    )

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search posts..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 bg-transparent border-border/40 focus:bg-background/50 transition-colors"
                    />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px] bg-transparent border-border/40">
                        <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="posted">Posted</SelectItem>
                        <SelectItem value="queued">Queued</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="rounded-xl border border-border/40 bg-card/20 backdrop-blur-md overflow-hidden shadow-sm relative z-10">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow className="border-border/40">
                            <TableHead className="w-[400px]">Content</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Scheduled For</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead className="text-right w-[100px]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Loading posts...
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : filteredPosts.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                    No posts found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredPosts.map((post) => (
                                <TableRow key={post.id} className="border-border/40 hover:bg-muted/30 transition-colors">
                                    <TableCell className="font-medium">
                                        <p className="line-clamp-2 text-sm leading-relaxed">{post.content}</p>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="outline"
                                            className={cn("capitalize font-semibold", statusConfig[post.status]?.className)}
                                        >
                                            {statusConfig[post.status]?.label || post.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                        {post.scheduledAt ? format(new Date(post.scheduledAt), "PPP p") : "Not scheduled"}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-xs font-mono">
                                        {format(new Date(post.createdAt), "MMM d, HH:mm")}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <TweetActionsMenu post={post}>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                            >
                                                <MoreVertical className="h-4 w-4" />
                                                <span className="sr-only">Open menu</span>
                                            </Button>
                                        </TweetActionsMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
