import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { TweetEditor } from "@/components/create-tweet/tweet-editor";
import { TweetPreview } from "@/components/create-tweet/tweet-preview";
import { MobileFrame } from "@/components/create-tweet/mobile-frame";

export const Route = createFileRoute("/dashboard/create-tweet")({
  component: CreateTweetPage,
});

function CreateTweetPage() {
  const [content, setContent] = useState("");

  return (
    <div className="flex h-full w-full gap-6 p-6">
      {/* Left Column: Editor */}
      <div className="flex-1 flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Tweet</h1>
          <p className="text-muted-foreground">Draft and schedule your tweets.</p>
        </div>

        <TweetEditor
          content={content}
          onChange={setContent}
          className="flex-1 min-h-[400px]"
        />
      </div>

      {/* Right Column: Mobile Preview */}
      <div className="w-[400px] flex-shrink-0 flex items-center justify-center bg-gray-50/50 dark:bg-gray-900/50 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800 p-8 hidden xl:flex">
        <div className="scale-[0.85] origin-center -my-20">
          <MobileFrame>
            <div className="min-h-full bg-white dark:bg-black pt-10"> {/* Add top padding for status bar */}
              <TweetPreview
                content={content}
                authorHandle="pranav"
                authorName="Pranav"
              />
            </div>
          </MobileFrame>
          <p className="text-center mt-6 text-sm text-gray-400 font-medium">Mobile Live Preview</p>
        </div>
      </div>
    </div>
  );
}
