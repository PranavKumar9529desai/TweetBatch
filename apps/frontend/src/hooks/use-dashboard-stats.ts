import { useQuery } from "@tanstack/react-query";
import { apiclient } from "../lib/api.client";
import { useRouteContext } from "@tanstack/react-router";

export function useDashboardStats() {
    const { auth } = useRouteContext({ from: '__root__' });
    const userId = auth.user?.id;

    return useQuery({
        queryKey: ["dashboard-stats", userId],
        queryFn: async () => {
            const res = await apiclient.analytics.dashboard.$get();
            if (!res.ok) {
                throw new Error("Failed to fetch dashboard stats");
            }
            const data = await res.json();
            return data.data;
        },
        enabled: !!userId,
    });
}
