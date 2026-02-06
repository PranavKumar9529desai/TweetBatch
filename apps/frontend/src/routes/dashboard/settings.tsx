import { createFileRoute } from "@tanstack/react-router";
import { Title } from "@/components/title";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@repo/ui/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import { Button } from "@repo/ui/components/ui/button";
import { Switch } from "@repo/ui/components/ui/switch";
import { Separator } from "@repo/ui/components/ui/separator";
import { useUpdateProfile, useChangePassword } from "@/hooks/use-user-settings";
import { authClient } from "@/lib/auth.client";
import { useState } from "react";
import { toast } from "@repo/ui/components/ui/sonner";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useRouteContext } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/settings")({
  beforeLoad: async ({ context }) => {
    const sessionData = await context.queryClient.ensureQueryData({
      queryKey: ["auth", "session"],
      queryFn: async () => {
        const { data } = await authClient.getSession();
        return data;
      },
      staleTime: 1000 * 60 * 5, // 5 minutes
    });

    return {
      auth: {
        user: sessionData?.user ?? null,
        session: sessionData?.session ?? null,
      },
    };
  },
  component: SettingsPage,
});

function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const { auth } = useRouteContext({ from: "/dashboard/settings" });

  return (
    <div className="flex flex-col gap-6 md:p-10 p-6">
      <Title
        title="Settings"
        subtitle="change your settings and accounts preference"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-transparent gap-2 p-0">
          <TabsTrigger
            value="profile"
            className="data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground border border-border/40 rounded-lg py-2.5 px-4 data-[state=active]:border-secondary"
          >
            Profile
          </TabsTrigger>
          <TabsTrigger
            value="security"
            className="data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground border border-border/40 rounded-lg py-2.5 px-4 data-[state=active]:border-secondary"
          >
            Security
          </TabsTrigger>
          <TabsTrigger
            value="preferences"
            className="data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground border border-border/40 rounded-lg py-2.5 px-4 data-[state=active]:border-secondary"
          >
            Preferences
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <ProfileTab key={auth.user?.updatedAt?.toString()} />
        </TabsContent>

        <TabsContent value="security" className="mt-6">
          <SecurityTab />
        </TabsContent>

        <TabsContent value="preferences" className="mt-6">
          <PreferencesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ProfileTab() {
  const { auth } = useRouteContext({ from: "__root__" });
  const user = auth.user;

  const [name, setName] = useState(user?.name || "");
  const [image, setImage] = useState(user?.image || "");

  const updateProfileMutation = useUpdateProfile();

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }

    updateProfileMutation.mutate({
      name: name.trim(),
      image: image.trim() || undefined,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
        <CardDescription>
          Update your personal information and profile picture
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            disabled={updateProfileMutation.isPending}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            value={user?.email || ""}
            disabled
            className="bg-muted"
          />
          <p className="text-xs text-muted-foreground">
            Email cannot be changed
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="image">Profile Image URL</Label>
          <Input
            id="image"
            value={image}
            onChange={(e) => setImage(e.target.value)}
            placeholder="https://example.com/avatar.jpg"
            disabled={updateProfileMutation.isPending}
          />
          <p className="text-xs text-muted-foreground">
            Enter a URL for your profile picture
          </p>
        </div>

        <Separator />

        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={updateProfileMutation.isPending}
          >
            {updateProfileMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Save Changes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function SecurityTab() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const changePasswordMutation = useChangePassword();

  const handleChangePassword = () => {
    if (!newPassword || !confirmPassword) {
      toast.error("Please fill in all password fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    changePasswordMutation.mutate(
      {
        newPassword,
        currentPassword: currentPassword,
        revokeOtherSessions: true,
      },
      {
        onSuccess: () => {
          setCurrentPassword("");
          setNewPassword("");
          setConfirmPassword("");
        },
      },
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Security Settings</CardTitle>
        <CardDescription>
          Manage your password and security preferences
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-sm font-medium mb-4">Change Password</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password (if set)</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  disabled={changePasswordMutation.isPending}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full w-10 hover:bg-transparent"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  disabled={changePasswordMutation.isPending}
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Leave blank if you signed up with social login or magic link
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  disabled={changePasswordMutation.isPending}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full w-10 hover:bg-transparent"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  disabled={changePasswordMutation.isPending}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  disabled={changePasswordMutation.isPending}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full w-10 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={changePasswordMutation.isPending}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            <Button
              onClick={handleChangePassword}
              disabled={changePasswordMutation.isPending}
            >
              {changePasswordMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Change Password
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PreferencesTab() {
  const { auth } = useRouteContext({ from: "__root__" });
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async (enabled: boolean) => {
    setEmailNotifications(enabled);

    setIsLoading(true);
    const toastId = toast.loading("Updating preferences...");

    try {
      // In a real implementation, this would save to the backend
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast.success("Preferences updated!", { id: toastId });
    } catch (error) {
      console.error("Preferences update error:", error);
      toast.error("Failed to update preferences", { id: toastId });
      // Revert on error
      setEmailNotifications(!enabled);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Preferences</CardTitle>
        <CardDescription>
          Customize your experience and notification settings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="email-notifications">Email Notifications</Label>
            <p className="text-sm text-muted-foreground">
              Receive email notifications for scheduled tweets
            </p>
          </div>
          <Switch
            id="email-notifications"
            checked={emailNotifications}
            onCheckedChange={handleToggle}
            disabled={isLoading}
          />
        </div>

        <Separator />

        <div className="space-y-2">
          <p className="text-sm font-medium">Account</p>
          <p className="text-sm text-muted-foreground">
            Member since{" "}
            {auth.user?.createdAt
              ? new Date(auth.user.createdAt).toLocaleDateString()
              : new Date().toLocaleDateString()}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
