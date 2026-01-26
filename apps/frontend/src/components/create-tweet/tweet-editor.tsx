import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import { Smile, Image as ImageIcon, ListOrdered, Bold, Italic } from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
import { Separator } from "@repo/ui/components/ui/separator";
import clsx from "clsx";

import { useRef } from "react";

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
    className?: string;
}

const LIMIT = 280;

export function TweetEditor({ content, onChange, media, onMediaChange, className }: TweetEditorProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

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
                class: "prose dark:prose-invert focus:outline-none min-h-[150px] max-w-none text-lg placeholder:text-muted-foreground/50"
            }
        }
    });

    if (!editor) {
        return null;
    }

    const percentage = editor.storage.characterCount.characters() / LIMIT * 100;
    const charsLeft = LIMIT - editor.storage.characterCount.characters();

    return (
        <div className={clsx("flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-sm", className)}>
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
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 text-xs font-medium text-muted-foreground">
                        <span className="tabular-nums">
                            {editor.storage.characterCount.words()} words
                        </span>
                        <Separator orientation="vertical" className="h-4" />
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
                        className="rounded-full font-bold px-6"
                        disabled={editor.storage.characterCount.characters() === 0 || charsLeft < 0}
                    >
                        Post
                    </Button>
                </div>
            </div>
        </div>
    );
}
