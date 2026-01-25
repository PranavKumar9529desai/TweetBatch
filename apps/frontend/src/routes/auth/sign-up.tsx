import { createFileRoute, Link } from "@tanstack/react-router";
import { AuthButton } from "@/components/auth/auth-button";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import { Separator } from "@repo/ui/components/ui/separator";
import { authClient } from "@/utils/auth/auth-client";
import { useState } from "react";
import { toast } from "@repo/ui/components/ui/sonner";

export const Route = createFileRoute("/auth/sign-up")({
  component: SignUpPage,
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => ({
    redirect: (search.redirect as string) || undefined,
  }),
});

function SignUpPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleTwitterSignUp = async () => {
    setIsLoading("twitter");
    const toastId = toast.loading("Redirecting to X (Twitter)...");
    try {
      const { error } = await authClient.signIn.social({
        provider: "twitter",
        callbackURL: import.meta.env.VITE_FRONTEND_URL + "/dashboard",
      });
      if (error) {
        toast.error(error.message || "Failed to sign up with X", {
          id: toastId,
        });
        setIsLoading(null);
      } else {
        toast.success("Redirecting...", { id: toastId });
      }
    } catch (error) {
      console.error("Twitter sign up error:", error);
      toast.error("An unexpected error occurred", { id: toastId });
      setIsLoading(null);
    }
  };

  const handleGoogleSignUp = async () => {
    setIsLoading("google");
    const toastId = toast.loading("Redirecting to Google...");
    try {
      const { error } = await authClient.signIn.social({
        provider: "google",
        callbackURL: import.meta.env.VITE_FRONTEND_URL + "/dashboard",
      });
      if (error) {
        toast.error(error.message || "Failed to sign up with Google", {
          id: toastId,
        });
        setIsLoading(null);
      } else {
        toast.success("Redirecting...", { id: toastId });
      }
    } catch (error) {
      console.error("Google sign up error:", error);
      toast.error("An unexpected error occurred", { id: toastId });
      setIsLoading(null);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading("email");
    const toastId = toast.loading("Sending magic link...");
    try {
      const { error } = await authClient.signIn.magicLink({
        email,
        name,
        callbackURL: import.meta.env.VITE_FRONTEND_URL + "/dashboard",
      });
      if (error) {
        toast.error(error.message || "Failed to send magic link", {
          id: toastId,
        });
        setIsLoading(null);
      } else {
        toast.success("Magic link sent! Check your email.", { id: toastId });
        // Keep loading state or reset? Usually reset for magic link if staying on page
        setIsLoading(null);
      }
    } catch (error) {
      console.error("Email sign up error:", error);
      toast.error("An unexpected error occurred", { id: toastId });
      setIsLoading(null);
    }
  };

  return (
    <div className="space-y-6 w-full max-w-sm mx-auto">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-foreground">
          Create an account
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          Start scheduling your tweets today
        </p>
      </div>

      {/* Social Sign Up */}
      <div className="space-y-3">
        {/* Twitter/X Sign Up */}
        <AuthButton
          onClick={handleTwitterSignUp}
          isLoading={isLoading === "twitter"}
          disabled={isLoading !== null}
          icon={
            <svg
              className="w-full h-full"
              fill="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          }
        >
          Continue with X
        </AuthButton>

        {/* Google Sign Up */}
        <AuthButton
          onClick={handleGoogleSignUp}
          isLoading={isLoading === "google"}
          disabled={isLoading !== null}
          icon={
            <svg className="w-full h-full" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
          }
        >
          Continue with Google
        </AuthButton>
      </div>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <Separator className="w-full" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">or</span>
        </div>
      </div>

      {/* Email Sign Up */}
      <form onSubmit={handleEmailSignUp} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-12"
            disabled={isLoading !== null}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12"
            disabled={isLoading !== null}
          />
        </div>
        <AuthButton
          type="submit"
          isLoading={isLoading === "email"}
          disabled={isLoading !== null || !email}
        >
          Continue with Email
        </AuthButton>
      </form>

      {/* Sign In Link */}
      <p className="text-center text-muted-foreground text-sm">
        Already have an account?{" "}
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
