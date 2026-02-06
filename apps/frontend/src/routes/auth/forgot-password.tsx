import { createFileRoute, Link } from "@tanstack/react-router";
import { AuthButton } from "@/components/auth/auth-button";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import { authClient } from "@/lib/auth.client";
import { useState } from "react";
import { toast } from "@repo/ui/components/ui/sonner";

export const Route = createFileRoute("/auth/forgot-password")({
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    const toastId = toast.loading("Sending password reset email...");

    try {
      const { error } = await authClient.requestPasswordReset({
        email,
        redirectTo: "/auth/reset-password",
      });

      if (error) {
        toast.error(error.message || "Failed to send password reset email", {
          id: toastId,
        });
        setIsLoading(false);
      } else {
        toast.success("Password reset email sent! Check your inbox.", {
          id: toastId,
        });
        setEmailSent(true);
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Forgot password error:", error);
      toast.error("An unexpected error occurred", { id: toastId });
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="space-y-6 w-full max-w-sm mx-auto">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground">Check your email</h2>
          <p className="text-muted-foreground text-sm mt-1">
            We've sent a password reset link to <strong>{email}</strong>
          </p>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            Didn't receive the email? Check your spam folder or try again.
          </p>
          <AuthButton
            onClick={() => setEmailSent(false)}
            disabled={isLoading}
          >
            Send another email
          </AuthButton>
        </div>

        <p className="text-center text-muted-foreground text-sm">
          Remember your password?{" "}
          <Link
            to="/auth/sign-in"
            className="text-primary hover:underline font-medium"
          >
            Sign in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full max-w-sm mx-auto">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-foreground">Forgot password?</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Enter your email and we'll send you a reset link
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12"
            disabled={isLoading}
            required
          />
        </div>
        <AuthButton
          type="submit"
          isLoading={isLoading}
          disabled={isLoading || !email}
        >
          Send reset link
        </AuthButton>
      </form>

      <p className="text-center text-muted-foreground text-sm">
        Remember your password?{" "}
        <Link
          to="/auth/sign-in"
          className="text-primary hover:underline font-medium"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
