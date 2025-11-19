'use client'

import type { WorkoutStructure, Phase } from '@crossfit-playlist/shared'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, Clock } from 'lucide-react'

interface WorkoutDisplayProps {
  workout: WorkoutStructure
}

const INTENSITY_COLORS: Record<Phase['intensity'], string> = {
  warm_up: 'bg-blue-100 text-blue-800 border-blue-200',
  low: 'bg-green-100 text-green-800 border-green-200',
  moderate: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  very_high: 'bg-red-100 text-red-800 border-red-200',
  cooldown: 'bg-purple-100 text-purple-800 border-purple-200',
}

const INTENSITY_LABELS: Record<Phase['intensity'], string> = {
  warm_up: 'Warm Up',
  low: 'Low',
  moderate: 'Moderate',
  high: 'High',
  very_high: 'Very High',
  cooldown: 'Cooldown',
}

export function WorkoutDisplay({ workout }: WorkoutDisplayProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" aria-hidden="true" />
          {workout.workout_name}
        </CardTitle>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" aria-hidden="true" />
          <span>Total Duration: {workout.total_duration_min} minutes</span>
        </div>
      </CardHeader>
      <CardContent>
        <div role="list" aria-label={`Workout phases, ${workout.phases.length} total`}>
          {workout.phases.map((phase, index) => (
            <div
              key={index}
              role="listitem"
              className="flex items-center justify-between p-4 rounded-lg border bg-card mb-3 last:mb-0"
            >
              <div className="flex-1">
                <div className="font-semibold">{phase.name}</div>
                <div className="text-sm text-muted-foreground">
                  {phase.duration_min} min · BPM {phase.bpm_range[0]}-{phase.bpm_range[1]}
                </div>
              </div>
              <div
                className={`px-3 py-1 rounded-full text-xs font-medium border ${
                  INTENSITY_COLORS[phase.intensity]
                }`}
                aria-label={`Intensity: ${INTENSITY_LABELS[phase.intensity]}`}
              >
                {INTENSITY_LABELS[phase.intensity]}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

