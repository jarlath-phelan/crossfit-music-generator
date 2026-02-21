import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { getProfile } from '@/app/actions'
import { ProfileForm } from '@/components/profile-form'

export default async function ProfilePage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/')

  const profile = await getProfile()

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <h1 className="text-3xl font-bold mb-2">Music Preferences</h1>
        <p className="text-muted-foreground mb-8">
          Customize how playlists are generated for your workouts.
        </p>
        <ProfileForm initialData={profile} />
      </div>
    </main>
  )
}
