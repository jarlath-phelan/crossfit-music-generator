export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { getProfile } from '@/app/actions'
import { ProfileForm } from '@/components/profile-form'
import { PageHeader } from '@/components/page-header'

export default async function ProfilePage() {
  let session
  try {
    session = await auth.api.getSession({ headers: await headers() })
  } catch (error) {
    console.error('[profile] Session check failed:', error instanceof Error ? error.message : error)
    redirect('/generate')
  }
  if (!session) redirect('/generate')

  const profile = await getProfile()

  return (
    <div>
      <PageHeader title="Profile" />
      <div className="container mx-auto px-4 max-w-5xl">
        <ProfileForm initialData={profile} />
      </div>
    </div>
  )
}
