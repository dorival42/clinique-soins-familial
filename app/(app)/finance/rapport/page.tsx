'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatHTG, todayIso } from '@/lib/utils'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

type Period = 'today' | 'week' | 'month' | 'year' | 'custom'

function getRange(period: Period, customA: string, customB: string): [string, string] {
  const t = todayIso()
  if (period === 'today') return [t, t]
  if (period === 'week') {
    const d = new Date(t); const day = d.getDay() || 7; d.setDate(d.getDate() - day + 1)
    return [d.toISOString().split('T')[0], t]
  }
  if (period === 'month') return [t.slice(0, 7) + '-01', t]
  if (period === 'year') return [t.slice(0, 4) + '-01-01', t]
  return [customA || t, customB || t]
}

const PERIOD_LABELS = [
  { key: 'today', label: "Aujourd'hui" },
  { key: 'week', label: 'Cette semaine' },
  { key: 'month', label: 'Ce mois' },
  { key: 'year', label: 'Cette année' },
  { key: 'custom', label: 'Personnalisé' },
]

const COLORS_REC = ['#2e7d32', '#43a047', '#66bb6a', '#81c784', '#a5d6a7']
const COLORS_PHA = ['#6a1b9a', '#8e24aa', '#ab47bc', '#ce93d8', '#e1bee7']
const COLORS_DEP = ['#c62828', '#e53935', '#ef5350', '#e57373', '#ef9a9a']

