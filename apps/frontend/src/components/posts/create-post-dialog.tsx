import { useState } from "react"
import { Button } from "@repo/ui/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@repo/ui/components/ui/dialog"
import { Textarea } from "@repo/ui/components/ui/textarea"
import { Label } from "@repo/ui/components/ui/label"
import { Calendar } from "@repo/ui/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@repo/ui/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select"
import { cn } from "@repo/ui/lib/utils"
import { format } from "date-fns"
import { CalendarIcon, Loader2 } from "lucide-react"

export function CreatePostDialog({ children }: { children: React.ReactNode }) {
    const [content, setContent] = useState("")
    const [date, setDate] = useState<Date>()
    const [time, setTime] = useState<string>("10:00")
    const [isLoading, setIsLoading] = useState(false)
    const [open, setOpen] = useState(false)

    const charCount = content.length
    const isOverLimit = charCount > 280

    const handleSubmit = async () => {
        if (!date) return
        setIsLoading(true)

        // Combine date and time
        const [hours, minutes] = time.split(':').map(Number)
        const scheduledAt = new Date(date)
        scheduledAt.setHours(hours, minutes)

        try {
            // TODO: Call API
            console.log("Scheduling for:", scheduledAt, "Content:", content)
            // Simulate delay
            await new Promise(resolve => setTimeout(resolve, 1000))
            setOpen(false)
            setContent("")
            setDate(undefined)
        } catch (error) {
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    // Generate time slots (every 30 mins)
    const timeSlots = []
    for (let i = 0; i < 24; i++) {
        for (let j = 0; j < 60; j += 30) {
            const h = i.toString().padStart(2, '0')
            const m = j.toString().padStart(2, '0')
            timeSlots.push(`${h}:${m}`)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Schedule Post</DialogTitle>
                    <DialogDescription>
                        Draft your tweet and schedule it for later.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="content">Content</Label>
                        <Textarea
                            id="content"
                            placeholder="What's happening?"
                            className="min-h-[120px] resize-none"
                            value={content}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)}
                        />
                        <div className="flex justify-end">
                            <span className={cn("text-xs", isOverLimit ? "text-red-500 font-medium" : "text-muted-foreground")}>
                                {charCount}/280
                            </span>
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label>Schedule Date & Time</Label>
                        <div className="flex gap-2">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !date && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {date ? format(date, "PPP") : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={date}
                                        onSelect={setDate}
                                        initialFocus
                                        disabled={(date: Date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                    />
                                </PopoverContent>
                            </Popover>

                            <Select value={time} onValueChange={setTime}>
                                <SelectTrigger className="w-[120px]">
                                    <SelectValue placeholder="Time" />
                                </SelectTrigger>
                                <SelectContent>
                                    {timeSlots.map(t => (
                                        <SelectItem key={t} value={t}>{t}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleSubmit} disabled={isLoading || isOverLimit || !content || !date}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Schedule
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
