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
  const [media, setMedia] = useState<
    Array<{ id: string; url: string; type: "image" | "gif" | "video" }>
  >([]);

  return (
    <div className="flex container mx-auto py-10 max-w-[100rem]">
      {/* Left Column: Editor */}
      <div className="flex-1 flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Tweet</h1>
          <p className="text-muted-foreground">Draft and schedule your tweets.</p>
        </div>

        <TweetEditor
          content={content}
          onChange={setContent}
          media={media}
          onMediaChange={setMedia}
          className="flex-1 min-h-[400px]"
        />
      </div>

      {/* Right Column: Mobile Preview */}
      <div className="w-[400px] flex-shrink-0 flex items-center justify-center rounded-3xl  p-10 gap-12 hidden xl:flex">
        <div className="scale-[0.85] origin-center -my-20">
          <MobileFrame>
            <div className="min-h-full "> {/* Add top padding for status bar */}
              <TweetPreview
                content={content}
                media={media}
                authorHandle="pranav"
                authorName="Pranav"
              />
            </div>
          </MobileFrame>
        </div>
      </div>
    </div>
  );
}
