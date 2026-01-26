import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { TweetEditor } from "@/components/create-tweet/tweet-editor";
import { TweetPreview } from "@/components/create-tweet/tweet-preview";
import { MobileFrame } from "@/components/create-tweet/mobile-frame";
import { Title } from "@/components/title";
import { apiclient } from "@/lib/api.client";
import { toast } from "@repo/ui/components/ui/sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@repo/ui/components/ui/dialog";
import { Button } from "@repo/ui/components/ui/button";
import { Calendar as CalendarUI } from "@repo/ui/components/ui/calendar";
import { format } from "date-fns";

export const Route = createFileRoute("/dashboard/create-tweet")({
  component: CreateTweetPage,
});

function CreateTweetPage() {

  const [content, setContent] = useState("");
  const [media, setMedia] = useState<
    Array<{ id: string; url: string; type: "image" | "gif" | "video" }>
  >([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [scheduleDate, setScheduleDate] = useState<Date | undefined>();
  const { auth } = Route.useRouteContext();
  const user = auth.user;

  const handlePost = async (isScheduled: boolean, scheduledAt?: Date) => {
    if (!user?.id) {
      toast.error("You must be logged in to post");
      return;
    }

    if (!content.trim()) {
      toast.error("Content cannot be empty");
      return;
    }

    setIsSubmitting(true);
    try {
      if (isScheduled && scheduledAt) {
        // Use posts API for scheduling (transitions from draft to pending in kanban)
        const res = await apiclient.posts.$post({
          json: {
            userId: user.id,
            content: content,
            scheduledAt: scheduledAt.toISOString(),
          }
        });

        const data = await res.json();
        if (data.success) {
          toast.success(`Draft scheduled for ${scheduledAt.toLocaleDateString()}`);
          setContent("");
          setShowScheduleDialog(false);
          setScheduleDate(undefined);
        } else {
          toast.error(data.error || "Failed to schedule draft");
        }
      } else {
        // Create a draft post (no scheduled time yet)
        const res = await apiclient.posts.$post({
          json: {
            userId: user.id,
            content: content,
          }
        });

        const data = await res.json();
        if (data.success) {
          toast.success("Draft created! Manage it in the kanban board.");
          setContent("");
          setShowConfirmDialog(false);
        } else {
          toast.error(data.error || "Failed to create draft");
        }
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to connect to API");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePostClick = (isScheduled: boolean, scheduledAt?: Date) => {
    // Always show confirmation dialog to ask if they want to schedule or post now
    if (!scheduledAt) {
      setShowConfirmDialog(true);
      return;
    }
    handlePost(isScheduled, scheduledAt);
  };

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
          onPost={handlePostClick}
          isSubmitting={isSubmitting}
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

      {/* Schedule Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent className="w-[95vw] sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Schedule Draft</DialogTitle>
            <DialogDescription>
              Select a date and time to schedule your draft.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 items-center">
            <CalendarUI
              mode="single"
              selected={scheduleDate}
              onSelect={(date) => {
                if (date) {
                  const newDate = new Date(date);
                  if (scheduleDate) {
                    newDate.setHours(scheduleDate.getHours());
                    newDate.setMinutes(scheduleDate.getMinutes());
                  } else {
                    // Default to next hour if nothing set
                    const nextHour = new Date();
                    nextHour.setHours(nextHour.getHours() + 1);
                    newDate.setHours(nextHour.getHours());
                    newDate.setMinutes(0);
                  }
                  setScheduleDate(newDate);
                }
              }}
              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
              initialFocus
            />
            {scheduleDate && (
              <div className="flex flex-col gap-2">
                <label htmlFor="tweet-time" className="text-sm font-medium">Time</label>
                <input
                  id="tweet-time"
                  type="time"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  value={format(scheduleDate, "HH:mm")}
                  onChange={(e) => {
                    const [hours, minutes] = e.target.value.split(":").map(Number);
                    const newDate = new Date(scheduleDate);
                    newDate.setHours(hours);
                    newDate.setMinutes(minutes);
                    setScheduleDate(newDate);
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Scheduling for: <span className="font-medium text-foreground">{format(scheduleDate, "PPP 'at' HH:mm")}</span>
                </p>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowScheduleDialog(false);
                setScheduleDate(undefined);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => handlePost(true, scheduleDate)}
              disabled={!scheduleDate || isSubmitting}
            >
              {isSubmitting ? "Scheduling..." : "Schedule Draft"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog - Ask if user wants to create draft or schedule */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create as Draft?</DialogTitle>
            <DialogDescription>
              Create this as a draft (to be scheduled later in Manage Tweets) or schedule it now?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowConfirmDialog(false);
                setShowScheduleDialog(true);
              }}
            >
              Schedule Now
            </Button>
            <Button
              onClick={() => handlePost(false)}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating..." : "Create Draft"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
