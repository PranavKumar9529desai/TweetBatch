import { Button } from "@repo/ui/components/ui/button";
import { cn } from "@repo/ui/lib/utils";
import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";

interface AuthButtonProps extends React.ComponentProps<typeof Button> {
    isLoading?: boolean;
    icon?: ReactNode;
}

export function AuthButton({
    children,
    isLoading,
    icon,
    className,
    disabled,
    ...props
}: AuthButtonProps) {
    return (
        <Button
            variant="outline"
            className={cn("w-full h-12 border-gray-300 dark:border-input", className)}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin text-muted-foreground" />
            ) : (
                icon && <span className="mr-3 flex items-center justify-center w-5 h-5">{icon}</span>
            )}
            {children}
        </Button>
    );
}
