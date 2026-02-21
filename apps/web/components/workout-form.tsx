'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Camera, Type } from 'lucide-react'
import { ImageUpload } from '@/components/image-upload'

type InputMode = 'photo' | 'text'

interface WorkoutFormProps {
  onSubmit: (workoutText: string, imageBase64?: string, imageMediaType?: string) => Promise<void>
  isLoading: boolean
}

const EXAMPLE_WORKOUTS = [
  '21-15-9 thrusters 95lbs and pull-ups',
  'AMRAP 20 minutes: 5 pull-ups, 10 push-ups, 15 air squats',
  'EMOM 12 minutes: 10 burpees',
  '5 rounds for time: 400m run, 15 overhead squats, 15 pull-ups',
]

export function WorkoutForm({ onSubmit, isLoading }: WorkoutFormProps) {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Describe Your Workout</CardTitle>
        <CardDescription>
          Snap a photo of the whiteboard or type your workout description
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Input mode toggle */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant={inputMode === 'photo' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setInputMode('photo')}
              disabled={isLoading}
              className="flex-1"
            >
              <Camera className="mr-2 h-4 w-4" />
              Take Photo
            </Button>
            <Button
              type="button"
              variant={inputMode === 'text' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setInputMode('text')}
              disabled={isLoading}
              className="flex-1"
            >
              <Type className="mr-2 h-4 w-4" />
              Type Workout
            </Button>
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
                <label htmlFor="photo-context" className="text-sm font-medium">
                  Additional context (optional)
                </label>
                <Textarea
                  id="photo-context"
                  value={workoutText}
                  onChange={(e) => setWorkoutText(e.target.value)}
                  placeholder="e.g. This is a 20-minute class, focus on the main WOD"
                  className="min-h-[60px] text-sm mt-1"
                  disabled={isLoading}
                  maxLength={1000}
                />
              </div>
            </div>
          )}

          {/* Text input */}
          {inputMode === 'text' && (
            <div className="space-y-2">
              <label htmlFor="workout-input" className="text-sm font-medium">
                Workout Description
              </label>
              <Textarea
                id="workout-input"
                value={workoutText}
                onChange={(e) => setWorkoutText(e.target.value)}
                placeholder="21-15-9 thrusters 95lbs and pull-ups"
                className="min-h-[120px] text-base"
                disabled={isLoading}
                maxLength={5000}
                aria-describedby="workout-hint"
                aria-required="true"
              />
              <p id="workout-hint" className="text-xs text-muted-foreground">
                Enter your CrossFit workout description (max 5000 characters). {workoutText.length}/5000
              </p>
              <div className="flex flex-wrap gap-2">
                <p className="text-sm text-muted-foreground w-full">Examples:</p>
                {EXAMPLE_WORKOUTS.map((example, i) => (
                  <Button
                    key={i}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => loadExample(example)}
                    disabled={isLoading}
                    className="text-xs"
                    aria-label={`Load example workout: ${example}`}
                  >
                    {example}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isLoading || !canSubmit}
            aria-busy={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                Generating Playlist...
              </>
            ) : (
              'Generate Playlist'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
