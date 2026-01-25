import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { ThemeProvider } from "../components/theme-provider";
import { authClient } from "../utils/auth/auth-client";

type UserType = typeof authClient.$Infer.Session.user;
type SessionType = typeof authClient.$Infer.Session;

export interface MyRouterContext {
  auth: {
    user: UserType | null;
    session: SessionType | null;
  };
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  beforeLoad: async () => {
    const { data } = await authClient.getSession();
    console.log("data from the beforeload in Root.tsx", data);
    return {
      auth: {
        user: data?.user ?? null,
        session: data?.session ?? null,
      },
    };
  },
  component: () => (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <Outlet />
    </ThemeProvider >
  ),
});
