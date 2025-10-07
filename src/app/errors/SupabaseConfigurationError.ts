/**
 * Error thrown when the Supabase client fails to initialize because required configuration is missing.
 * Surfacing a dedicated error type lets the router error boundary render a tailored message while
 * still exposing the raw details to developers in development mode.
 */
export class SupabaseConfigurationError extends Error {
  readonly status: number
  readonly statusText: string

  constructor(message: string, options: { status?: number; statusText?: string } = {}) {
    super(message)
    this.name = 'SupabaseConfigurationError'
    this.status = options.status ?? 500
    this.statusText = options.statusText ?? 'Supabase configuration error'
  }
}
