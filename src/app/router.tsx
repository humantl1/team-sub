/**
 * Central router configuration for the SPA.
 * Using React Router's data APIs keeps navigation declarative and makes it trivial to bolt on loaders/actions later.
 */
import { createBrowserRouter } from 'react-router-dom'
import { RootLayout } from '@/app/layouts/RootLayout'
import { HomeRoute } from '@/app/routes/HomeRoute'
import { LoginRoute } from '@/app/routes/LoginRoute'

/**
 * Shared route table allows both the production router and test utilities to reuse definitions.
 */
export const routes = [
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <HomeRoute /> },
      { path: 'login', element: <LoginRoute /> },
    ],
  },
]

/**
 * Default router instance used by the live application.
 * Tests can import {@link routes} and create memory routers where needed.
 */
export const appRouter = createBrowserRouter(routes)
