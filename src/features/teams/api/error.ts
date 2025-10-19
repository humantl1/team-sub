import type { PostgrestError } from '@supabase/supabase-js'
import type { AppError } from './types'

/**
 * Convert Supabase (or generic) errors into the shared `AppError` shape. Consolidating the logic in
 * one helper keeps the hooks light while ensuring every failure path carries a user-friendly message
 * plus the original error for debugging.
 */
export function toAppError(error: unknown, fallbackMessage: string): AppError {
  if (isPostgrestError(error)) {
    return {
      message: error.message ?? fallbackMessage,
      cause: error,
    }
  }

  if (error instanceof Error) {
    return {
      message: error.message || fallbackMessage,
      cause: error,
    }
  }

  // Unknown error shapes (network hiccups, thrown strings) fall back to the provided message.
  return {
    message: fallbackMessage,
  }
}

/**
 * Type guard that detects Supabase PostgREST error objects without importing the entire type into
 * every call site. Supabase error objects include a `code` property (string) along with a
 * human-readable `message`.
 */
function isPostgrestError(error: unknown): error is PostgrestError {
  return Boolean(
    error &&
      typeof error === 'object' &&
      'code' in error &&
      typeof (error as { code?: unknown }).code === 'string',
  )
}
