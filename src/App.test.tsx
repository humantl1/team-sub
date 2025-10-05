import { render, screen } from '@testing-library/react'
import App from './App'

// This smoke test makes sure our Vitest + Testing Library wiring can render the root component without crashing.
describe('App', () => {
  it('renders the starter headline so we know the component mounted', () => {
    // Render the component through Testing Library so the assertions stay focused on user-visible output.
    render(<App />)

    // `getByRole` mirrors how assistive tech queries the page, helping us keep accessibility front of mind.
    expect(screen.getByRole('heading', { name: /vite \+ react/i })).toBeInTheDocument()
  })
})
