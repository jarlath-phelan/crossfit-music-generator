import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { getProfile } from '@/app/actions'
import { ProfileForm } from '@/components/profile-form'

export default async function ProfilePage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/generate')

  const profile = await getProfile()

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl">
      <ProfileForm initialData={profile} />
    </div>
  )
}
