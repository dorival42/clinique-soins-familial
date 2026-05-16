'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/shared/Toast'

export default function NewPatientPage() {
  const router = useRouter()
  const { showToast, ToastComponent } = useToast()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    nom: '', prenom: '', date_naissance: '', sexe: '',
    tel_whatsapp: '', tel_secondaire: '', email: '',
    adresse: '', allergies: '',
  })

  function set(key: string, val: string) { setForm(f => ({ ...f, [key]: val })) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nom.trim() || !form.prenom.trim()) { showToast('Nom et prénom obligatoires', 'er'); return }
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase.from('patients').insert({
      nom: form.nom.trim().toUpperCase(),
      prenom: form.prenom.trim(),
      date_naissance: form.date_naissance || null,
      sexe: form.sexe || null,
      tel_whatsapp: form.tel_whatsapp || null,
      tel_secondaire: form.tel_secondaire || null,
      email: form.email || null,
      adresse: form.adresse || null,
      allergies: form.allergies || null,
    }).select().single()
    setLoading(false)
    if (error) { showToast('Erreur : ' + error.message, 'er') }
    else { showToast('Patient enregistré !', 'ok'); router.push(`/doctor/patients/${data.id}`) }
  }

  return (
    <div className="animate-fadeIn">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px' }}>←</button>
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>👤 Nouveau patient</h2>
      </div>

      <form onSubmit={handleSubmit}>
        <Section title="Identité">
          <div className="form-row-2">
            <Field label="Nom *">
              <input value={form.nom} onChange={e => set('nom', e.target.value)} placeholder="DUPONT" required style={IS} />
            </Field>
            <Field label="Prénom *">
              <input value={form.prenom} onChange={e => set('prenom', e.target.value)} placeholder="Jean" required style={IS} />
            </Field>
          </div>
          <div className="form-row-2" style={{ marginTop: '14px' }}>
            <Field label="Date de naissance">
              <input type="date" value={form.date_naissance} onChange={e => set('date_naissance', e.target.value)} style={IS} />
            </Field>
            <Field label="Sexe">
              <select value={form.sexe} onChange={e => set('sexe', e.target.value)} style={IS}>
                <option value="">-- Choisir --</option>
                <option value="HOMME">Homme</option>
                <option value="FEMME">Femme</option>
                <option value="AUTRE">Autre</option>
              </select>
            </Field>
          </div>
        </Section>

        <Section title="Contact">
          <div className="form-row-2">
            <Field label="Tél WhatsApp">
              <input type="tel" value={form.tel_whatsapp} onChange={e => set('tel_whatsapp', e.target.value)} placeholder="+50947..." style={IS} />
            </Field>
            <Field label="Tél secondaire">
              <input type="tel" value={form.tel_secondaire} onChange={e => set('tel_secondaire', e.target.value)} placeholder="+50947..." style={IS} />
            </Field>
          </div>
          <div style={{ marginTop: '14px' }}>
            <Field label="Adresse email">
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="patient@email.com" style={IS} />
            </Field>
          </div>
          <div style={{ marginTop: '14px' }}>
            <Field label="Adresse">
              <textarea value={form.adresse} onChange={e => set('adresse', e.target.value)} placeholder="Adresse complète..." rows={2} style={{ ...IS, resize: 'none', height: '70px' }} />
            </Field>
          </div>
        </Section>

        <Section title="Informations médicales">
          <Field label="Allergies connues ou traitements en cours">
            <textarea
              value={form.allergies}
              onChange={e => set('allergies', e.target.value)}
              placeholder="Ex: Pénicilline, Aspirine, Diabète type 2..."
              rows={3}
              style={{ ...IS, resize: 'none', height: '90px' }}
            />
          </Field>
          {form.allergies && (
            <div style={{ marginTop: '8px', padding: '10px 14px', background: '#fff8e1', borderRadius: '8px', fontSize: '12px', color: '#e65100' }}>
              ⚠️ Ce patient sera signalé avec une alerte allergies
            </div>
          )}
        </Section>

        <button type="submit" disabled={loading} style={{
          width: '100%', padding: '16px', border: 'none', borderRadius: '12px',
          background: loading ? '#81c784' : '#2e7d32', color: '#fff',
          fontSize: '16px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
          marginTop: '8px',
        }}>
          {loading ? '⏳ Enregistrement...' : '✅ Créer le patient'}
        </button>
      </form>

      <ToastComponent />
      <style>{`
        .form-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        @media (max-width: 480px) { .form-row-2 { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  )
}

const IS: React.CSSProperties = {
  width: '100%', padding: '12px 14px', border: '1.5px solid #e0e0e0',
  borderRadius: '10px', fontSize: '15px', outline: 'none', boxSizing: 'border-box', background: '#fff', color: '#212121',
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#757575', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>{label}</label>
      {children}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', borderRadius: '14px', padding: '18px', marginBottom: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
      <h3 style={{ margin: '0 0 16px', fontSize: '13px', fontWeight: 700, color: '#2e7d32', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</h3>
      {children}
    </div>
  )
}
