import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { TweetEditor } from "@/components/create-tweet/tweet-editor";
import { TweetPreview } from "@/components/create-tweet/tweet-preview";
import { MobileFrame } from "@/components/create-tweet/mobile-frame";
import { Title } from "@/components/title";

export const Route = createFileRoute("/dashboard/create-tweet")({
  component: CreateTweetPage,
});

function CreateTweetPage() {
  const [content, setContent] = useState("");
  const [media, setMedia] = useState<
    Array<{ id: string; url: string; type: "image" | "gif" | "video" }>
  >([]);

  return (
    <div className="flex flex-col lg:flex-row container mx-auto p-4 lg:py-10 max-w-[100rem] pb-32">
      {/* Left Column: Editor */}
      <div className="flex-1 flex flex-col gap-6 w-full">
        <div className="w-full justify-center sm:text-left p-2">
          <Title title="Create Tweet" subtitle="Draft and schedule your tweets." />
        </div>
        <TweetEditor
          content={content}
          onChange={setContent}
          media={media}
          onMediaChange={setMedia}
          className="flex-1"
        />
      </div>

      {/* Right Column: Mobile Preview */}

      <div className="w-full lg:w-[400px] flex-shrink-0 flex items-center justify-center rounded-3xl p-4 lg:p-10 gap-12 mt-8 lg:mt-0">
        <div className="scale-[0.75] xs:scale-[0.85] lg:scale-[0.85] origin-bottom lg:origin-center -my-36 lg:-my-20">
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
