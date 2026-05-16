import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import FinanceLayoutClient from './FinanceLayoutClient'

export default async function FinanceLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile || (profile.role !== 'finance' && profile.role !== 'admin')) {
    redirect('/')
  }

  const { data: rateRow } = await supabase
    .from('exchange_rates')
    .select('taux_usd_htg')
    .order('updated_at', { ascending: false })
    .limit(1)
    .single()

  const taux = rateRow?.taux_usd_htg ?? 135

  return (
    <FinanceLayoutClient profile={profile} taux={taux}>
      {children}
    </FinanceLayoutClient>
  )
}
