/**
 * Application entry component. Sets up global providers and the router.
 * Keeping this file tiny makes it obvious which top-level wiring exists.
 */
import { RouterProvider } from 'react-router-dom'
import { AppProviders } from '@/app/providers/AppProviders'
import { appRouter, routerFutureFlags } from '@/app/router'

function App() {
  return (
    <AppProviders>
      {/**
       * Pass the same future flags to `RouterProvider` that we used when creating the router so React Router enables the v7 behaviour and keeps warnings quiet in all environments.
       */}
      <RouterProvider router={appRouter} future={routerFutureFlags} />
    </AppProviders>
  )
}

export default App
