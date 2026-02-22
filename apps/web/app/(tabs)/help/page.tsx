'use client'

import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { ChevronDown, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface FAQItem {
  question: string
  answer: string
}

const FAQ_SECTIONS: { title: string; items: FAQItem[] }[] = [
  {
    title: 'Getting Started',
    items: [
      {
        question: 'What is Crank?',
        answer:
          'Crank generates playlists matched to your CrossFit workout. Paste your WOD, pick a genre, and get tracks that match the intensity of each phase — warm-up, main work, and cooldown.',
      },
      {
        question: 'How do I create a playlist?',
        answer:
          'Go to the Generate tab, type or paste your workout (or tap a named WOD like Fran or Murph), pick a genre, and tap Generate. The app will analyze your workout and find tracks that match each phase.',
      },
      {
        question: 'What are the named WOD buttons?',
        answer:
          'These are popular CrossFit benchmark workouts pre-loaded for convenience. Tap one to instantly fill in the workout text. Fran is 21-15-9 thrusters and pull-ups, Murph is a mile run + 100 pull-ups + 200 push-ups + 300 squats + mile run, and so on.',
      },
      {
        question: 'Can I use a photo of the whiteboard?',
        answer:
          'Yes! Switch to Photo mode using the toggle at the top of the form. Take a photo of your gym\'s whiteboard and the app will read the workout from the image.',
      },
    ],
  },
  {
    title: 'Music & BPM',
    items: [
      {
        question: 'What does BPM mean?',
        answer:
          'BPM stands for Beats Per Minute — how fast a song\'s tempo is. Higher BPM means a faster, more energetic track. Crank matches track BPM to your workout intensity: warm-ups get 100-120 BPM, high-intensity phases get 145-175 BPM.',
      },
      {
        question: 'What does the intensity chart show?',
        answer:
          'The chart at the top of your results shows how workout intensity changes over time. The curve goes up for hard phases and down for rest. The colored bars at the bottom represent each phase. "PEAK" marks the highest intensity point.',
      },
      {
        question: 'Why are tracks grouped by phase?',
        answer:
          'Your workout has different phases (warm-up, strength, metcon, cooldown) at different intensities. Crank picks tracks that match each phase — chill for warm-up, intense for the WOD, mellow for cooldown.',
      },
      {
        question: 'What genres are available?',
        answer:
          'Rock, Hip-Hop, EDM, Metal, Pop, Punk, Country, and Indie. Pick the one that fits your vibe — the same workout will get completely different playlists depending on genre.',
      },
    ],
  },
  {
    title: 'Spotify & Playback',
    items: [
      {
        question: 'Do I need Spotify to use Crank?',
        answer:
          'No — you can generate playlists without a Spotify account. But to play tracks in the app, you need Spotify Premium. Free Spotify users can still tap the Spotify icon on any track to open it in the Spotify app.',
      },
      {
        question: 'Why does playback require Spotify Premium?',
        answer:
          'Crank uses the Spotify Web Playback SDK to stream music directly in your browser. This SDK is only available to Spotify Premium subscribers — it\'s a Spotify restriction, not ours.',
      },
      {
        question: 'How do I play the whole playlist?',
        answer:
          'Sign in with Spotify, then tap the "Play All" button at the top of the track list. You can also tap any individual track to start playing from that point. Use skip and previous in the mini-player at the bottom.',
      },
      {
        question: 'What is "Export to Spotify"?',
        answer:
          'This creates a private playlist in your actual Spotify account with all the tracks. You can then play it from the Spotify app on any device — phone, speaker, car, wherever.',
      },
    ],
  },
  {
    title: 'Feedback & Personalization',
    items: [
      {
        question: 'What do the thumbs up/down buttons do?',
        answer:
          'Thumbs up boosts that artist in future playlists — you\'ll see more from them. Thumbs down hides that specific track so it won\'t appear again. Your feedback makes each playlist better over time.',
      },
      {
        question: 'How do I save a playlist?',
        answer:
          'Tap "Save to Library" at the bottom of the results. You\'ll find it in the Library tab. You need to be signed in to save playlists.',
      },
      {
        question: 'What does the Remix button do?',
        answer:
          'Remix re-generates the playlist using the same workout but picks different tracks. Use it when you want the same workout structure but different music.',
      },
    ],
  },
]

function FAQAccordion({ item }: { item: FAQItem }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="border-b border-[var(--border)] last:border-b-0">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between gap-3 py-4 text-left text-sm font-medium text-[var(--foreground)] hover:text-[var(--accent)] transition-colors min-h-[44px]"
        aria-expanded={isOpen}
      >
        <span>{item.question}</span>
        <ChevronDown
          className={cn(
            'h-4 w-4 flex-shrink-0 text-[var(--muted)] transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </button>
      {isOpen && (
        <div className="pb-4 text-sm text-[var(--muted)] leading-relaxed">
          {item.answer}
        </div>
      )}
    </div>
  )
}

export default function HelpPage() {
  const router = useRouter()

  const handleReplayOnboarding = () => {
    localStorage.removeItem('crank_onboarding_complete')
    router.push('/generate')
  }

  return (
    <div>
      <PageHeader title="Help" />
      <div className="container mx-auto px-4 max-w-2xl space-y-6 pb-8">
        <p className="text-sm text-[var(--muted)]">
          Everything you need to know about using Crank to generate workout playlists.
        </p>

        {FAQ_SECTIONS.map((section) => (
          <div key={section.title}>
            <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--muted)] mb-2">
              {section.title}
            </h2>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-1)] px-4">
              {section.items.map((item) => (
                <FAQAccordion key={item.question} item={item} />
              ))}
            </div>
          </div>
        ))}

        {/* Replay onboarding */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Replay tutorial</p>
              <p className="text-xs text-[var(--muted)]">See the intro walkthrough again</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleReplayOnboarding}>
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              Replay
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
