import { SquarePlus, Database, List } from "lucide-react";

export const DASHBOARD_ROUTES = [
    {
        label: "Create Tweet",
        href: "/dashboard/create-tweet",
        icon: <SquarePlus className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
    },
    {
        label: "Import Tweet",
        href: "/dashboard/import-tweet",
        icon: <Database className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
    },
    {
        label: "Manage Tweet",
        href: "/dashboard/manage-tweet",
        icon: <List className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
    },
];
