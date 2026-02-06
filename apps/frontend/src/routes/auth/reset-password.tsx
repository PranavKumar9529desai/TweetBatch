import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AuthButton } from "@/components/auth/auth-button";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import { authClient } from "@/lib/auth.client";
import { useState, useEffect } from "react";
import { toast } from "@repo/ui/components/ui/sonner";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";

export const Route = createFileRoute("/auth/reset-password")({
  component: ResetPasswordPage,
  validateSearch: (search: Record<string, unknown>): { token?: string; error?: string } => ({
    token: (search.token as string) || undefined,
    error: (search.error as string) || undefined,
  }),
});

function ResetPasswordPage() {
  const { token, error: urlError } = Route.useSearch();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (urlError) {
      toast.error(urlError);
    }
    if (!token) {
      toast.error("Invalid or missing reset token");
      navigate({ to: "/auth/forgot-password" });
    }
  }, [token, urlError, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    if (!token) {
      toast.error("Invalid reset token");
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading("Resetting your password...");

    try {
      const { error } = await authClient.resetPassword({
        newPassword: password,
      });

      if (error) {
        toast.error(error.message || "Failed to reset password", {
          id: toastId,
        });
        setIsLoading(false);
      } else {
        toast.success("Password reset successful! Redirecting to sign in...", {
          id: toastId,
        });
        setTimeout(() => {
          navigate({ to: "/auth/sign-in" });
        }, 1500);
      }
    } catch (error) {
      console.error("Reset password error:", error);
      toast.error("An unexpected error occurred", { id: toastId });
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 w-full max-w-sm mx-auto">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-foreground">Reset your password</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Enter your new password below
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">New Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 pr-10"
              disabled={isLoading}
              required
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-12 w-10 hover:bg-transparent"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Eye className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Must be at least 8 characters long
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="h-12 pr-10"
              disabled={isLoading}
              required
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-12 w-10 hover:bg-transparent"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              disabled={isLoading}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Eye className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </div>
        </div>

        <AuthButton
          type="submit"
          isLoading={isLoading}
          disabled={isLoading || !password || !confirmPassword}
        >
          Reset Password
        </AuthButton>
      </form>
    </div>
  );
}
