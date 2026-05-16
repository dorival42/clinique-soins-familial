'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface Patient {
  id: string
  nom: string
  prenom: string
  sexe?: string
  tel_whatsapp?: string
  date_naissance?: string
  allergies?: string
  created_at: string
}

export default function PatientsPage() {
  const [search, setSearch] = useState('')
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const fetchPatients = useCallback(async (q: string) => {
    setLoading(true)
    let query = supabase.from('patients').select('*').order('nom')
    if (q.trim()) {
      query = query.or(`nom.ilike.%${q}%,prenom.ilike.%${q}%`)
    } else {
      query = query.limit(30)
    }
    const { data } = await query
    setPatients(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => fetchPatients(search), 300)
    return () => clearTimeout(timer)
  }, [search, fetchPatients])

  function calcAge(dob?: string): string {
    if (!dob) return '—'
    const diff = new Date().getFullYear() - new Date(dob).getFullYear()
    return `${diff} ans`
  }

  return (
    <div className="animate-fadeIn">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>👥 Patients</h2>
        <Link href="/doctor/patients/new" style={{
          padding: '10px 18px', background: '#2e7d32', color: '#fff',
          borderRadius: '10px', textDecoration: 'none', fontSize: '14px', fontWeight: 700,
        }}>
          + Nouveau patient
        </Link>
      </div>

      {/* Recherche */}
      <div style={{ position: 'relative', marginBottom: '16px' }}>
        <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px' }}>🔍</span>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher par nom ou prénom..."
          style={{
            width: '100%', padding: '14px 14px 14px 42px',
            border: '1.5px solid #e0e0e0', borderRadius: '12px',
            fontSize: '15px', outline: 'none', boxSizing: 'border-box',
            background: '#fff',
          }}
          autoFocus
        />
        {loading && (
          <div style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
            width: '20px', height: '20px', border: '2px solid #e0e0e0', borderTopColor: '#2e7d32',
            borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        )}
      </div>

      {/* Liste */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {patients.length === 0 && !loading ? (
          <div style={{ background: '#fff', borderRadius: '14px', padding: '40px', textAlign: 'center', color: '#757575' }}>
            {search ? `Aucun patient trouvé pour "${search}"` : 'Aucun patient enregistré'}
          </div>
        ) : patients.map(p => (
          <Link key={p.id} href={`/doctor/patients/${p.id}`} style={{ textDecoration: 'none' }}>
            <div style={{
              background: '#fff', borderRadius: '14px', padding: '14px 16px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)', display: 'flex',
              alignItems: 'center', gap: '14px', cursor: 'pointer',
              transition: 'box-shadow 0.15s',
            }}
            onMouseEnter={e => ((e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)')}
            onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.08)')}
            >
              <div style={{
                width: '44px', height: '44px', borderRadius: '12px',
                background: p.sexe === 'HOMME' ? '#e3f2fd' : p.sexe === 'FEMME' ? '#fce4ec' : '#f5f5f5',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '20px', flexShrink: 0,
              }}>
                {p.sexe === 'HOMME' ? '👨' : p.sexe === 'FEMME' ? '👩' : '👤'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '15px', fontWeight: 700 }}>{p.nom} {p.prenom}</div>
                <div style={{ fontSize: '12px', color: '#757575', marginTop: '2px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <span>{calcAge(p.date_naissance)}</span>
                  {p.tel_whatsapp && <span>📱 {p.tel_whatsapp}</span>}
                  {p.allergies && <span style={{ color: '#e65100' }}>⚠️ Allergies</span>}
                </div>
              </div>
              <span style={{ color: '#9e9e9e', fontSize: '18px' }}>›</span>
            </div>
          </Link>
        ))}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
