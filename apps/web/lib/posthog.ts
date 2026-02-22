import posthog from 'posthog-js'

/**
 * Safely capture a PostHog event. No-ops if PostHog is not initialized.
 */
export function capture(event: string, properties?: Record<string, unknown>) {
  if (typeof window === 'undefined') return
  try {
    if (posthog.__loaded) {
      posthog.capture(event, properties)
    }
  } catch {
    // Silently ignore — PostHog should never break the app
  }
}

/**
 * Identify the current user after sign-in.
 */
export function identifyUser(session: {
  user: { id: string; name?: string | null; email?: string | null }
}) {
  if (typeof window === 'undefined') return
  try {
    if (posthog.__loaded) {
      posthog.identify(session.user.id, {
        name: session.user.name ?? undefined,
        email: session.user.email ?? undefined,
      })
    }
  } catch {
    // Silently ignore
  }
}

/**
 * Reset PostHog identity on sign-out.
 */
export function resetUser() {
  if (typeof window === 'undefined') return
  try {
    if (posthog.__loaded) {
      posthog.reset()
    }
  } catch {
    // Silently ignore
  }
}
