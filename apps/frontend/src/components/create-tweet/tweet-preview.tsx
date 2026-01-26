import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/components/ui/avatar";
import { MessageCircle, Repeat2, Heart, Share, MoreHorizontal } from "lucide-react";
import clsx from "clsx";

interface MediaAttachment {
    id: string;
    url: string;
    type: "image" | "gif" | "video";
}

interface TweetPreviewProps {
    content: string; // HTML content from Tiptap
    media?: MediaAttachment[];
    authorName?: string;
    authorHandle?: string;
    authorAvatar?: string;
}

export function TweetPreview({
    content,
    media = [],
    authorName = "User Name",
    authorHandle = "handle",
    authorAvatar,
}: TweetPreviewProps) {
    // Simple HTML parsing to remove wrapping paragraphs if needed, or render as is
    // Tiptap outputs <p>text</p>. Twitter renders text directly but handling blocks is fine.

    return (
        <div className="w-full bg-background p-4 font-sans text-foreground">
            {/* Header */}
            <div className="flex gap-3">
                <Avatar className="h-10 w-10 border border-border">
                    <AvatarImage src={authorAvatar} alt={authorName} />
                    <AvatarFallback>{authorName.charAt(0)}</AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 truncate">
                            <span className="font-bold text-[15px] truncate text-foreground">{authorName}</span>
                            <span className="text-[15px] text-muted-foreground truncate">@{authorHandle}</span>
                            <span className="text-[15px] text-muted-foreground">·</span>
                            <span className="text-[15px] text-muted-foreground">1m</span>
                        </div>
                        <button className="text-muted-foreground hover:text-foreground transition-colors">
                            <MoreHorizontal className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Tweet Content */}
                    <div
                        className="mt-1 text-[15px] leading-normal whitespace-pre-wrap break-words prose dark:prose-invert max-w-none text-foreground"
                        // Using dangerouslySetInnerHTML because we get HTML from Tiptap.
                        // In a real app we might want to sanitize this, but Tiptap is generally safe with standard extensions.
                        dangerouslySetInnerHTML={{ __html: content || "<span class='text-muted-foreground'>What's happening?</span>" }}
                    />

                    {/* Media Grid */}
                    {media.length > 0 && (
                        <div className={clsx("mt-3 grid gap-0.5 overflow-hidden rounded-2xl border border-border", {
                            "grid-cols-1": media.length === 1,
                            "grid-cols-2": media.length > 1,
                            "aspect-[16/9]": media.length === 1,
                            "aspect-[16/10]": media.length > 1
                        })}>
                            {media.slice(0, 4).map((m) => (
                                <div key={m.id} className="relative h-full w-full bg-muted">
                                    {m.type === 'image' && (
                                        <img src={m.url} alt="attachment" className="h-full w-full object-cover" />
                                    )}
                                    {/* Add video/gif handling if needed */}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Interaction Bar */}
                    <div className="mt-3 flex max-w-[425px] justify-between text-muted-foreground">
                        <button className="group flex items-center gap-2 hover:text-sky-500 transition-colors">
                            <div className="rounded-full p-2 group-hover:bg-sky-500/10">
                                <MessageCircle className="h-4 w-4" />
                            </div>
                            <span className="text-xs">0</span>
                        </button>
                        <button className="group flex items-center gap-2 hover:text-green-500 transition-colors">
                            <div className="rounded-full p-2 group-hover:bg-green-500/10">
                                <Repeat2 className="h-4 w-4" />
                            </div>
                            <span className="text-xs">0</span>
                        </button>
                        <button className="group flex items-center gap-2 hover:text-pink-500 transition-colors">
                            <div className="rounded-full p-2 group-hover:bg-pink-500/10">
                                <Heart className="h-4 w-4" />
                            </div>
                            <span className="text-xs">0</span>
                        </button>
                        <button className="group flex items-center gap-2 hover:text-sky-500 transition-colors">
                            <div className="rounded-full p-2 group-hover:bg-sky-500/10">
                                <Share className="h-4 w-4" />
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
