import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import { Crashed, NotFound } from '#/components/oops'
import { scrollBehavior } from '#/lib/utils'
import { routeTree } from './routeTree.gen'

export function getRouter() {
  const router = createTanStackRouter({
    routeTree,
    scrollRestoration: true,
    defaultHashScrollIntoView: { behavior: scrollBehavior(), block: 'start' },
    defaultNotFoundComponent: NotFound,
    defaultErrorComponent: Crashed,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
  })

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
