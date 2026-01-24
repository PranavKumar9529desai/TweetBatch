import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/manage-tweet')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/dashboard/manage-tweet"!</div>
}
