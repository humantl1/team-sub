/**
 * Smoke test validating that the router, layout, and Tailwind showcase render together without regressions.
 */
import { render, screen, within } from '@testing-library/react'
import App from './App'

describe('App', () => {
  it('renders the routed Tailwind showcase with navigation chrome', () => {
    const { container } = render(<App />)

    // Navigation shell should expose the project title and the planned routes.
    expect(screen.getByText(/team sub planner/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /login/i })).toBeInTheDocument()

    // Skip link stays hidden until focused, but we can validate the wiring via its accessible name.
    expect(screen.getByRole('link', { name: /skip to content/i })).toHaveAttribute('href', '#main-content')

    // Main landmark is provided by the RootLayout; child routes render inside it.
    const main = screen.getByRole('main')
    expect(main).toHaveAttribute('id', 'main-content')

    // The gradient wrapper lives directly under <main> now that routing owns the outer shell.
    const gradientWrapper = main.querySelector('div.bg-gradient-to-br')
    if (!gradientWrapper) {
      throw new Error('Expected the Tailwind gradient wrapper to mount inside the main outlet')
    }
    expect(gradientWrapper).toHaveClass('flex')
    expect(gradientWrapper).toHaveClass('w-full')

    // Hero header anchors the layout; QA looks for this title atop the glassmorphic card.
    expect(
      screen.getByRole('heading', { level: 1, name: /team substitutions sandbox/i }),
    ).toBeInTheDocument()

    // Both roster sections surface as headings within their respective cards.
    expect(screen.getByRole('heading', { level: 2, name: /starters on the field/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: /bench ready to rotate/i })).toBeInTheDocument()

    // Gather lists within the showcase card so nav list items are excluded from the assertion.
    const showcaseSection = container.querySelector('section')
    if (!showcaseSection) {
      throw new Error('Expected the Tailwind showcase section to be in the document')
    }

    const rosterLists = within(showcaseSection).getAllByRole('list')
    expect(rosterLists).toHaveLength(2)

    const playerItems = rosterLists.flatMap((list) => within(list).getAllByRole('listitem'))
    expect(playerItems).toHaveLength(8)

    // The CTA button should expose the Tailwind primary accent so gradients can be pulsed during QA.
    const pulseButton = screen.getByRole('button', { name: /pulse gradient/i })
    expect(pulseButton).toHaveClass('bg-purple-500')

    // Snapshot the first section container to capture key utility classes for quick regression checks.
    expect(showcaseSection).toHaveClass(
      'rounded-3xl',
      'bg-slate-900/70',
      'border-slate-800/80',
      'backdrop-blur',
    )

    const gridWrapper = showcaseSection.querySelector('div.grid')
    if (!gridWrapper) {
      throw new Error('Expected the starter/bench grid to render')
    }
    expect(gridWrapper).toHaveClass('md:grid-cols-2')

    const accentCard = showcaseSection.querySelector('footer')
    if (!accentCard) {
      throw new Error('Expected the accent footer to render')
    }
    expect(accentCard).toHaveClass('bg-purple-500/10')
  })
})
