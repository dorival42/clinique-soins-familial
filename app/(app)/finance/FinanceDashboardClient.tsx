'use client'

import Link from 'next/link'
import { formatHTG, isoToFr } from '@/lib/utils'

interface Props {
  today: string
  taux: number
  totalRec: number
  totalPha: number
  totalDep: number
  benefice: number
  recentes: {
    recettes: Array<{ id: string; categorie_nom?: string; montant_htg: number; patient_id?: string }>
    depenses: Array<{ id: string; description: string; categorie_nom?: string; montant_htg: number }>
    pharmacie: Array<{ id: string; description: string; montant_htg: number }>
  }
}

const kpis = [
  { key: 'rec',  icon: '📥', label: 'Recettes',    color: '#2e7d32', bg: '#e8f5e9' },
  { key: 'pha',  icon: '💊', label: 'Pharmacie',   color: '#6a1b9a', bg: '#f3e5f5' },
  { key: 'dep',  icon: '📤', label: 'Dépenses',    color: '#c62828', bg: '#ffebee' },
  { key: 'ben',  icon: '💹', label: 'Bénéfice net',color: '#1565c0', bg: '#e3f2fd' },
]

export default function FinanceDashboardClient({ today, taux, totalRec, totalPha, totalDep, benefice, recentes }: Props) {
  const values: Record<string, number> = { rec: totalRec, pha: totalPha, dep: totalDep, ben: benefice }

  const allTx = [
    ...recentes.recettes.map(r => ({ type: 'g' as const, who: 'Patient', cat: r.categorie_nom ?? 'Recette', amt: r.montant_htg })),
    ...recentes.pharmacie.map(r => ({ type: 'p' as const, who: r.description, cat: 'Pharmacie', amt: r.montant_htg })),
    ...recentes.depenses.map(r => ({ type: 'r' as const, who: r.description, cat: r.categorie_nom ?? 'Dépense', amt: r.montant_htg })),
  ].sort((a, b) => b.amt - a.amt).slice(0, 8)

  return (
    <div className="animate-fadeIn">
      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #1a237e, #3949ab)',
        borderRadius: '16px',
        padding: '20px 22px',
        marginBottom: '16px',
        color: '#fff',
      }}>
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>
          Bonjour 👋
        </h2>
        <p style={{ margin: '4px 0 0', opacity: 0.75, fontSize: '13px' }}>
          {isoToFr(today)} — 1 USD = {taux} HTG
        </p>
      </div>

      {/* KPIs */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '10px',
        marginBottom: '16px',
      }} className="kpi-grid">
        {kpis.map(k => (
          <div key={k.key} style={{
            background: '#fff',
            borderRadius: '14px',
            padding: '16px 14px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.10)',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '22px', marginBottom: '6px' }}>{k.icon}</div>
            <div style={{
              fontSize: '18px',
              fontWeight: 800,
              color: k.key === 'ben' && benefice < 0 ? '#c62828' : k.color,
              lineHeight: 1,
            }}>
              {formatHTG(values[k.key])} HTG
            </div>
            <div style={{ fontSize: '10px', color: '#757575', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              {k.label}
            </div>
          </div>
        ))}
      </div>

      {/* Actions rapides */}
      <div style={{ fontSize: '12px', fontWeight: 700, color: '#757575', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '10px' }}>
        Actions rapides
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
        <Link href="/finance/recettes" style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '16px 14px', borderRadius: '14px',
          background: '#e8f5e9', color: '#2e7d32',
          textDecoration: 'none', fontSize: '14px', fontWeight: 600,
          boxShadow: '0 1px 4px rgba(0,0,0,0.10)',
        }}>
          <span style={{ fontSize: '22px' }}>📥</span>
          Nouvelle recette
        </Link>
        <Link href="/finance/depenses" style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '16px 14px', borderRadius: '14px',
          background: '#ffebee', color: '#c62828',
          textDecoration: 'none', fontSize: '14px', fontWeight: 600,
          boxShadow: '0 1px 4px rgba(0,0,0,0.10)',
        }}>
          <span style={{ fontSize: '22px' }}>📤</span>
          Nouvelle dépense
        </Link>
      </div>
      <Link href="/finance/pharmacie" style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '16px 14px', borderRadius: '14px',
        background: '#f3e5f5', color: '#6a1b9a',
        textDecoration: 'none', fontSize: '14px', fontWeight: 600,
        boxShadow: '0 1px 4px rgba(0,0,0,0.10)',
        marginBottom: '16px',
      }}>
        <span style={{ fontSize: '22px' }}>💊</span>
        Vente pharmacie
      </Link>

      {/* Transactions du jour */}
      <div style={{ fontSize: '12px', fontWeight: 700, color: '#757575', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '10px' }}>
        Activité du jour
      </div>
      <div style={{
        background: '#fff',
        borderRadius: '14px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.10)',
        overflow: 'hidden',
      }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #f0f2f5', fontWeight: 700, fontSize: '14px' }}>
          Transactions récentes
        </div>
        {allTx.length === 0 ? (
          <p style={{ padding: '24px', textAlign: 'center', color: '#757575', fontSize: '13px' }}>
            Aucune activité aujourd&apos;hui
          </p>
        ) : allTx.map((tx, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '12px 16px',
            borderBottom: i < allTx.length - 1 ? '1px solid #f0f2f5' : 'none',
          }}>
            <div style={{
              width: '10px', height: '10px', borderRadius: '50%', flexShrink: 0,
              background: tx.type === 'g' ? '#2e7d32' : tx.type === 'p' ? '#6a1b9a' : '#c62828',
            }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '13px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.who}</div>
              <div style={{ fontSize: '11px', color: '#757575', marginTop: '1px' }}>{tx.cat}</div>
            </div>
            <div style={{
              fontSize: '14px', fontWeight: 800, whiteSpace: 'nowrap',
              color: tx.type === 'g' ? '#2e7d32' : tx.type === 'p' ? '#6a1b9a' : '#c62828',
            }}>
              {tx.type === 'r' ? '-' : '+'} {formatHTG(tx.amt)} HTG
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @media (min-width: 600px) {
          .kpi-grid { grid-template-columns: repeat(4, 1fr) !important; }
        }
      `}</style>
    </div>
  )
}
