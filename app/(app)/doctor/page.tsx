import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { todayIso, getGreeting } from '@/lib/utils'

export default async function DoctorHomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user!.id).single()
  const today = todayIso()

  const [recordsRes, patientsRes] = await Promise.all([
    supabase.from('medical_records')
      .select('*, patient:patients(nom, prenom)')
      .eq('doctor_id', user!.id)
      .eq('date_consultation', today)
      .order('created_at', { ascending: false }),
    supabase.from('medical_records')
      .select('patient_id', { count: 'exact', head: true })
      .eq('doctor_id', user!.id),
  ])

  const todayRecords = recordsRes.data ?? []
  const totalPatients = patientsRes.count ?? 0

  return (
    <div className="animate-fadeIn">
      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #1b5e20, #2e7d32)',
        borderRadius: '16px', padding: '20px 22px', marginBottom: '16px', color: '#fff',
      }}>
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>
          {getGreeting()}, Dr. {profile?.full_name?.split(' ').pop()} 👋
        </h2>
        <p style={{ margin: '4px 0 0', opacity: 0.75, fontSize: '13px' }}>
          {profile?.specialty && `${profile.specialty} · `}{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
        <div style={{ background: '#fff', borderRadius: '14px', padding: '16px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.10)' }}>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#2e7d32' }}>{todayRecords.length}</div>
          <div style={{ fontSize: '11px', color: '#757575', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '4px' }}>Consultations aujourd&apos;hui</div>
        </div>
        <div style={{ background: '#fff', borderRadius: '14px', padding: '16px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.10)' }}>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#1565c0' }}>{totalPatients}</div>
          <div style={{ fontSize: '11px', color: '#757575', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '4px' }}>Mes patients</div>
        </div>
      </div>

      {/* Actions rapides */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
        <Link href="/doctor/records/new" style={{
          display: 'flex', alignItems: 'center', gap: '10px', padding: '16px 14px',
          borderRadius: '14px', background: '#e8f5e9', color: '#2e7d32',
          textDecoration: 'none', fontSize: '14px', fontWeight: 600,
          boxShadow: '0 1px 4px rgba(0,0,0,0.10)',
        }}>
          <span style={{ fontSize: '22px' }}>📋</span>
          Nouvelle consultation
        </Link>
        <Link href="/doctor/patients" style={{
          display: 'flex', alignItems: 'center', gap: '10px', padding: '16px 14px',
          borderRadius: '14px', background: '#e3f2fd', color: '#1565c0',
          textDecoration: 'none', fontSize: '14px', fontWeight: 600,
          boxShadow: '0 1px 4px rgba(0,0,0,0.10)',
        }}>
          <span style={{ fontSize: '22px' }}>🔍</span>
          Rechercher patient
        </Link>
      </div>

      {/* Consultations du jour */}
      <div style={{ fontSize: '12px', fontWeight: 700, color: '#757575', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '10px' }}>
        Consultations du jour ({todayRecords.length})
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {todayRecords.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: '14px', padding: '32px', textAlign: 'center', color: '#757575', fontSize: '13px' }}>
            Aucune consultation aujourd&apos;hui
          </div>
        ) : todayRecords.map((record: {
          id: string
          status: string
          motif?: string
          patient?: { nom: string; prenom: string }
        }) => (
          <Link key={record.id} href={`/doctor/patients?record=${record.id}`} style={{ textDecoration: 'none' }}>
            <div style={{
              background: '#fff', borderRadius: '14px', padding: '16px 18px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.10)',
              display: 'flex', alignItems: 'center', gap: '14px',
              cursor: 'pointer',
            }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '12px',
                background: record.status === 'completed' ? '#e8f5e9' : record.status === 'cancelled' ? '#ffebee' : '#fff3e0',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '20px', flexShrink: 0,
              }}>
                {record.status === 'completed' ? '✅' : record.status === 'cancelled' ? '❌' : '⏳'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '15px', fontWeight: 700 }}>
                  {record.patient?.nom} {record.patient?.prenom}
                </div>
                <div style={{ fontSize: '12px', color: '#757575', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {record.motif || 'Motif non précisé'}
                </div>
              </div>
              <span style={{
                padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700,
                background: record.status === 'completed' ? '#e8f5e9' : record.status === 'cancelled' ? '#ffebee' : '#fff3e0',
                color: record.status === 'completed' ? '#2e7d32' : record.status === 'cancelled' ? '#c62828' : '#e65100',
              }}>
                {record.status === 'completed' ? 'Terminé' : record.status === 'cancelled' ? 'Annulé' : 'En cours'}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
