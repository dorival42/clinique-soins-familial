import { createClient } from '@/lib/supabase/server'
import FinanceDashboardClient from './FinanceDashboardClient'
import { todayIso } from '@/lib/utils'

export default async function FinancePage() {
  const supabase = await createClient()
  const today = todayIso()

  const [rateRes, recRes, depRes, phaRes] = await Promise.all([
    supabase.from('exchange_rates').select('taux_usd_htg').order('updated_at', { ascending: false }).limit(1).single(),
    supabase.from('payments').select('*').eq('date_paiement', today).order('created_at', { ascending: false }),
    supabase.from('expenses').select('*').eq('date_depense', today).order('created_at', { ascending: false }),
    supabase.from('pharmacy_sales').select('*').eq('date_vente', today).order('created_at', { ascending: false }),
  ])

  const taux = rateRes.data?.taux_usd_htg ?? 135
  const recettes = recRes.data ?? []
  const depenses = depRes.data ?? []
  const pharmacie = phaRes.data ?? []

  const totalRec = recettes.reduce((s: number, r: { montant_htg: number }) => s + (r.montant_htg || 0), 0)
  const totalPha = pharmacie.reduce((s: number, r: { montant_htg: number }) => s + (r.montant_htg || 0), 0)
  const totalDep = depenses.reduce((s: number, r: { montant_htg: number }) => s + (r.montant_htg || 0), 0)

  return (
    <FinanceDashboardClient
      today={today}
      taux={taux}
      totalRec={totalRec}
      totalPha={totalPha}
      totalDep={totalDep}
      benefice={totalRec + totalPha - totalDep}
      recentes={{ recettes, depenses, pharmacie }}
    />
  )
}
