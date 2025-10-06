/**
 * Ensures our custom router error boundary renders the branded fallback and exposes diagnostics in dev.
 */
import { render, screen, waitFor } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AppErrorBoundary } from './AppErrorBoundary'

function renderRouterWithError(routerConfig: Parameters<typeof createMemoryRouter>[0]) {
  const router = createMemoryRouter(routerConfig, { initialEntries: ['/'] })
  return render(<RouterProvider router={router} />)
}

describe('AppErrorBoundary', () => {
  it('shows the HTTP status when a loader throws a response', async () => {
    renderRouterWithError([
      {
        path: '/',
        element: <div>should not render</div>,
        loader: () => {
          throw new Response('Not found', { status: 404, statusText: 'Not Found' })
        },
        errorElement: <AppErrorBoundary />,
      },
    ])

    await waitFor(() => expect(screen.getByText(/Error 404/i)).toBeInTheDocument())
    expect(screen.getByRole('heading', { name: /404/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /return to dashboard/i })).toBeInTheDocument()
  })

  it('shows developer diagnostics in development mode when an element throws', async () => {
    const Boom = () => {
      throw new Error('Kaboom from element render')
    }

    renderRouterWithError([
      {
        path: '/',
        element: <Boom />,
        errorElement: <AppErrorBoundary />,
      },
    ])

    await waitFor(() => expect(screen.getAllByText(/Kaboom from element render/)).toHaveLength(2))
    expect(screen.getByRole('button', { name: /reload page/i })).toBeInTheDocument()
  })
})
