'use client'

import { useState, useEffect } from 'react'
import { Zap, Music, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ArtistPickerGrid } from './artist-picker-grid'
import { ArtistPickerSwipe } from './artist-picker-swipe'

const STORAGE_KEY = 'crank_onboarding_complete'

interface OnboardingProps {
  onComplete: () => void
  onLoadExample: (text: string) => void
  onArtistsSelected?: (artists: string[]) => void
  onboardingStyle?: string
}

const EXAMPLE_WORKOUT = '20 min AMRAP: 5 pull-ups, 10 push-ups, 15 squats.'

const STEPS = [
  {
    icon: Zap,
    title: 'This is Crank',
    description:
      'Your WOD deserves a soundtrack. Paste it, snap it, or pick a classic \u2014 we handle the rest.',
  },
  {
    icon: Music,
    title: 'See it in action',
    description:
      'We\'ll load a workout. Hit Generate and watch Crank build your playlist in seconds.',
  },
  {
    icon: User,
    title: 'Own your sound',
    description:
      'Connect Spotify to stream, save, and export. Your gym, your music, your rules.',
  },
]

export function Onboarding({ onComplete, onLoadExample, onArtistsSelected, onboardingStyle = 'grid' }: OnboardingProps) {
  const [step, setStep] = useState(0)
  const [showArtistPicker, setShowArtistPicker] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const done = localStorage.getItem(STORAGE_KEY)
    if (!done) setVisible(true)
  }, [])

  if (!visible) return null

  const finishOnboarding = () => {
    localStorage.setItem(STORAGE_KEY, 'true')
    setVisible(false)
    onComplete()
  }

  const handleNext = () => {
    if (step === 1) {
      onLoadExample(EXAMPLE_WORKOUT)
    }
    if (step < STEPS.length - 1) {
      setStep(step + 1)
    } else {
      // After last info step, show artist picker
      setShowArtistPicker(true)
    }
  }

  const handleSkip = () => {
    finishOnboarding()
  }

  const handleArtistsSelected = (artists: string[]) => {
    onArtistsSelected?.(artists)
    finishOnboarding()
  }

  // Show artist picker
  if (showArtistPicker) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
        <div className="bg-[var(--card)] rounded-2xl p-6 max-w-md w-full shadow-xl border border-[var(--border)] animate-fade-slide-up">
          {onboardingStyle === 'swipe' ? (
            <ArtistPickerSwipe
              onComplete={handleArtistsSelected}
              onSkip={finishOnboarding}
            />
          ) : (
            <ArtistPickerGrid
              onComplete={handleArtistsSelected}
              onSkip={finishOnboarding}
            />
          )}
        </div>
      </div>
    )
  }

  // Show info steps
  const current = STEPS[step]
  const Icon = current.icon

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-[var(--card)] rounded-2xl p-6 max-w-sm w-full shadow-xl space-y-4 animate-fade-slide-up border border-[var(--border)]">
        <div className="flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--accent)]/10">
            <Icon className="h-7 w-7 text-[var(--accent)]" />
          </div>
        </div>
        <h2 className="text-xl font-bold text-center">{current.title}</h2>
        <p className="text-sm text-[var(--muted)] text-center leading-relaxed">
          {current.description}
        </p>

        <div className="flex justify-center gap-1.5">
          {[...STEPS, { title: 'artists' }].map((_, i) => (
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
            {step < STEPS.length - 1 ? 'Next' : 'Pick artists'}
          </Button>
        </div>
      </div>
    </div>
  )
}
