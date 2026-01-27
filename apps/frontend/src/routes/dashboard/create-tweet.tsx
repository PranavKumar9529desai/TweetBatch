import { useState, useEffect } from "react";
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
import { z } from "zod";

const createTweetSearchSchema = z.object({
  postId: z.string().optional(),
  mode: z.enum(["view", "edit"]).optional(),
});

export const Route = createFileRoute("/dashboard/create-tweet")({
  validateSearch: (search) => createTweetSearchSchema.parse(search),
  loaderDeps: ({ search }) => ({ search }),
  loader: async ({ deps: { search } }) => {
    if (!search.postId) return null;
    try {
      const res = await apiclient.posts[":id"].$get({
        param: { id: search.postId },
      });
      const data = await res.json();
      if (data.success && data.post) {
        return data.post;
      }
    } catch (error) {
      console.error("Error fetching post:", error);
    }
    return null;
  },
  component: CreateTweetPage,
});

function CreateTweetPage() {
  const { postId, mode } = Route.useSearch();
  const navigate = Route.useNavigate();
  const initialPost = Route.useLoaderData();

  const [content, setContent] = useState(initialPost?.content || "");
  const [media, setMedia] = useState<
    Array<{ id: string; url: string; type: "image" | "gif" | "video" }>
  >([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [scheduleDate, setScheduleDate] = useState<Date | undefined>(
    initialPost?.scheduledAt ? new Date(initialPost.scheduledAt) : undefined
  );

  const { auth } = Route.useRouteContext();
  const user = auth.user;
  const isViewMode = mode === "view";

  useEffect(() => {
    if (initialPost) {
      setContent(initialPost.content);
      setScheduleDate(initialPost.scheduledAt ? new Date(initialPost.scheduledAt) : undefined);
    } else {
      setContent("");
      setScheduleDate(undefined);
    }
  }, [initialPost]);

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
      if (postId) {
        // Update existing post
        const res = await apiclient.posts[":id"].$patch({
          param: { id: postId },
          json: {
            content: content,
            scheduledAt: isScheduled && scheduledAt ? scheduledAt.toISOString() : undefined,
          }
        });

        const data = await res.json();
        if (data.success) {
          toast.success(isScheduled ? `Draft rescheduled for ${scheduledAt?.toLocaleDateString()}` : "Draft updated!");
          // If we just updated, maybe we want to redirect or just stay here?
          // For now, let's just close dialogs
          setShowScheduleDialog(false);
          setShowConfirmDialog(false);
        } else {
          toast.error(data.error || "Failed to update draft");
        }
      } else {
        // Create new post
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
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to connect to API");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePostClick = (isScheduled: boolean, scheduledAt?: Date) => {
    // If it's already an existing post (edit mode) or if we are scheduling
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
          <Title title={postId ? isViewMode ? "View Tweet" : "Edit Tweet" : "Create Tweet"} subtitle={postId ? isViewMode ? "View your draft." : "Update your draft." : "Draft and schedule your tweets."} />
        </div>
        <TweetEditor
          content={content}
          onChange={setContent}
          media={media}
          onMediaChange={setMedia}
          onPost={handlePostClick}
          isSubmitting={isSubmitting}
          className="flex-1"
          readOnly={isViewMode}
          actionLabel={isViewMode ? "Edit" : undefined}
          onAction={isViewMode ? () => navigate({ search: { postId, mode: 'edit' } }) : undefined}
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
            <DialogTitle>{postId ? "Reschedule Draft" : "Schedule Draft"}</DialogTitle>
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
              {isSubmitting ? "Scheduling..." : (postId ? "Update Schedule" : "Schedule Draft")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog - Ask if user wants to create draft or schedule */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{postId ? "Update Draft?" : "Create as Draft?"}</DialogTitle>
            <DialogDescription>
              {postId
                ? "Update this draft or reschedule it?"
                : "Create this as a draft (to be scheduled later in Manage Tweets) or schedule it now?"
              }
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
              {postId ? "Reschedule" : "Schedule Now"}
            </Button>
            <Button
              onClick={() => handlePost(false)}
              disabled={isSubmitting}
            >
              {isSubmitting ? (postId ? "Updating..." : "Creating...") : (postId ? "Update Draft" : "Create Draft")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
