import { Link } from "@tanstack/react-router";
import { Button } from "@repo/ui/components/ui/button";

export function NotFound() {
    return (
        <div className="h-screen flex flex-col items-center justify-center gap-6 p-4 text-center">
            <div className="space-y-2">
                <h1 className="text-7xl font-bold text-primary">404</h1>
                <h2 className="text-2xl font-semibold italic text-muted-foreground tracking-tight">
                    Page Not Found
                </h2>
            </div>
            <p className="text-muted-foreground max-w-md mx-auto">
                Oops! The page you're looking for doesn't exist or has been moved.
            </p>
            <Button asChild size="lg" className="px-8">
                <Link to="/">Back to Home</Link>
            </Button>
        </div>
    );
}
