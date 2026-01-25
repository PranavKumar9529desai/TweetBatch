import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/auth')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <section className='relative flex h-screen w-full items-center justify-center'>
      {/* Top right branding */}
      <div className='absolute top-6 left-6 flex items-center gap-2'>
        <img
          src='/favicon/favicon.svg'
          alt='TweetBatch Logo'
          className='h-8 w-8'
        />
        <span className='text-lg font-semibold tracking-tight'>
          TweetBatch
        </span>
      </div>
      <Outlet />
    </section>
  )
}
