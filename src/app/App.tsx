/**
 * Application entry component. Sets up global providers and the router.
 * Keeping this file tiny makes it obvious which top-level wiring exists.
 */
import { RouterProvider } from 'react-router-dom'
import { AppProviders } from '@/app/providers/AppProviders'
import { appRouter } from '@/app/router'

function App() {
  return (
    <AppProviders>
      <RouterProvider router={appRouter} />
    </AppProviders>
  )
}

export default App
