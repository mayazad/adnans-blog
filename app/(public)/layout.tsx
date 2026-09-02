import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import Masthead from '@/components/public/Masthead'
import Footer from '@/components/public/Footer'

export const metadata: Metadata = {
  title: "Adnan's Blog — Field notes on artificial intelligence",
}

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let profile = null
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, username, avatar_url, role')
      .eq('id', user.id)
      .single()
    profile = data
  }

  return (
    <>
      <Masthead user={user} profile={profile} />
      <main className="page-enter">{children}</main>
      <Footer />
    </>
  )
}
