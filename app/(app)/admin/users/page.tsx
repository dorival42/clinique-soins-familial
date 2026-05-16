'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/shared/Toast'
import type { Profile, UserRole } from '@/lib/types/database'

export default function UsersPage() {
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [newUser, setNewUser] = useState({ email: '', full_name: '', role: 'doctor' as UserRole, specialty: '', password: '' })
  const [creating, setCreating] = useState(false)
  const { showToast, ToastComponent } = useToast()
  const supabase = createClient()

  const loadUsers = useCallback(async () => {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
    setUsers(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { loadUsers() }, [loadUsers])

  async function toggleActive(user: Profile) {
    await supabase.from('profiles').update({ active: !user.active }).eq('id', user.id)
    showToast(`Compte ${!user.active ? 'activé' : 'désactivé'}`, 'ok')
    await loadUsers()
  }

  async function changeRole(userId: string, role: UserRole) {
    await supabase.from('profiles').update({ role }).eq('id', userId)
    showToast('Rôle mis à jour', 'ok')
    await loadUsers()
  }

  const roleColors: Record<UserRole, { bg: string; color: string }> = {
    admin:   { bg: '#e8eaf6', color: '#1a237e' },
    doctor:  { bg: '#e8f5e9', color: '#2e7d32' },
    finance: { bg: '#fff3e0', color: '#e65100' },
  }
  const roleLabels: Record<UserRole, string> = { admin: 'Admin', doctor: 'Médecin', finance: 'Finance' }

  return (
    <div className="animate-fadeIn">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>👥 Utilisateurs</h2>
        <button onClick={() => setShowForm(!showForm)} style={{
          padding: '10px 18px', background: '#37474f', color: '#fff',
          border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 700, cursor: 'pointer',
        }}>
          {showForm ? '✕ Annuler' : '+ Nouvel utilisateur'}
        </button>
      </div>

      {/* Formulaire création */}
      {showForm && (
        <div style={{ background: '#fff', borderRadius: '14px', padding: '20px', marginBottom: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: 700, color: '#37474f' }}>Créer un compte</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }} className="form-row-2">
            <div>
              <label style={LS}>Email *</label>
              <input type="email" value={newUser.email} onChange={e => setNewUser(u => ({ ...u, email: e.target.value }))} style={IS} placeholder="email@clinique.com" />
            </div>
            <div>
              <label style={LS}>Mot de passe *</label>
              <input type="password" value={newUser.password} onChange={e => setNewUser(u => ({ ...u, password: e.target.value }))} style={IS} placeholder="••••••••" />
            </div>
            <div>
              <label style={LS}>Nom complet *</label>
              <input value={newUser.full_name} onChange={e => setNewUser(u => ({ ...u, full_name: e.target.value }))} style={IS} placeholder="Dr. Jean DUPONT" />
            </div>
            <div>
              <label style={LS}>Rôle *</label>
              <select value={newUser.role} onChange={e => setNewUser(u => ({ ...u, role: e.target.value as UserRole }))} style={IS}>
                <option value="doctor">Médecin</option>
                <option value="finance">Finance</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            {newUser.role === 'doctor' && (
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={LS}>Spécialité</label>
                <input value={newUser.specialty} onChange={e => setNewUser(u => ({ ...u, specialty: e.target.value }))} style={IS} placeholder="Ex: Médecine générale, Pédiatrie..." />
              </div>
            )}
          </div>
          <button
            onClick={async () => {
              if (!newUser.email || !newUser.full_name || !newUser.password) { showToast('Tous les champs obligatoires', 'er'); return }
              setCreating(true)
              // Note: Dans un vrai projet, ceci doit passer par une API route sécurisée
              // Pour la démo, on simule avec signUp
              const { data, error } = await supabase.auth.signUp({
                email: newUser.email,
                password: newUser.password,
              })
              if (error) { showToast('Erreur : ' + error.message, 'er'); setCreating(false); return }
              if (data.user) {
                await supabase.from('profiles').upsert({
                  id: data.user.id,
                  role: newUser.role,
                  full_name: newUser.full_name,
                  specialty: newUser.specialty || null,
                  active: true,
                })
              }
              setCreating(false)
              showToast('Compte créé ! L\'utilisateur doit confirmer son email.', 'ok')
              setShowForm(false)
              setNewUser({ email: '', full_name: '', role: 'doctor', specialty: '', password: '' })
              await loadUsers()
            }}
            disabled={creating}
            style={{ marginTop: '14px', padding: '12px 24px', background: '#37474f', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: creating ? 'not-allowed' : 'pointer', opacity: creating ? 0.7 : 1 }}
          >
            {creating ? 'Création...' : 'Créer le compte'}
          </button>
        </div>
      )}

      {/* Liste utilisateurs */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
          <div style={{ width: '32px', height: '32px', border: '3px solid #e0e0e0', borderTopColor: '#37474f', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {users.map(u => (
            <div key={u.id} style={{
              background: '#fff', borderRadius: '14px', padding: '16px 18px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
              opacity: u.active ? 1 : 0.6,
              display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap',
            }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '12px',
                background: roleColors[u.role].bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0,
              }}>
                {u.role === 'admin' ? '🧑‍💼' : u.role === 'doctor' ? '🩺' : '💰'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '15px', fontWeight: 700 }}>{u.full_name}</div>
                <div style={{ fontSize: '12px', color: '#757575', marginTop: '2px' }}>
                  {u.specialty && `${u.specialty} · `}
                  {new Date(u.created_at).toLocaleDateString('fr-FR')}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <select
                  value={u.role}
                  onChange={e => changeRole(u.id, e.target.value as UserRole)}
                  style={{
                    padding: '5px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 700,
                    border: `1.5px solid ${roleColors[u.role].color}`,
                    background: roleColors[u.role].bg, color: roleColors[u.role].color,
                    cursor: 'pointer', outline: 'none',
                  }}
                >
                  <option value="doctor">Médecin</option>
                  <option value="finance">Finance</option>
                  <option value="admin">Admin</option>
                </select>
                <button
                  onClick={() => toggleActive(u)}
                  style={{
                    padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700,
                    border: 'none', cursor: 'pointer',
                    background: u.active ? '#ffebee' : '#e8f5e9',
                    color: u.active ? '#c62828' : '#2e7d32',
                  }}
                >
                  {u.active ? 'Désactiver' : 'Activer'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ToastComponent />
      <style>{`.form-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; } @media (max-width: 480px) { .form-row-2 { grid-template-columns: 1fr !important; } } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

const IS: React.CSSProperties = { width: '100%', padding: '12px 14px', border: '1.5px solid #e0e0e0', borderRadius: '10px', fontSize: '15px', outline: 'none', boxSizing: 'border-box', background: '#fff', color: '#212121' }
const LS: React.CSSProperties = { display: 'block', fontSize: '11px', fontWeight: 700, color: '#757575', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }
