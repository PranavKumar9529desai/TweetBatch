import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/import-tweet')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/dashboard/import-tweet"!</div>
}
