'use client'

import { TabBar } from '@/components/tab-bar'
import { MiniPlayer } from '@/components/mini-player'
import { SpotifyMiniPlayerProvider, useSpotifyMiniPlayer } from '@/components/spotify-context'
import { PHProvider } from '@/components/posthog-provider'

function TabLayoutInner({ children }: { children: React.ReactNode }) {
  const { state: miniPlayerState } = useSpotifyMiniPlayer()

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <main className="pb-32">
        {children}
      </main>
      <TabBar
        miniPlayer={miniPlayerState?.currentTrack ? (
          <MiniPlayer
            currentTrack={miniPlayerState.currentTrack}
            isPlaying={miniPlayerState.isPlaying}
            onPlayPause={miniPlayerState.onPlayPause}
            onSkipNext={miniPlayerState.onSkipNext}
            position={miniPlayerState.position}
            duration={miniPlayerState.duration}
          />
        ) : undefined}
      />
    </div>
  )
}

export default function TabLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <PHProvider>
      <SpotifyMiniPlayerProvider>
        <TabLayoutInner>{children}</TabLayoutInner>
      </SpotifyMiniPlayerProvider>
    </PHProvider>
  )
}
