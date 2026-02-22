'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Camera, Type, Zap, Pencil, RotateCcw } from 'lucide-react'
import { ImageUpload } from '@/components/image-upload'
import { TogglePills } from '@/components/ui/toggle-pills'

type InputMode = 'photo' | 'text'

interface WorkoutFormProps {
  onSubmit: (workoutText: string, imageBase64?: string, imageMediaType?: string) => Promise<void>
  isLoading: boolean
  /** When true, show collapsed single-line view with Edit/New buttons */
  isCompact?: boolean
  /** The workout text to show in compact mode */
  compactText?: string
  /** Called when user clicks Edit in compact mode */
  onEdit?: () => void
  /** Called when user clicks New Workout in compact mode */
  onNewWorkout?: () => void
  /** Pre-populate the textarea with this text (e.g. from onboarding) */
  initialText?: string
  /** Called when the internal text value changes (for parent state sync) */
  onTextChange?: (text: string) => void
}

const NAMED_WODS: { name: string; text: string }[] = [
  { name: 'Fran', text: '21-15-9 thrusters (95/65 lbs) and pull-ups. ~5-10 min.' },
  { name: 'Murph', text: '1 mile run, 100 pull-ups, 200 push-ups, 300 squats, 1 mile run. ~35-60 min.' },
  { name: 'Grace', text: '30 clean and jerks for time (135/95 lbs). ~3-8 min.' },
  { name: 'DT', text: '5 rounds: 12 deadlifts, 9 hang cleans, 6 push jerks (155/105 lbs). ~8-15 min.' },
  { name: 'Cindy', text: '20 min AMRAP: 5 pull-ups, 10 push-ups, 15 squats.' },
  { name: 'Full Class', text: '60 min class: 10 min warm-up (3 rounds: 200m jog, 10 air squats, 10 PVC pass-throughs), 20 min strength (back squat 5x5), 25 min AMRAP (5 pull-ups, 10 push-ups, 15 squats), 5 min cooldown stretching' },
]

const INPUT_MODE_OPTIONS = [
  { label: 'Text', value: 'text', icon: <Type className="h-3.5 w-3.5" /> },
  { label: 'Photo', value: 'photo', icon: <Camera className="h-3.5 w-3.5" /> },
]

export function WorkoutForm({
  onSubmit,
  isLoading,
  isCompact = false,
  compactText,
  onEdit,
  onNewWorkout,
  initialText,
  onTextChange,
}: WorkoutFormProps) {
  const [workoutText, setWorkoutTextInternal] = useState(initialText ?? '')
  const [inputMode, setInputMode] = useState<InputMode>('text')

  const setWorkoutText = (text: string) => {
    setWorkoutTextInternal(text)
    onTextChange?.(text)
  }

  useEffect(() => {
    if (initialText) setWorkoutText(initialText)
  }, [initialText])
  const [imageBase64, setImageBase64] = useState<string | null>(null)
  const [imageMediaType, setImageMediaType] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (inputMode === 'photo' && imageBase64 && imageMediaType) {
      await onSubmit(workoutText, imageBase64, imageMediaType)
    } else if (inputMode === 'text' && workoutText.trim()) {
      await onSubmit(workoutText)
    }
  }

  const loadExample = (example: string) => {
    setWorkoutText(example)
    setInputMode('text')
  }

  const handleImageCapture = (base64: string, mediaType: string) => {
    setImageBase64(base64)
    setImageMediaType(mediaType)
  }

  const handleImageClear = () => {
    setImageBase64(null)
    setImageMediaType(null)
  }

  const canSubmit =
    (inputMode === 'text' && workoutText.trim()) ||
    (inputMode === 'photo' && imageBase64)

  // Compact mode: single-line showing workout text with Edit/New buttons
  if (isCompact && compactText) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface-1)] px-3 py-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-[var(--muted)] truncate">{compactText}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {onEdit && (
            <Button type="button" variant="outline" onClick={onEdit}>
              <Pencil className="h-3 w-3 mr-1.5" />
              Edit
            </Button>
          )}
          {onNewWorkout && (
            <Button type="button" variant="outline" onClick={onNewWorkout}>
              <RotateCcw className="h-3 w-3 mr-1.5" />
              New
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Input mode toggle */}
      <div className="flex items-center justify-between">
        <TogglePills
          options={INPUT_MODE_OPTIONS}
          value={inputMode}
          onChange={(v) => setInputMode(v as InputMode)}
          size="sm"
        />
      </div>

      {/* Photo input */}
      {inputMode === 'photo' && (
        <div className="space-y-3">
          <ImageUpload
            onImageCapture={handleImageCapture}
            onClear={handleImageClear}
            disabled={isLoading}
            hasImage={!!imageBase64}
          />
          <div>
            <label htmlFor="photo-context" className="text-sm font-medium text-[var(--muted)]">
              Additional context (optional)
            </label>
            <Textarea
              id="photo-context"
              value={workoutText}
              onChange={(e) => setWorkoutText(e.target.value)}
              placeholder="e.g. This is a 20-minute class, focus on the main WOD"
              className="min-h-[60px] text-sm mt-1 rounded-lg border-[var(--border)]"
              disabled={isLoading}
              maxLength={1000}
            />
          </div>
        </div>
      )}

      {/* Text input */}
      {inputMode === 'text' && (
        <div className="space-y-3">
          <Textarea
            id="workout-input"
            value={workoutText}
            onChange={(e) => setWorkoutText(e.target.value)}
            placeholder="Describe your workout..."
            className="min-h-[100px] text-base rounded-lg border-[var(--border)] placeholder:text-[var(--muted)]/60"
            disabled={isLoading}
            maxLength={5000}
            aria-describedby="workout-hint"
            aria-required="true"
          />
          <p id="workout-hint" className="sr-only">
            Tip: Include durations for better results.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {NAMED_WODS.map((wod) => (
              <button
                key={wod.name}
                type="button"
                onClick={() => loadExample(wod.text)}
                disabled={isLoading}
                className="text-sm px-4 py-2.5 rounded-full border border-[var(--border)] bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--foreground)]/30 transition-colors font-medium min-h-[44px]"
                aria-label={`Load ${wod.name} workout`}
              >
                {wod.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Generate button */}
      <Button
        type="submit"
        variant="accent"
        className="w-full h-11 text-base"
        disabled={isLoading || !canSubmit}
        aria-busy={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            Generating...
          </>
        ) : (
          <>
            <Zap className="mr-2 h-4 w-4" aria-hidden="true" />
            Generate Playlist
          </>
        )}
      </Button>
    </form>
  )
}
