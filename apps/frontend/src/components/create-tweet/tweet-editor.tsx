import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import { Smile, Image as ImageIcon, ListOrdered, Bold, Italic } from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
import { Separator } from "@repo/ui/components/ui/separator";
import clsx from "clsx";

interface TweetEditorProps {
    content: string;
    onChange: (content: string) => void;
    className?: string;
}

const LIMIT = 280;

export function TweetEditor({ content, onChange, className }: TweetEditorProps) {
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
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-sky-500 hover:text-sky-600 hover:bg-sky-500/10" onClick={() => editor.chain().focus().toggleBold().run()}>
                        <Bold className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-sky-500 hover:text-sky-600 hover:bg-sky-500/10" onClick={() => editor.chain().focus().toggleItalic().run()}>
                        <Italic className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-sky-500 hover:text-sky-600 hover:bg-sky-500/10" onClick={() => editor.chain().focus().toggleOrderedList().run()}>
                        <ListOrdered className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-sky-500 hover:text-sky-600 hover:bg-sky-500/10">
                        <Smile className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-sky-500 hover:text-sky-600 hover:bg-sky-500/10">
                        <ImageIcon className="h-4 w-4" />
                    </Button>
                </div>

                <div className="flex items-center gap-4">
                    {/* Circular Progress (Simple Implementation) */}
                    <div className="flex items-center gap-2 text-sm">
                        <div className={clsx("h-5 w-5 rounded-full border-2 flex items-center justify-center text-[10px]", {
                            "border-sky-500 text-sky-500": percentage <= 80,
                            "border-yellow-500 text-yellow-500": percentage > 80 && percentage < 100,
                            "border-red-500 text-red-500": percentage >= 100,
                        })}>
                            {charsLeft <= 20 && charsLeft}
                        </div>
                        {charsLeft < 0 && <span className="text-red-500 font-medium whitespace-nowrap">{charsLeft}</span>}
                    </div>

                    <Button
                        className="bg-sky-500 hover:bg-sky-600 text-white rounded-full font-bold px-6"
                        disabled={editor.storage.characterCount.characters() === 0 || charsLeft < 0}
                    >
                        Post
                    </Button>
                </div>
            </div>
        </div>
    );
}
