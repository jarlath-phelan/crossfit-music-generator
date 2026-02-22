// Vercel Hobby plan allows up to 60s; backend pipeline needs ~30-40s
export const maxDuration = 60

export default function GenerateLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
