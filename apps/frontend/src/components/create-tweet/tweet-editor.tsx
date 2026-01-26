import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import { Smile, Image as ImageIcon, ListOrdered, Bold, Italic, Calendar } from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
import { Separator } from "@repo/ui/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@repo/ui/components/ui/popover";
import { Calendar as CalendarUI } from "@repo/ui/components/ui/calendar";
import { format } from "date-fns";
import clsx from "clsx";

import { useRef, useState } from "react";

interface MediaAttachment {
    id: string;
    url: string;
    type: "image" | "gif" | "video";
}

interface TweetEditorProps {
    content: string;
    onChange: (content: string) => void;
    media: MediaAttachment[];
    onMediaChange: (media: MediaAttachment[]) => void;
    onPost: (isScheduled: boolean, scheduledAt?: Date) => void;
    isSubmitting?: boolean;
    className?: string;
}

const LIMIT = 280;

export function TweetEditor({ content, onChange, media, onMediaChange, onPost, isSubmitting, className }: TweetEditorProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [scheduledAt, setScheduledAt] = useState<Date | undefined>();

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files) return;

        const newMedia: MediaAttachment[] = [];

        Array.from(files).forEach((file) => {
            const url = URL.createObjectURL(file);
            const type = file.type.startsWith("video") ? "video" : "image";
            newMedia.push({
                id: Math.random().toString(36).substring(7),
                url,
                type
            });
        });

        // Simple concat for now, we can enforce limits later
        onMediaChange([...media, ...newMedia]);

        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const triggerFileSelect = () => {
        fileInputRef.current?.click();
    };

    const editor = useEditor({
        extensions: [
            StarterKit,
            Placeholder.configure({
                placeholder: "What's happening?",
                emptyEditorClass: "is-editor-empty before:text-muted-foreground/50 before:content-[attr(data-placeholder)] before:float-left before:pointer-events-none before:h-0",
            }),
            CharacterCount.configure({
                limit: LIMIT,
            }),
        ],
        content,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: "prose dark:prose-invert focus:outline-none min-h-[200px] md:min-h-[150px] max-w-none text-base md:text-lg placeholder:text-muted-foreground/50"
            }
        }
    });

    if (!editor) {
        return null;
    }

    const percentage = editor.storage.characterCount.characters() / LIMIT * 100;
    const charsLeft = LIMIT - editor.storage.characterCount.characters();

    return (
        <div className={clsx("flex flex-col gap-3 md:gap-4 rounded-xl border bg-card p-3 md:p-4 shadow-sm", className)}>
            <div className="flex-1">
                <EditorContent editor={editor} />
            </div>

            <Separator />

            {/* Toolbar */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-primary">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-muted" onClick={() => editor.chain().focus().toggleBold().run()}>
                        <Bold className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-muted" onClick={() => editor.chain().focus().toggleItalic().run()}>
                        <Italic className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-muted" onClick={() => editor.chain().focus().toggleOrderedList().run()}>
                        <ListOrdered className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-muted">
                        <Smile className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-muted"
                        onClick={triggerFileSelect}
                    >
                        <ImageIcon className="h-4 w-4" />
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*,video/*"
                            multiple
                            onChange={handleFileSelect}
                        />
                    </Button>

                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className={clsx("h-8 w-8 hover:text-primary hover:bg-muted", {
                                    "text-primary bg-muted": !!scheduledAt,
                                    "text-muted-foreground": !scheduledAt
                                })}
                            >
                                <Calendar className="h-4 w-4" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <CalendarUI
                                mode="single"
                                selected={scheduledAt}
                                onSelect={(date) => {
                                    if (date) {
                                        const newDate = new Date(date);
                                        if (scheduledAt) {
                                            newDate.setHours(scheduledAt.getHours());
                                            newDate.setMinutes(scheduledAt.getMinutes());
                                        } else {
                                            // Default to next hour if nothing set
                                            const nextHour = new Date();
                                            nextHour.setHours(nextHour.getHours() + 1);
                                            newDate.setHours(nextHour.getHours());
                                            newDate.setMinutes(0);
                                        }
                                        setScheduledAt(newDate);
                                    }
                                }}
                                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                initialFocus
                            />
                            {scheduledAt && (
                                <div className="p-3 border-t border-border flex flex-col gap-3">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] uppercase font-bold text-muted-foreground px-1">
                                            Time
                                        </label>
                                        <input
                                            type="time"
                                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                            value={format(scheduledAt, "HH:mm")}
                                            onChange={(e) => {
                                                const [hours, minutes] = e.target.value.split(":").map(Number);
                                                const newDate = new Date(scheduledAt);
                                                newDate.setHours(hours);
                                                newDate.setMinutes(minutes);
                                                setScheduledAt(newDate);
                                            }}
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground px-1">
                                        Scheduling for: <span className="font-medium text-foreground">{format(scheduledAt, "PPP 'at' HH:mm")}</span>
                                    </p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full text-xs h-7"
                                        onClick={() => setScheduledAt(undefined)}
                                    >
                                        Clear Schedule
                                    </Button>
                                </div>
                            )}
                        </PopoverContent>
                    </Popover>
                </div>

                <div className="flex items-center gap-2 md:gap-4">
                    <div className="flex items-center gap-2 md:gap-3 text-[10px] md:text-xs font-medium text-muted-foreground">
                        <span className="tabular-nums hidden xs:inline">
                            {editor.storage.characterCount.words()} words
                        </span>
                        <Separator orientation="vertical" className="h-4 hidden xs:block" />
                        <span className={clsx("tabular-nums", {
                            "text-destructive": charsLeft < 0,
                            "text-muted-foreground": charsLeft >= 0
                        })}>
                            {editor.storage.characterCount.characters()} / {LIMIT}
                        </span>
                    </div>

                    {/* Circular Progress SVG */}
                    <div className="relative h-6 w-6 flex items-center justify-center">
                        <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 36 36">
                            {/* Background Circle */}
                            <path
                                className="text-muted/30"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="4"
                            />
                            {/* Progress Circle */}
                            <path
                                className={clsx("transition-all duration-300 ease-out", {
                                    "text-primary": percentage <= 80,
                                    "text-yellow-500": percentage > 80 && percentage <= 100,
                                    "text-destructive": percentage > 100
                                })}
                                strokeDasharray={`${Math.min(percentage, 100)}, 100`}
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="4"
                            />
                        </svg>
                        {/* Text for warning/error states inside or near bubble */}
                        {charsLeft <= 20 && (
                            <span className={clsx("absolute text-[10px] font-bold tabular-nums", {
                                "text-destructive": charsLeft <= 0,
                                "text-yellow-500": charsLeft > 0
                            })}>
                                {charsLeft}
                            </span>
                        )}
                    </div>

                    <Button
                        className="rounded-full font-bold px-4 md:px-6 h-8 md:h-10 text-sm md:text-base"
                        disabled={editor.storage.characterCount.characters() === 0 || charsLeft < 0 || isSubmitting}
                        onClick={() => onPost(!!scheduledAt, scheduledAt)}
                    >
                        {isSubmitting ? "Creating..." : (scheduledAt ? "Schedule" : "Draft")}
                    </Button>
                </div>
            </div>
        </div>
    );
}
