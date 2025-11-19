'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

interface WorkoutFormProps {
  onSubmit: (workoutText: string) => Promise<void>
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (workoutText.trim()) {
      await onSubmit(workoutText)
    }
  }

  const loadExample = (example: string) => {
    setWorkoutText(example)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Describe Your Workout</CardTitle>
        <CardDescription>
          Enter your CrossFit workout description to generate a matching playlist
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
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
          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isLoading || !workoutText.trim()}
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

