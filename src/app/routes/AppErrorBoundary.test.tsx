/**
 * Ensures our custom router error boundary renders the branded fallback and exposes diagnostics in dev.
 */
import { render, screen, waitFor } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AppErrorBoundary } from './AppErrorBoundary'

interface RenderRouterOptions {
  initialEntries?: string[]
}

const ROUTER_FUTURE_FLAGS = {
  /** Tests reuse the same future flags as production so React Router opts into v7 behaviours consistently. */
  v7_startTransition: true,
  v7_relativeSplatPath: true,
}

function renderRouterWithError(
  routerConfig: Parameters<typeof createMemoryRouter>[0],
  options: RenderRouterOptions = {},
) {
  /**
   * Tests can override the initial history stack so we can simulate navigating to `/missing` without
   * rendering the entire application router. Defaulting to `/` keeps existing tests unchanged.
   */
  const router = createMemoryRouter(routerConfig, {
    initialEntries: options.initialEntries ?? ['/'],
    /** Opt into the v7 transition and splat-path behaviours so the suite mirrors production. */
    future: ROUTER_FUTURE_FLAGS,
  })
  return render(<RouterProvider router={router} future={ROUTER_FUTURE_FLAGS} />)
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
    expect(screen.getByText('Not found')).toBeInTheDocument()
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

    // The error message appears twice: once in the main error message and once in the developer diagnostics section.
    await waitFor(() => expect(screen.getAllByText(/Kaboom from element render/)).toHaveLength(2))
    expect(screen.getByRole('button', { name: /reload page/i })).toBeInTheDocument()
  })

  it('renders the branded 404 UI when navigation targets an unknown path', async () => {
    /**
     * This config mirrors the structure of our production router: the root layout owns the error boundary and
     * child routes define the actual pages. We intentionally include only the index route so navigating to
     * `/missing` hits the catch-all loader and funnels into the boundary.
     */
    renderRouterWithError(
      [
        {
          path: '/',
          element: <div>root shell should not render for missing routes</div>,
          errorElement: <AppErrorBoundary />,
          children: [
            { index: true, element: <div>home</div> },
            {
              path: '*',
              element: <></>,
              loader: () => {
                throw new Response('Route not found', { status: 404, statusText: 'Not Found' })
              },
            },
          ],
        },
      ],
      { initialEntries: ['/missing'] },
    )

    await waitFor(() => expect(screen.getByText(/Error 404/i)).toBeInTheDocument())
    expect(screen.getByRole('heading', { name: /404/i })).toBeInTheDocument()
    expect(screen.getByText('Route not found')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /return to dashboard/i })).toBeInTheDocument()
  })
})
