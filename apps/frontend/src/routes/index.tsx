import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from "@repo/ui/components/ui/button"
import { LandingSkeleton } from '@/components/landing-skeleton'
import { authClient } from '@/lib/auth.client'

export const Route = createFileRoute('/')({
  loader: async () => {
    const { data: session } = await authClient.getSession();
    return { session };
  },
  pendingComponent: LandingSkeleton,
  component: RouteComponent,
})

function RouteComponent() {
  const { session } = Route.useLoaderData();

  return (
    <div className='h-screen flex flex-col items-center justify-center gap-4'>

      <div className="w-full max-w-sm flex flex-col gap-3">
        {session ? (
          <Button asChild className='w-full p-6 text-lg'>
            <Link to="/dashboard">Go to Dashboard</Link>
          </Button>
        ) : (
          <Button asChild className=''>
            <Link to="/auth/sign-in">Sign In to Get Started</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
