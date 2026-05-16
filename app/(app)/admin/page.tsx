import { createClient } from '@/lib/supabase/server'
import { todayIso, formatHTG, isoToFr } from '@/lib/utils'
import Link from 'next/link'

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const today = todayIso()

  const [
    patientsCount, doctorsCount, financeCount,
    recRes, depRes, phaRes,
    alertsRes, recentLogsRes, openReportsRes,
  ] = await Promise.all([
    supabase.from('patients').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'doctor'),
    supabase.from('payments').select('montant_htg').gte('date_paiement', today.slice(0, 7) + '-01'),
    supabase.from('payments').select('montant_htg').eq('date_paiement', today),
    supabase.from('expenses').select('montant_htg').eq('date_depense', today),
    supabase.from('pharmacy_sales').select('montant_htg').eq('date_vente', today),
    supabase.from('business_alerts').select('*').limit(10),
    supabase.from('audit_logs').select('*, profile:profiles(full_name, role)').order('created_at', { ascending: false }).limit(8),
    supabase.from('error_reports').select('*', { count: 'exact', head: true }).eq('status', 'open'),
  ])

  const totalRec = (recRes.data ?? []).reduce((s: number, r: { montant_htg: number }) => s + r.montant_htg, 0)
  const todayRec = (depRes.data ?? []).length > 0 ? (recRes.data ?? []).filter((r: { date_paiement?: string; montant_htg: number }) => r.date_paiement === today).reduce((s: number, r: { montant_htg: number }) => s + r.montant_htg, 0) : 0
  const todayDep = (depRes.data ?? []).reduce((s: number, r: { montant_htg: number }) => s + r.montant_htg, 0)
  const todayPha = (phaRes.data ?? []).reduce((s: number, r: { montant_htg: number }) => s + r.montant_htg, 0)
  const alerts = alertsRes.data ?? []
  const logs = recentLogsRes.data ?? []
  const openReports = openReportsRes.count ?? 0

  const alertColors = {
    SERVICE_SANS_PAIEMENT: { bg: '#ffebee', color: '#c62828', icon: '🔴', label: 'Service sans paiement' },
    PAIEMENT_SANS_SERVICE: { bg: '#fff3e0', color: '#e65100', icon: '🟠', label: 'Paiement sans service' },
  }

  return (
    <div className="animate-fadeIn">
      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #37474f, #546e7a)', borderRadius: '16px', padding: '20px 22px', marginBottom: '16px', color: '#fff' }}>
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>🧑‍💼 Tableau de bord Admin</h2>
        <p style={{ margin: '4px 0 0', opacity: 0.75, fontSize: '13px' }}>{isoToFr(today)}</p>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '16px' }} className="kpi-grid">
        {[
          { icon: '👥', val: patientsCount.count ?? 0, label: 'Patients total', color: '#1565c0', href: null },
          { icon: '🩺', val: doctorsCount.count ?? 0, label: 'Médecins', color: '#2e7d32', href: '/admin/users' },
          { icon: '🚨', val: alerts.length, label: 'Alertes actives', color: alerts.length > 0 ? '#c62828' : '#2e7d32', href: '/admin/alerts' },
          { icon: '⚠️', val: openReports, label: 'Rapports ouverts', color: openReports > 0 ? '#e65100' : '#2e7d32', href: '/admin/reports' },
          { icon: '💹', val: `${formatHTG(totalRec)} HTG`, label: 'Recettes ce mois', color: '#1a237e', href: null, small: true },
        ].map((k, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: '14px', padding: '16px 14px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.10)' }}>
            <div style={{ fontSize: '22px', marginBottom: '6px' }}>{k.icon}</div>
            <div style={{ fontSize: k.small ? '15px' : '22px', fontWeight: 800, color: k.color, lineHeight: 1 }}>{k.val}</div>
            <div style={{ fontSize: '10px', color: '#757575', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{k.label}</div>
            {k.href && <Link href={k.href} style={{ fontSize: '11px', color: k.color, marginTop: '6px', display: 'block' }}>Voir →</Link>}
          </div>
        ))}
      </div>

      {/* Résumé financier du jour */}
      <div style={{ background: '#fff', borderRadius: '14px', padding: '18px', marginBottom: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
        <div style={{ fontSize: '12px', fontWeight: 700, color: '#757575', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '14px' }}>
          Finance — Aujourd&apos;hui
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
          {[
            { label: 'Recettes', val: todayRec, color: '#2e7d32' },
            { label: 'Pharmacie', val: todayPha, color: '#6a1b9a' },
            { label: 'Dépenses', val: todayDep, color: '#c62828' },
          ].map(k => (
            <div key={k.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '15px', fontWeight: 800, color: k.color }}>{formatHTG(k.val)} HTG</div>
              <div style={{ fontSize: '10px', color: '#757575', marginTop: '2px' }}>{k.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Alertes */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <div style={{ fontSize: '12px', fontWeight: 700, color: '#757575', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
          Alertes métier ({alerts.length})
        </div>
        <Link href="/admin/alerts" style={{ fontSize: '12px', color: '#1a237e', fontWeight: 600 }}>Tout voir →</Link>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
        {alerts.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: '14px', padding: '20px', textAlign: 'center', color: '#2e7d32', fontSize: '14px', fontWeight: 600 }}>
            🟢 Aucune alerte — Tout est aligné !
          </div>
        ) : alerts.slice(0, 4).map((a: {
          patient_nom: string
          alert_type: string
          date_consultation: string
          record_id: string
          montant_paye?: number
        }, i: number) => {
          const cfg = alertColors[a.alert_type as keyof typeof alertColors] ?? alertColors.SERVICE_SANS_PAIEMENT
          return (
            <div key={i} style={{
              background: cfg.bg, borderRadius: '12px', padding: '14px 16px',
              borderLeft: `4px solid ${cfg.color}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontSize: '16px' }}>{cfg.icon}</span>
                <span style={{ fontWeight: 700, fontSize: '14px', color: cfg.color }}>{a.patient_nom}</span>
              </div>
              <div style={{ fontSize: '12px', color: cfg.color }}>{cfg.label} · {new Date(a.date_consultation).toLocaleDateString('fr-FR')}</div>
            </div>
          )
        })}
      </div>

      {/* Audit récent */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <div style={{ fontSize: '12px', fontWeight: 700, color: '#757575', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Activité récente</div>
        <Link href="/admin/audit" style={{ fontSize: '12px', color: '#1a237e', fontWeight: 600 }}>Tout voir →</Link>
      </div>

      <div style={{ background: '#fff', borderRadius: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        {logs.length === 0 ? (
          <p style={{ padding: '24px', textAlign: 'center', color: '#757575', fontSize: '13px' }}>Aucun log disponible</p>
        ) : logs.map((log: {
          id: string
          action: string
          table_name?: string
          created_at: string
          profile?: { full_name: string; role: string }
        }, i: number) => (
          <div key={log.id} style={{ padding: '12px 16px', borderBottom: i < logs.length - 1 ? '1px solid #f0f2f5' : 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px', background: '#eceff1',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0,
            }}>
              {log.action === 'LOGIN' ? '🔑' : log.action === 'INSERT' ? '➕' : log.action === 'UPDATE' ? '✏️' : '🗑️'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '13px', fontWeight: 600 }}>{log.profile?.full_name ?? 'Système'}</div>
              <div style={{ fontSize: '11px', color: '#757575' }}>{log.action} · {log.table_name ?? ''}</div>
            </div>
            <div style={{ fontSize: '11px', color: '#9e9e9e', whiteSpace: 'nowrap' }}>
              {new Date(log.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @media (min-width: 600px) { .kpi-grid { grid-template-columns: repeat(3, 1fr) !important; } }
        @media (min-width: 900px) { .kpi-grid { grid-template-columns: repeat(5, 1fr) !important; } }
      `}</style>
    </div>
  )
}
