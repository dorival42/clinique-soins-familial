'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/shared/Toast'

interface ErrorReport {
  id: string
  description: string
  related_table: string | null
  status: 'open' | 'reviewing' | 'resolved'
  resolution_note: string | null
  created_at: string
}

const STATUS_CONFIG = {
  open:      { label: 'En attente', color: '#c62828', bg: '#ffebee', icon: '🔴' },
  reviewing: { label: 'En cours',   color: '#e65100', bg: '#fff3e0', icon: '🟠' },
  resolved:  { label: 'Résolu',     color: '#2e7d32', bg: '#e8f5e9', icon: '🟢' },
}

const TABLE_OPTIONS = [
  { value: 'patients',        label: 'Dossier patient' },
  { value: 'medical_records', label: 'Consultation' },
  { value: 'payments',        label: 'Paiement' },
  { value: 'services',        label: 'Service médical' },
  { value: '',                label: 'Autre' },
]

export default function DoctorErrorsPage() {
  const [description, setDescription] = useState('')
  const [relatedTable, setRelatedTable] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [myReports, setMyReports] = useState<ErrorReport[]>([])
  const [loading, setLoading] = useState(true)
  const { showToast, ToastComponent } = useToast()
  const supabase = createClient()

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('error_reports')
      .select('id, description, related_table, status, resolution_note, created_at')
      .eq('reporter_id', user.id)
      .order('created_at', { ascending: false })
    setMyReports(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function submit() {
    if (!description.trim()) { showToast('Veuillez décrire le problème', 'er'); return }
    setSubmitting(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('error_reports').insert({
      reporter_id: user?.id,
      description: description.trim(),
      related_table: relatedTable || null,
      status: 'open',
    })
    if (error) {
      showToast('Erreur lors de l\'envoi', 'er')
    } else {
      showToast('Rapport envoyé à l\'administration', 'ok')
      setDescription('')
      setRelatedTable('')
      await load()
    }
    setSubmitting(false)
  }

  return (
    <div className="animate-fadeIn">
      <h2 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: 700 }}>⚠️ Signaler une erreur</h2>
      <p style={{ margin: '0 0 24px', color: '#757575', fontSize: '13px' }}>
        Signalez tout problème ou incohérence dans le système. L'administration sera notifiée.
      </p>

      {/* Formulaire */}
      <div style={{ background: '#fff', borderRadius: '14px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: '24px' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: 700, color: '#1b5e20' }}>Nouveau rapport</h3>

        <div style={{ marginBottom: '14px' }}>
          <label style={LS}>Catégorie du problème</label>
          <select value={relatedTable} onChange={e => setRelatedTable(e.target.value)} style={IS}>
            {TABLE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={LS}>Description du problème *</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Décrivez le problème en détail : ce que vous avez constaté, quand cela s'est produit, quel patient ou dossier est concerné (sans données sensibles)..."
            rows={5}
            style={{
              width: '100%', padding: '12px 14px',
              border: '1.5px solid #e0e0e0', borderRadius: '10px',
              fontSize: '14px', outline: 'none', resize: 'vertical',
              boxSizing: 'border-box', fontFamily: 'inherit', lineHeight: 1.5,
            }}
          />
          <div style={{ fontSize: '11px', color: '#bdbdbd', marginTop: '4px', textAlign: 'right' }}>
            {description.length} caractères
          </div>
        </div>

        <button
          onClick={submit}
          disabled={submitting || !description.trim()}
          style={{
            padding: '12px 24px', background: '#1b5e20', color: '#fff',
            border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '14px',
            cursor: submitting || !description.trim() ? 'not-allowed' : 'pointer',
            opacity: submitting || !description.trim() ? 0.7 : 1,
            width: '100%',
          }}
        >
          {submitting ? 'Envoi en cours...' : '📤 Envoyer le rapport'}
        </button>
      </div>

      {/* Mes rapports */}
      <h3 style={{ margin: '0 0 12px', fontSize: '15px', fontWeight: 700 }}>Mes rapports précédents</h3>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '32px' }}>
          <div style={{ width: '28px', height: '28px', border: '3px solid #e0e0e0', borderTopColor: '#1b5e20', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        </div>
      ) : myReports.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: '14px', padding: '32px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>📭</div>
          <div style={{ color: '#757575', fontSize: '13px' }}>Aucun rapport envoyé pour l'instant</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {myReports.map(r => {
            const sc = STATUS_CONFIG[r.status]
            return (
              <div key={r.id} style={{
                background: '#fff', borderRadius: '14px', padding: '16px 18px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                borderLeft: `4px solid ${sc.color}`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '6px', lineHeight: 1.4 }}>{r.description}</div>
                    <div style={{ fontSize: '11px', color: '#9e9e9e' }}>
                      {r.related_table && `${TABLE_OPTIONS.find(o => o.value === r.related_table)?.label ?? r.related_table} · `}
                      {new Date(r.created_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <span style={{
                    padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700,
                    background: sc.bg, color: sc.color, whiteSpace: 'nowrap', flexShrink: 0,
                  }}>
                    {sc.icon} {sc.label}
                  </span>
                </div>
                {r.resolution_note && (
                  <div style={{ marginTop: '10px', padding: '10px 12px', background: '#e8f5e9', borderRadius: '8px' }}>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: '#2e7d32', marginBottom: '3px' }}>RÉPONSE DE L'ADMIN</div>
                    <div style={{ fontSize: '13px', color: '#212121' }}>{r.resolution_note}</div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <ToastComponent />
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.3s ease; }
      `}</style>
    </div>
  )
}

const IS: React.CSSProperties = { width: '100%', padding: '12px 14px', border: '1.5px solid #e0e0e0', borderRadius: '10px', fontSize: '15px', outline: 'none', boxSizing: 'border-box', background: '#fff', color: '#212121' }
const LS: React.CSSProperties = { display: 'block', fontSize: '11px', fontWeight: 700, color: '#757575', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }
