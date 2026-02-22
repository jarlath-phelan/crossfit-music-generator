export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { getAppSettings } from '@/app/actions'
import { SettingsForm } from '@/components/settings-form'
import { PageHeader } from '@/components/page-header'

export default async function SettingsPage() {
  let session
  try {
    session = await auth.api.getSession({ headers: await headers() })
  } catch {
    redirect('/generate')
  }
  if (!session) redirect('/generate')

  const settings = await getAppSettings()

  return (
    <div>
      <PageHeader title="Settings" />
      <div className="container mx-auto px-4 max-w-5xl">
        <SettingsForm initialSettings={settings} />
      </div>
    </div>
  )
}
