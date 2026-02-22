'use client'

import posthog from 'posthog-js'
import { PostHogProvider as PHProviderBase } from 'posthog-js/react'
import { useEffect, useState } from 'react'

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com'

export function PHProvider({ children }: { children: React.ReactNode }) {
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    if (!POSTHOG_KEY) return

    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      persistence: 'localStorage+cookie',
      autocapture: true,
      capture_pageview: true,
      capture_pageleave: true,
      loaded: () => setInitialized(true),
    })

    return () => {
      // PostHog handles its own cleanup
    }
  }, [])

  if (!POSTHOG_KEY || !initialized) {
    return <>{children}</>
  }

  return <PHProviderBase client={posthog}>{children}</PHProviderBase>
}