export default function RapportPage() {
  const [period, setPeriod] = useState<Period>('today')
  const [customA, setCustomA] = useState(todayIso())
  const [customB, setCustomB] = useState(todayIso())
  const [taux, setTaux] = useState(135)
  const [data, setData] = useState<{
    totalRec: number; totalPha: number; totalDep: number; benefice: number
    recByCat: Record<string, number>; phaByCat: Record<string, number>; depByCat: Record<string, number>
    chartData: Array<{ date: string; Recettes: number; Pharmacie: number; Dépenses: number }>
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const loadReport = useCallback(async () => {
    setLoading(true)
    const [a, b] = getRange(period, customA, customB)

    const [rateRes, recRes, depRes, phaRes] = await Promise.all([
      supabase.from('exchange_rates').select('taux_usd_htg').order('updated_at', { ascending: false }).limit(1).single(),
      supabase.from('payments').select('date_paiement, categorie_nom, montant_htg').gte('date_paiement', a).lte('date_paiement', b),
      supabase.from('expenses').select('date_depense, categorie_nom, montant_htg').gte('date_depense', a).lte('date_depense', b),
      supabase.from('pharmacy_sales').select('date_vente, description, montant_htg').gte('date_vente', a).lte('date_vente', b),
    ])

    const t = rateRes.data?.taux_usd_htg ?? 135
    setTaux(t)

    const rec = recRes.data ?? []
    const dep = depRes.data ?? []
    const pha = phaRes.data ?? []

    const totalRec = rec.reduce((s, r) => s + r.montant_htg, 0)
    const totalDep = dep.reduce((s, r) => s + r.montant_htg, 0)
    const totalPha = pha.reduce((s, r) => s + r.montant_htg, 0)

    const groupBy = (rows: Array<{ montant_htg: number; [key: string]: string | number }>, key: string) => {
      const map: Record<string, number> = {}
      rows.forEach(r => {
        const k = (r[key] as string) || 'Autre'
        map[k] = (map[k] || 0) + r.montant_htg
      })
      return map
    }

    const byDate: Record<string, { rec: number; pha: number; dep: number }> = {}
    rec.forEach(r => { const d = r.date_paiement; if (!byDate[d]) byDate[d] = { rec: 0, pha: 0, dep: 0 }; byDate[d].rec += r.montant_htg })
    pha.forEach(r => { const d = r.date_vente; if (!byDate[d]) byDate[d] = { rec: 0, pha: 0, dep: 0 }; byDate[d].pha += r.montant_htg })
    dep.forEach(r => { const d = r.date_depense; if (!byDate[d]) byDate[d] = { rec: 0, pha: 0, dep: 0 }; byDate[d].dep += r.montant_htg })

    const chartData = Object.entries(byDate).sort(([a], [b]) => a.localeCompare(b)).map(([date, v]) => ({
      date: date.slice(5),
      Recettes: v.rec, Pharmacie: v.pha, Dépenses: v.dep,
    }))

    setData({
      totalRec, totalPha, totalDep, benefice: totalRec + totalPha - totalDep,
      recByCat: groupBy(rec as Array<{ montant_htg: number; categorie_nom: string }>, 'categorie_nom'),
      phaByCat: groupBy(pha as Array<{ montant_htg: number; description: string }>, 'description'),
      depByCat: groupBy(dep as Array<{ montant_htg: number; categorie_nom: string }>, 'categorie_nom'),
      chartData,
    })
    setLoading(false)
  }, [period, customA, customB])

  useEffect(() => { if (period !== 'custom') loadReport() }, [period, loadReport])

  return (
    <div className="animate-fadeIn">
      {/* Période */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', marginBottom: '14px', scrollbarWidth: 'none' }}>
        {PERIOD_LABELS.map(p => (
          <button key={p.key} onClick={() => setPeriod(p.key as Period)} style={{
            flexShrink: 0, padding: '7px 16px', borderRadius: '20px',
            border: `1.5px solid ${period === p.key ? '#3949ab' : '#e0e0e0'}`,
            background: period === p.key ? '#e3f2fd' : '#fff',
            color: period === p.key ? '#1a237e' : '#212121',
            fontSize: '13px', fontWeight: period === p.key ? 700 : 500,
            cursor: 'pointer', whiteSpace: 'nowrap',
          }}>
            {p.label}
          </button>
        ))}
      </div>

      {period === 'custom' && (
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '14px' }}>
          <label style={{ fontSize: '12px', color: '#757575', fontWeight: 600 }}>Du</label>
          <input type="date" value={customA} onChange={e => setCustomA(e.target.value)} style={inputStyle} />
          <label style={{ fontSize: '12px', color: '#757575', fontWeight: 600 }}>au</label>
          <input type="date" value={customB} onChange={e => setCustomB(e.target.value)} style={inputStyle} />
          <button onClick={loadReport} style={{ padding: '10px 18px', background: '#1a237e', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>
            Filtrer
          </button>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
          <div style={{ width: '32px', height: '32px', border: '3px solid #e0e0e0', borderTopColor: '#3949ab', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        </div>
      ) : data ? (
        <>
          {/* KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '16px' }} className="s4">
            {[
              { label: 'Recettes', val: data.totalRec, color: '#2e7d32' },
              { label: 'Pharmacie', val: data.totalPha, color: '#6a1b9a' },
              { label: 'Dépenses', val: data.totalDep, color: '#c62828' },
              { label: 'Bénéfice', val: data.benefice, color: data.benefice >= 0 ? '#1565c0' : '#c62828' },
            ].map(k => (
              <div key={k.label} style={{ background: '#fff', borderRadius: '12px', padding: '14px 10px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                <div style={{ fontSize: '15px', fontWeight: 800, color: k.color }}>{formatHTG(k.val)} HTG</div>
                <div style={{ fontSize: '10px', color: '#757575', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>{k.label}</div>
                <div style={{ fontSize: '10px', color: '#9e9e9e', marginTop: '2px' }}>≈ {(k.val / taux).toFixed(0)} USD</div>
              </div>
            ))}
          </div>

          {/* Bar chart */}
          {data.chartData.length > 0 && (
            <div style={{ background: '#fff', borderRadius: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.10)', marginBottom: '14px', overflow: 'hidden' }}>
              <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid #f0f2f5', fontWeight: 700, fontSize: '14px' }}>
                📈 Évolution Recettes / Pharmacie / Dépenses
              </div>
              <div style={{ padding: '14px', height: '260px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.chartData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={v => formatHTG(v)} width={70} />
                    <Tooltip formatter={(v: number) => formatHTG(v) + ' HTG'} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="Recettes" fill="#2e7d32" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="Pharmacie" fill="#6a1b9a" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="Dépenses" fill="#c62828" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Pie charts */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
            {[
              { title: '📥 Recettes par catégorie', data: data.recByCat, colors: COLORS_REC },
              { title: '💊 Pharmacie par produit', data: data.phaByCat, colors: COLORS_PHA },
              { title: '📤 Dépenses par catégorie', data: data.depByCat, colors: COLORS_DEP },
            ].map(chart => {
              const entries = Object.entries(chart.data).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1])
              const max = entries[0]?.[1] || 1
              return (
                <div key={chart.title} style={{ background: '#fff', borderRadius: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.10)', overflow: 'hidden' }}>
                  <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid #f0f2f5', fontWeight: 700, fontSize: '13px' }}>{chart.title}</div>
                  {entries.length === 0 ? (
                    <p style={{ padding: '24px', textAlign: 'center', color: '#757575', fontSize: '13px' }}>Aucune donnée</p>
                  ) : (
                    <>
                      <div style={{ height: '180px', padding: '10px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={entries.map(([name, value]) => ({ name, value }))} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2} dataKey="value">
                              {entries.map((_, i) => <Cell key={i} fill={chart.colors[i % chart.colors.length]} />)}
                            </Pie>
                            <Tooltip formatter={(v: number) => formatHTG(v) + ' HTG'} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div style={{ padding: '0 16px 14px' }}>
                        {entries.slice(0, 5).map(([cat, val], i) => (
                          <div key={cat} style={{ marginBottom: '10px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                              <span style={{ fontSize: '12px', fontWeight: 500, color: chart.colors[i % chart.colors.length] }}>{cat}</span>
                              <span style={{ fontSize: '12px', fontWeight: 700 }}>{formatHTG(val)} HTG</span>
                            </div>
                            <div style={{ background: '#f0f2f5', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
                              <div style={{ height: '6px', borderRadius: '4px', background: chart.colors[i % chart.colors.length], width: `${Math.round(val / max * 100)}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </>
      ) : null}

      <style>{`
        @media (min-width: 600px) { .s4 { grid-template-columns: repeat(4, 1fr) !important; } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  padding: '10px 12px', border: '1.5px solid #e0e0e0',
  borderRadius: '10px', fontSize: '14px', outline: 'none', flex: 1, minWidth: '130px',
}
