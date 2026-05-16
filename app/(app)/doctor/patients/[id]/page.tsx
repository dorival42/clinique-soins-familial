import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function PatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: patient } = await supabase.from('patients').select('*').eq('id', id).single()
  if (!patient) notFound()

  const { data: records } = await supabase
    .from('medical_records')
    .select('*, doctor:profiles(full_name, specialty)')
    .eq('patient_id', id)
    .order('date_consultation', { ascending: false })

  const { data: payments } = await supabase
    .from('payments')
    .select('*')
    .eq('patient_id', id)
    .order('date_paiement', { ascending: false })

  function calcAge(dob?: string): string {
    if (!dob) return '—'
    return `${new Date().getFullYear() - new Date(dob).getFullYear()} ans`
  }

  const statusStyle = (s: string) => ({
    padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700,
    background: s === 'completed' ? '#e8f5e9' : s === 'cancelled' ? '#ffebee' : '#fff3e0',
    color: s === 'completed' ? '#2e7d32' : s === 'cancelled' ? '#c62828' : '#e65100',
  })

  return (
    <div className="animate-fadeIn">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <Link href="/doctor/patients" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', textDecoration: 'none', color: '#212121' }}>←</Link>
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>
          {patient.nom} {patient.prenom}
        </h2>
        <Link href={`/doctor/records/new?patient=${id}`} style={{
          marginLeft: 'auto', padding: '10px 16px', background: '#2e7d32', color: '#fff',
          borderRadius: '10px', textDecoration: 'none', fontSize: '13px', fontWeight: 700,
        }}>
          + Nouvelle consultation
        </Link>
      </div>

      {/* Carte patient */}
      <div style={{ background: '#fff', borderRadius: '14px', padding: '20px', marginBottom: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
          <div style={{
            width: '60px', height: '60px', borderRadius: '16px', flexShrink: 0,
            background: patient.sexe === 'HOMME' ? '#e3f2fd' : patient.sexe === 'FEMME' ? '#fce4ec' : '#f5f5f5',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px',
          }}>
            {patient.sexe === 'HOMME' ? '👨' : patient.sexe === 'FEMME' ? '👩' : '👤'}
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>{patient.nom} {patient.prenom}</h3>
            <p style={{ margin: '4px 0 0', color: '#757575', fontSize: '13px' }}>
              {calcAge(patient.date_naissance)} · {patient.sexe ?? 'Sexe non précisé'}
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
          {[
            { icon: '📱', label: 'WhatsApp', val: patient.tel_whatsapp },
            { icon: '📞', label: 'Tél secondaire', val: patient.tel_secondaire },
            { icon: '✉️', label: 'Email', val: patient.email },
            { icon: '📍', label: 'Adresse', val: patient.adresse },
          ].map(f => f.val && (
            <div key={f.label}>
              <div style={{ fontSize: '11px', color: '#757575', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{f.icon} {f.label}</div>
              <div style={{ fontSize: '14px', marginTop: '2px' }}>{f.val}</div>
            </div>
          ))}
        </div>

        {patient.allergies && (
          <div style={{ marginTop: '16px', padding: '12px 16px', background: '#fff8e1', borderRadius: '10px', borderLeft: '4px solid #f9a825' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#e65100', marginBottom: '4px' }}>⚠️ ALLERGIES / TRAITEMENTS EN COURS</div>
            <div style={{ fontSize: '14px', color: '#5d4037' }}>{patient.allergies}</div>
          </div>
        )}
      </div>

      {/* Historique dossiers */}
      <div style={{ fontSize: '12px', fontWeight: 700, color: '#757575', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '10px' }}>
        Dossiers médicaux ({(records ?? []).length})
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
        {(records ?? []).length === 0 ? (
          <div style={{ background: '#fff', borderRadius: '14px', padding: '24px', textAlign: 'center', color: '#757575', fontSize: '13px' }}>Aucun dossier</div>
        ) : (records ?? []).map((r: {
          id: string
          date_consultation: string
          status: string
          motif?: string
          diagnostic?: string
          doctor?: { full_name: string; specialty?: string }
        }) => (
          <div key={r.id} style={{ background: '#fff', borderRadius: '14px', padding: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700 }}>{new Date(r.date_consultation).toLocaleDateString('fr-FR')}</div>
                <div style={{ fontSize: '12px', color: '#757575' }}>Dr. {r.doctor?.full_name} {r.doctor?.specialty && `· ${r.doctor.specialty}`}</div>
              </div>
              <span style={statusStyle(r.status)}>
                {r.status === 'completed' ? 'Terminé' : r.status === 'cancelled' ? 'Annulé' : 'En cours'}
              </span>
            </div>
            {r.motif && <p style={{ margin: '10px 0 0', fontSize: '13px', color: '#424242' }}><strong>Motif :</strong> {r.motif}</p>}
            {r.diagnostic && <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#424242' }}><strong>Diagnostic :</strong> {r.diagnostic}</p>}
          </div>
        ))}
      </div>

      {/* Paiements */}
      {(payments ?? []).length > 0 && (
        <>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#757575', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '10px' }}>
            Historique paiements
          </div>
          <div style={{ background: '#fff', borderRadius: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
            {(payments ?? []).map((p: { id: string; date_paiement: string; categorie_nom?: string; montant_htg: number }, i: number) => (
              <div key={p.id} style={{ padding: '12px 16px', borderBottom: i < (payments ?? []).length - 1 ? '1px solid #f0f2f5' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600 }}>{p.categorie_nom ?? 'Paiement'}</div>
                  <div style={{ fontSize: '11px', color: '#757575' }}>{new Date(p.date_paiement).toLocaleDateString('fr-FR')}</div>
                </div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#2e7d32' }}>{p.montant_htg.toLocaleString('fr-FR')} HTG</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
