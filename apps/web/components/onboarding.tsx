'use client'

import { useState, useEffect } from 'react'
import { Zap, Music, User } from 'lucide-react'
import { Button } from '@/components/ui/button'

const STORAGE_KEY = 'crank_onboarding_complete'

interface OnboardingProps {
  onComplete: () => void
  onLoadExample: (text: string) => void
}

const EXAMPLE_WORKOUT = '20 min AMRAP: 5 pull-ups, 10 push-ups, 15 squats.'

const STEPS = [
  {
    icon: Zap,
    title: 'Welcome to Crank',
    description:
      'Snap your whiteboard or paste your workout. Get a playlist that peaks when your workout peaks.',
  },
  {
    icon: Music,
    title: 'Try it now',
    description:
      'We\'ll load an example workout for you. Hit Generate to see the magic.',
  },
  {
    icon: User,
    title: 'Make it yours',
    description:
      'Sign in with Spotify to play, save, and export your playlists.',
  },
]

export function Onboarding({ onComplete, onLoadExample }: OnboardingProps) {
  const [step, setStep] = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const done = localStorage.getItem(STORAGE_KEY)
    if (!done) setVisible(true)
  }, [])

  if (!visible) return null

  const handleNext = () => {
    if (step === 1) {
      onLoadExample(EXAMPLE_WORKOUT)
    }
    if (step < STEPS.length - 1) {
      setStep(step + 1)
    } else {
      localStorage.setItem(STORAGE_KEY, 'true')
      setVisible(false)
      onComplete()
    }
  }

  const handleSkip = () => {
    localStorage.setItem(STORAGE_KEY, 'true')
    setVisible(false)
    onComplete()
  }

  const current = STEPS[step]
  const Icon = current.icon

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl space-y-4 animate-fade-slide-up">
        <div className="flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--accent)]/10">
            <Icon className="h-7 w-7 text-[var(--accent)]" />
          </div>
        </div>
        <h2 className="text-xl font-bold text-center">{current.title}</h2>
        <p className="text-sm text-[var(--muted)] text-center leading-relaxed">
          {current.description}
        </p>

        {/* Step indicators */}
        <div className="flex justify-center gap-1.5">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === step
                  ? 'w-6 bg-[var(--accent)]'
                  : 'w-1.5 bg-[var(--border)]'
              }`}
            />
          ))}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={handleSkip}>
            Skip
          </Button>
          <Button variant="accent" className="flex-1" onClick={handleNext}>
            {step < STEPS.length - 1 ? 'Next' : 'Get Started'}
          </Button>
        </div>
      </div>
    </div>
  )
}
