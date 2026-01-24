import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/create-tweet')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/dashboard/create-tweet"!</div>
}
