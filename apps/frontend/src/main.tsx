import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { MyRouterContext } from './routes/__root'
// Import the generated route tree
import { routeTree } from './routeTree.gen'

import '@repo/ui/globals.css'

// Create a client
const queryClient = new QueryClient()

// Create a new router instance
const router = createRouter({
  routeTree,
  context: {
    auth: {
      user: null,
      session: null
    },
    queryClient
  } as MyRouterContext
})

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}


const rootElement = document.getElementById('root')!
if (!rootElement.innerHTML) {
  const root = createRoot(rootElement)
  root.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </StrictMode>,
  )
}
