import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AppLayout from '@/components/shared/AppLayout'

export default async function DoctorLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()

  if (!profile || (profile.role !== 'doctor' && profile.role !== 'admin')) {
    redirect('/')
  }

  return (
    <AppLayout role={profile.role} userName={profile.full_name} section="doctor">
      {children}
    </AppLayout>
  )
}
