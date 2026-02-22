'use client'

import { useState } from 'react'
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
}

const EXAMPLE_WORKOUTS = [
  '21-15-9 thrusters and pull-ups',
  'AMRAP 20: 5 pull-ups, 10 push-ups, 15 squats',
  'EMOM 12: 10 burpees',
  '5 RFT: 400m run, 15 OHS, 15 pull-ups',
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
}: WorkoutFormProps) {
  const [workoutText, setWorkoutText] = useState('')
  const [inputMode, setInputMode] = useState<InputMode>('text')
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
      <div className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-white px-3 py-2">
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
          <div className="flex flex-wrap gap-1.5">
            {EXAMPLE_WORKOUTS.map((example, i) => (
              <button
                key={i}
                type="button"
                onClick={() => loadExample(example)}
                disabled={isLoading}
                className="text-sm px-3 py-2 rounded-full border border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--foreground)]/30 transition-colors"
                aria-label={`Load example: ${example}`}
              >
                {example}
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
