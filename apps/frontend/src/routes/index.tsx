import { createFileRoute } from '@tanstack/react-router'
import { Button } from "@repo/ui/components/ui/button"
import { authClient } from '@repo/auth/client'

export const Route = createFileRoute('/')({
  component: RouteComponent,
})

function handleClick() {
  const response = authClient.signIn.social({
    provider: "twitter",
    callbackURL: "/"
  });
  console.log(response)
}

function RouteComponent() {
  return <div className='h-screen flex items-center justify-center'>
    <Button variant={'outline'} className='bg-primary text-primary-foreground w-full max-w-sm p-4' onClick={handleClick}>Click me</Button>
  </div>
}
