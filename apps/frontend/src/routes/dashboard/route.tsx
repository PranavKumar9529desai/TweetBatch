import { DesktopLayout } from "@/components/dashboard/desktop-layout";
import { MobileLayout } from "@/components/dashboard/mobile-layout";
import { useIsMobile } from "@repo/ui/hooks/use-mobile";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: ({ context, location }) => {
    if (!context.auth.user) {
      throw redirect({
        href: `/auth/sign-in?redirect=${encodeURIComponent(location.href)}`,
      });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <MobileLayout />;
  }

  return <DesktopLayout />;
}
