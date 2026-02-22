export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { listPlaylists } from '@/app/actions'
import { PlaylistList } from '@/components/playlist-list'
import { PageHeader } from '@/components/page-header'

export default async function LibraryPage() {
  let session
  try {
    session = await auth.api.getSession({ headers: await headers() })
  } catch (error) {
    console.error('[library] Session check failed:', error instanceof Error ? error.message : error)
    redirect('/generate')
  }
  if (!session) redirect('/generate')

  const playlists = await listPlaylists()

  return (
    <div>
      <PageHeader title="Library" />
      <div className="container mx-auto px-4 max-w-5xl">
        <PlaylistList playlists={playlists} />
      </div>
    </div>
  )
}
