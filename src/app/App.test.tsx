/**
 * Visual-focused smoke test for the Tailwind-enabled starter app.
 * We assert against specific utility classes and copy so QA can quickly spot regressions in theming.
 */
import { render, screen } from '@testing-library/react'
import App from './App'

// The visual shell should render Tailwind-driven layout primitives and seeded roster data.
describe('App', () => {
  it('renders the Tailwind showcase layout with seeded roster sections', () => {
    const { container } = render(<App />)

    // Main landmark picks up Tailwind flexbox + gradient utilities.
    const main = screen.getByRole('main')
    expect(main).toHaveClass('flex')
    expect(main).toHaveClass('w-full')
    expect(main).toHaveClass('bg-gradient-to-br')

    // Hero header anchors the layout; QA will look for this title atop the glassmorphic card.
    expect(
      screen.getByRole('heading', { level: 1, name: /team substitutions sandbox/i }),
    ).toBeInTheDocument()

    // Both roster sections surface as headings within their respective cards.
    expect(screen.getByRole('heading', { level: 2, name: /starters on the field/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: /bench ready to rotate/i })).toBeInTheDocument()

    // List items render eight seeded players (4 starters + 4 bench) so visual QA can confirm grid spacing.
    expect(screen.getAllByRole('listitem')).toHaveLength(8)

    // The CTA button should expose the Tailwind primary accent so gradients can be pulsed during QA.
    const pulseButton = screen.getByRole('button', { name: /pulse gradient/i })
    expect(pulseButton).toHaveClass('bg-purple-500')

    // Snapshot the first section container to capture key utility classes for quick regression checks.
    const showcaseSection = container.querySelector('section')
    if (!showcaseSection) {
      throw new Error('Expected the Tailwind showcase section to be in the document')
    }
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
