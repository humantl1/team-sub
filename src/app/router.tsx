/**
 * Central router configuration for the SPA.
 * Using React Router's data APIs keeps navigation declarative and makes it trivial to bolt on loaders/actions later.
 */
import { createBrowserRouter } from 'react-router-dom'
import { RootLayout } from '@/app/layouts/RootLayout'
import { AppErrorBoundary } from '@/app/routes/AppErrorBoundary'
import { HomeRoute } from '@/app/routes/HomeRoute'
import { LoginRoute } from '@/app/routes/LoginRoute'
import { RequireAuth } from '@/app/routes/RequireAuth'

/**
 * Shared route table allows both the production router and test utilities to reuse definitions.
 */
export const routes = [
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <AppErrorBoundary />,
    children: [
      {
        element: <RequireAuth />,
        children: [{ index: true, element: <HomeRoute /> }],
      },
      { path: 'login', element: <LoginRoute /> },
      {
        path: '*',
        element: null,
        loader: () => {
          /**
           * React Router surfaces unmatched URLs by letting the innermost route throw. We raise a 404-style
           * response so our branded `AppErrorBoundary` renders instead of leaving the login screen stuck in a
           * loading state when someone mistypes a link or visits a stale bookmark.
           */
          throw new Response('Route not found', { status: 404, statusText: 'Not Found' })
        },
      },
    ],
  },
]

/**
 * Centralised list of React Router v7 future flags we enable across the app and tests.
 * Keeping them in one place makes it obvious which opt-in behaviours we rely on as we prepare for v7.
 */
export const routerFutureFlags = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
}

/**
 * Default router instance used by the live application.
 * Tests can import {@link routes} and create memory routers where needed.
 *
 * We opt into React Router's upcoming v7 behaviors now (`future.v7_startTransition` and `future.v7_relativeSplatPath`).
 * This keeps our runtime aligned with the next major release, removes the warnings the test suite surfaced, and
 * ensures we catch any issues with React deferring renders or splat route resolution changes earlier in development.
 */
export const appRouter = createBrowserRouter(routes, {
  future: routerFutureFlags,
})
