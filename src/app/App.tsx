/**
 * Root application component rendered by Vite.
 * This version deliberately leans on Tailwind utilities so we can visually confirm the framework is wired up.
 */
import { useMemo, useState } from 'react'

// Sample lineup data gives us a concrete grid to style with Tailwind utilities.
const SAMPLE_STARTERS = ['Amelia', 'Kai', 'Jordan', 'Priya'] as const
const SAMPLE_BENCH = ['Rowan', 'Devon', 'Sage', 'Noor'] as const

// Temporary starter component that lets us validate React state updates, Tailwind styling, and HMR before building real features.
function App() {
  const [energyPulse, setEnergyPulse] = useState(0)

  // Computing gradient intensity from state showcases Tailwind utility concatenation alongside React state.
  const gradientClass = useMemo(() => {
    const pulseIndex = energyPulse % 3
    // Each variant swaps a subtle accent color so QA can visually spot state changes.
    return [
      'from-purple-500/40 via-slate-900 to-slate-950',
      'from-fuchsia-500/40 via-slate-900 to-slate-950',
      'from-blue-500/40 via-slate-900 to-slate-950',
    ][pulseIndex]
  }, [energyPulse])

  return (
    <main
      className={`flex min-h-screen w-full flex-col items-center justify-center bg-gradient-to-br ${gradientClass} px-4 py-12 text-slate-100 transition-colors duration-500`}
    >
      <section className="w-full max-w-3xl space-y-8 rounded-3xl border border-slate-800/80 bg-slate-900/70 p-10 shadow-2xl shadow-purple-900/25 backdrop-blur">
        <header className="space-y-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-purple-300/90">
            Tailwind Visual Smoke Test
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Team Substitutions Sandbox
          </h1>
          <p className="text-sm text-slate-300 sm:text-base">
            We use this playground to ensure Tailwind utilities render correctly before layering in real sports logic.
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          <article className="space-y-4 rounded-2xl border border-slate-800/60 bg-slate-900/80 p-6 shadow-inner shadow-black/40">
            <h2 className="text-lg font-semibold text-white">Starters on the Field</h2>
            <ul className="grid gap-3 text-left">
              {SAMPLE_STARTERS.map((player, index) => (
                <li
                  key={player}
                  className="flex items-center justify-between rounded-xl border border-slate-800/70 bg-slate-950/60 px-4 py-3 shadow-sm shadow-black/20"
                >
                  <span className="text-sm font-medium uppercase tracking-wide text-slate-400">
                    #{index + 1}
                  </span>
                  <span className="text-lg font-semibold text-white">{player}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="space-y-4 rounded-2xl border border-slate-800/60 bg-slate-900/80 p-6 shadow-inner shadow-black/40">
            <h2 className="text-lg font-semibold text-white">Bench Ready to Rotate</h2>
            <ul className="grid gap-3 text-left">
              {SAMPLE_BENCH.map((player) => (
                <li
                  key={player}
                  className="rounded-xl border border-dashed border-purple-500/50 bg-slate-950/50 px-4 py-3 text-white"
                >
                  <span className="text-base font-medium">{player}</span>
                </li>
              ))}
            </ul>
          </article>
        </div>

        <footer className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-purple-500/30 bg-purple-500/10 p-6 text-center sm:flex-row sm:text-left">
          <div className="space-y-2">
            <h2 className="text-base font-semibold text-white">Energy Pulse Demo</h2>
            <p className="text-sm text-slate-200/80">
              Clicking the button rotates gradient accents so we can visually verify Tailwind transitions.
            </p>
          </div>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-full bg-purple-500 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white shadow-lg shadow-purple-500/40 transition hover:bg-purple-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-300"
            onClick={() => setEnergyPulse((value) => value + 1)}
          >
            Pulse gradient (clicked {energyPulse} times)
          </button>
        </footer>
      </section>
    </main>
  )
}

export default App
