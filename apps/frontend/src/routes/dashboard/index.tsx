import { createFileRoute } from '@tanstack/react-router'
import { Button } from '@repo/ui/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@repo/ui/components/ui/card'
import { Plus } from 'lucide-react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@repo/ui/components/ui/table"
import { Badge } from "@repo/ui/components/ui/badge"
import { CreatePostDialog } from "../../components/posts/create-post-dialog"

export const Route = createFileRoute('/dashboard/')({
    component: DashboardIndex,
})

function DashboardIndex() {

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Scheduled Posts</h2>
                    <p className="text-muted-foreground">Manage your upcoming content queue.</p>
                </div>
                <CreatePostDialog>
                    <Button className="gap-2 shadow-lg shadow-blue-500/20">
                        <Plus size={16} />
                        Create Post
                    </Button>
                </CreatePostDialog>
            </div>

            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle>Queue</CardTitle>
                    <CardDescription>
                        View and manage your scheduled tweets.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50%]">Content</TableHead>
                                <TableHead>Scheduled For</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow>
                                <TableCell className="font-medium">
                                    <div className="truncate max-w-[400px]">
                                        🚀 Just shipped the new bulk scheduler feature! It's going to be a game changer for content creators. #buildinginpublic
                                    </div>
                                </TableCell>
                                <TableCell>Tomorrow at 10:00 AM</TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Scheduled</Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="sm">Edit</Button>
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium">
                                    <div className="truncate max-w-[400px]">
                                        Working on the frontend integration now using Shadcn UI. It looks so clean! ✨
                                    </div>
                                </TableCell>
                                <TableCell>Oct 26, 2026 - 2:00 PM</TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">Draft</Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="sm">Edit</Button>
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
