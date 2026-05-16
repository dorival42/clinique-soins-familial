import { createClient } from '@/lib/supabase/server'
import { formatHTG } from '@/lib/utils'

const alertConfig = {
  SERVICE_SANS_PAIEMENT: { icon: '🔴', label: 'Service effectué — Paiement manquant', bg: '#ffebee', border: '#c62828', color: '#c62828' },
  PAIEMENT_SANS_SERVICE: { icon: '🟠', label: 'Paiement reçu — Service non enregistré', bg: '#fff3e0', border: '#e65100', color: '#e65100' },
}

export default async function AlertsPage() {
  const supabase = await createClient()
  const { data: alerts } = await supabase
    .from('business_alerts')
    .select('*')
    .order('date_consultation', { ascending: false })

  const alertList = alerts ?? []
  const rouge = alertList.filter((a: { alert_type: string }) => a.alert_type === 'SERVICE_SANS_PAIEMENT')
  const orange = alertList.filter((a: { alert_type: string }) => a.alert_type === 'PAIEMENT_SANS_SERVICE')

  return (
    <div className="animate-fadeIn">
      <h2 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: 700 }}>🚨 Alertes métier</h2>

      {/* Résumé */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '20px' }}>
        <div style={{ background: '#ffebee', borderRadius: '14px', padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#c62828' }}>{rouge.length}</div>
          <div style={{ fontSize: '11px', color: '#c62828', marginTop: '4px', fontWeight: 700 }}>Service sans paiement</div>
        </div>
        <div style={{ background: '#fff3e0', borderRadius: '14px', padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#e65100' }}>{orange.length}</div>
          <div style={{ fontSize: '11px', color: '#e65100', marginTop: '4px', fontWeight: 700 }}>Paiement sans service</div>
        </div>
        <div style={{ background: '#e8f5e9', borderRadius: '14px', padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#2e7d32' }}>
            {alertList.length === 0 ? '✓' : '—'}
          </div>
          <div style={{ fontSize: '11px', color: '#2e7d32', marginTop: '4px', fontWeight: 700 }}>
            {alertList.length === 0 ? 'Tout aligné !' : 'Total alertes'}
          </div>
        </div>
      </div>

      {alertList.length === 0 ? (
        <div style={{ background: '#e8f5e9', borderRadius: '16px', padding: '48px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🟢</div>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#2e7d32' }}>Tout est aligné !</h3>
          <p style={{ margin: '8px 0 0', color: '#2e7d32', fontSize: '14px' }}>Aucune incohérence détectée entre paiements et services.</p>
        </div>
      ) : (
        <>
          {rouge.length > 0 && (
            <>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#c62828', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '10px' }}>
                🔴 Services sans paiement ({rouge.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                {rouge.map((a: {
                  record_id: string
                  patient_nom: string
                  date_consultation: string
                  record_status: string
                  montant_paye?: number
                }) => (
                  <AlertCard key={a.record_id} alert={a} type="SERVICE_SANS_PAIEMENT" />
                ))}
              </div>
            </>
          )}

          {orange.length > 0 && (
            <>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#e65100', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '10px' }}>
                🟠 Paiements sans service ({orange.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {orange.map((a: {
                  record_id: string
                  patient_nom: string
                  date_consultation: string
                  record_status: string
                  montant_paye?: number
                }) => (
                  <AlertCard key={a.record_id} alert={a} type="PAIEMENT_SANS_SERVICE" />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}

function AlertCard({ alert, type }: {
  alert: { record_id: string; patient_nom: string; date_consultation: string; record_status: string; montant_paye?: number }
  type: 'SERVICE_SANS_PAIEMENT' | 'PAIEMENT_SANS_SERVICE'
}) {
  const cfg = alertConfig[type]
  return (
    <div style={{
      background: cfg.bg, borderRadius: '14px', padding: '16px 18px',
      borderLeft: `4px solid ${cfg.border}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <div style={{ fontSize: '15px', fontWeight: 700, color: cfg.color }}>
            {cfg.icon} {alert.patient_nom}
          </div>
          <div style={{ fontSize: '12px', color: cfg.color, marginTop: '3px' }}>
            Consultation du {new Date(alert.date_consultation).toLocaleDateString('fr-FR')}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '11px', color: cfg.color, fontWeight: 700 }}>{cfg.label}</div>
          {alert.montant_paye !== undefined && (
            <div style={{ fontSize: '12px', color: cfg.color, marginTop: '2px' }}>
              {alert.montant_paye > 0 ? `${formatHTG(alert.montant_paye)} HTG payés` : 'Aucun paiement'}
            </div>
          )}
        </div>
      </div>
      <div style={{ marginTop: '10px', display: 'flex', gap: '8px' }}>
        <span style={{
          padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700,
          background: 'rgba(255,255,255,0.5)', color: cfg.color,
        }}>
          Dossier : {alert.record_status === 'completed' ? 'Terminé' : alert.record_status === 'pending' ? 'En cours' : 'Annulé'}
        </span>
      </div>
    </div>
  )
}
