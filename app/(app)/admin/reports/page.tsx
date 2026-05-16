'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/shared/Toast'

type ReportStatus = 'open' | 'reviewing' | 'resolved'

interface ErrorReport {
  id: string
  description: string
  related_table: string | null
  related_id: string | null
  status: ReportStatus
  resolution_note: string | null
  created_at: string
  resolved_at: string | null
  reporter?: { full_name: string; role: string } | null
  resolver?: { full_name: string } | null
}

const STATUS_CONFIG: Record<ReportStatus, { label: string; color: string; bg: string; icon: string }> = {
  open:      { label: 'Ouvert',      color: '#c62828', bg: '#ffebee', icon: '🔴' },
  reviewing: { label: 'En cours',    color: '#e65100', bg: '#fff3e0', icon: '🟠' },
  resolved:  { label: 'Résolu',      color: '#2e7d32', bg: '#e8f5e9', icon: '🟢' },
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<ErrorReport[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<ReportStatus | 'all'>('all')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [resolveNote, setResolveNote] = useState('')
  const [saving, setSaving] = useState(false)
  const { showToast, ToastComponent } = useToast()
  const supabase = createClient()

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('error_reports')
      .select('*, reporter:profiles!reporter_id(full_name, role), resolver:profiles!resolved_by(full_name)')
      .order('created_at', { ascending: false })
    setReports(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function updateStatus(report: ErrorReport, status: ReportStatus) {
    setSaving(true)
    const patch: Record<string, unknown> = { status }
    if (status === 'resolved') {
      const { data: { user } } = await supabase.auth.getUser()
      patch.resolved_by = user?.id
      patch.resolved_at = new Date().toISOString()
      patch.resolution_note = resolveNote || null
    }
    const { error } = await supabase.from('error_reports').update(patch).eq('id', report.id)
    if (error) { showToast('Erreur lors de la mise à jour', 'er') }
    else {
      showToast(status === 'resolved' ? 'Rapport résolu' : 'Statut mis à jour', 'ok')
      setExpanded(null)
      setResolveNote('')
      await load()
    }
    setSaving(false)
  }

  const filtered = filter === 'all' ? reports : reports.filter(r => r.status === filter)

  const counts = {
    all: reports.length,
    open: reports.filter(r => r.status === 'open').length,
    reviewing: reports.filter(r => r.status === 'reviewing').length,
    resolved: reports.filter(r => r.status === 'resolved').length,
  }

  return (
    <div className="animate-fadeIn">
      <h2 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: 700 }}>⚠️ Rapports d'erreurs</h2>

      {/* Compteurs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '20px' }} className="reports-kpi-grid">
        {(['all', 'open', 'reviewing', 'resolved'] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            style={{
              background: filter === s ? (s === 'all' ? '#37474f' : STATUS_CONFIG[s]?.color ?? '#37474f') : '#fff',
              color: filter === s ? '#fff' : (s === 'all' ? '#37474f' : STATUS_CONFIG[s as ReportStatus]?.color ?? '#212121'),
              border: `2px solid ${filter === s ? 'transparent' : '#e0e0e0'}`,
              borderRadius: '12px', padding: '12px 8px',
              cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s',
            }}
          >
            <div style={{ fontSize: '20px', fontWeight: 800 }}>{counts[s]}</div>
            <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '2px' }}>
              {s === 'all' ? 'Total' : STATUS_CONFIG[s].label}
            </div>
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
          <div style={{ width: '32px', height: '32px', border: '3px solid #e0e0e0', borderTopColor: '#37474f', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: '14px', padding: '48px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>✅</div>
          <div style={{ color: '#757575', fontSize: '14px' }}>Aucun rapport dans cette catégorie</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filtered.map(report => {
            const sc = STATUS_CONFIG[report.status]
            const isExpanded = expanded === report.id
            return (
              <div key={report.id} style={{
                background: '#fff', borderRadius: '14px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                overflow: 'hidden',
                border: isExpanded ? `2px solid ${sc.color}` : '2px solid transparent',
                transition: 'border-color 0.15s',
              }}>
                <div
                  onClick={() => setExpanded(isExpanded ? null : report.id)}
                  style={{ padding: '16px 18px', cursor: 'pointer', display: 'flex', gap: '14px', alignItems: 'flex-start' }}
                >
                  <span style={{ fontSize: '20px', flexShrink: 0, marginTop: '2px' }}>{sc.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '6px', lineHeight: 1.4 }}>
                      {report.description}
                    </div>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '12px', color: '#757575' }}>
                      <span>👤 {report.reporter?.full_name ?? 'Inconnu'}</span>
                      {report.related_table && <span>📋 {report.related_table}</span>}
                      <span>🕐 {new Date(report.created_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                  <span style={{
                    padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700,
                    background: sc.bg, color: sc.color, whiteSpace: 'nowrap', flexShrink: 0,
                  }}>
                    {sc.label}
                  </span>
                </div>

                {isExpanded && (
                  <div style={{ padding: '0 18px 18px', borderTop: '1px solid #f0f2f5' }}>
                    {report.resolution_note && (
                      <div style={{ background: '#e8f5e9', borderRadius: '10px', padding: '12px', marginBottom: '14px', marginTop: '14px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#2e7d32', marginBottom: '4px' }}>NOTE DE RÉSOLUTION</div>
                        <div style={{ fontSize: '13px', color: '#212121' }}>{report.resolution_note}</div>
                        {report.resolver && (
                          <div style={{ fontSize: '11px', color: '#757575', marginTop: '6px' }}>
                            Par {report.resolver.full_name} · {report.resolved_at ? new Date(report.resolved_at).toLocaleDateString('fr-FR') : ''}
                          </div>
                        )}
                      </div>
                    )}

                    {report.status !== 'resolved' && (
                      <div style={{ marginTop: '14px' }}>
                        {report.status === 'open' && (
                          <button
                            onClick={() => updateStatus(report, 'reviewing')}
                            disabled={saving}
                            style={{ padding: '9px 16px', background: '#fff3e0', color: '#e65100', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', marginRight: '8px' }}
                          >
                            🟠 Prendre en charge
                          </button>
                        )}
                        <div style={{ marginTop: '10px' }}>
                          <label style={LS}>Note de résolution (optionnel)</label>
                          <textarea
                            value={resolveNote}
                            onChange={e => setResolveNote(e.target.value)}
                            placeholder="Décrivez comment le problème a été résolu..."
                            rows={3}
                            style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e0e0e0', borderRadius: '10px', fontSize: '14px', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }}
                          />
                          <button
                            onClick={() => updateStatus(report, 'resolved')}
                            disabled={saving}
                            style={{ marginTop: '8px', padding: '10px 18px', background: '#2e7d32', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '13px', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}
                          >
                            {saving ? 'Enregistrement...' : '✅ Marquer comme résolu'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <ToastComponent />
      <style>{`
        @media (max-width: 480px) { .reports-kpi-grid { grid-template-columns: 1fr 1fr !important; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.3s ease; }
      `}</style>
    </div>
  )
}

const LS: React.CSSProperties = { display: 'block', fontSize: '11px', fontWeight: 700, color: '#757575', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }
