import { createFileRoute } from '@tanstack/react-router'
import { Button } from "@repo/ui/components/ui/button"

export const Route = createFileRoute('/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div className='text-4xl'>Hello "/"!
    <span className="text-2xl block border">Hello world</span>
    <Button variant={'outline'}>Click me</Button>
  </div>
}
