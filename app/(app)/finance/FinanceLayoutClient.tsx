'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import AppLayout from '@/components/shared/AppLayout'
import { useToast } from '@/components/shared/Toast'
import type { Profile } from '@/lib/types/database'

interface Props {
  children: React.ReactNode
  profile: Profile
  taux: number
}

export default function FinanceLayoutClient({ children, profile, taux: initialTaux }: Props) {
  const [taux, setTaux] = useState(initialTaux)
  const [tauxModal, setTauxModal] = useState(false)
  const [newTaux, setNewTaux] = useState(String(initialTaux))
  const [saving, setSaving] = useState(false)
  const { showToast, ToastComponent } = useToast()

  async function saveTaux() {
    const t = parseFloat(newTaux)
    if (!t || t <= 0) { showToast('Taux invalide', 'er'); return }
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('exchange_rates').insert({ taux_usd_htg: t })
    setSaving(false)
    if (error) { showToast('Erreur : ' + error.message, 'er') }
    else { setTaux(t); setTauxModal(false); showToast(`Taux mis à jour : 1 USD = ${t} HTG`, 'ok') }
  }

  return (
    <>
      <AppLayout
        role={profile.role}
        userName={profile.full_name}
        taux={taux}
        onTauxClick={() => setTauxModal(true)}
        section="finance"
      >
        {children}
      </AppLayout>

      {/* Modal taux */}
      {tauxModal && (
        <div
          onClick={e => e.target === e.currentTarget && setTauxModal(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            zIndex: 600,
          }}
        >
          <div style={{
            background: '#fff',
            borderRadius: '20px 20px 0 0',
            padding: '24px 20px 40px',
            width: '100%',
            maxWidth: '480px',
            animation: 'slideUp 0.3s ease-out',
          }}>
            <div style={{ width: '36px', height: '4px', background: '#e0e0e0', borderRadius: '2px', margin: '0 auto 20px' }} />
            <h3 style={{ margin: '0 0 16px', fontSize: '17px', fontWeight: 700 }}>
              💵 Taux de change USD → HTG
            </h3>
            <input
              type="number"
              value={newTaux}
              onChange={e => setNewTaux(e.target.value)}
              min="1"
              step="0.5"
              style={{
                width: '100%',
                padding: '16px',
                border: '1.5px solid #e0e0e0',
                borderRadius: '10px',
                fontSize: '22px',
                fontWeight: 700,
                textAlign: 'center',
                marginBottom: '14px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={e => (e.target.style.borderColor = '#3949ab')}
              onBlur={e => (e.target.style.borderColor = '#e0e0e0')}
            />
            <button
              onClick={saveTaux}
              disabled={saving}
              style={{
                width: '100%', padding: '15px', border: 'none',
                borderRadius: '12px', background: '#3949ab', color: '#fff',
                fontSize: '16px', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? 'Enregistrement...' : '✓ Enregistrer'}
            </button>
          </div>
        </div>
      )}

      <ToastComponent />
    </>
  )
}
