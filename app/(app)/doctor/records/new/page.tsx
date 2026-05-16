'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/shared/Toast'
import Autocomplete from '@/components/shared/Autocomplete'
import { todayIso } from '@/lib/utils'

interface Patient { id: string; nom: string; prenom: string; allergies?: string }
interface Service { id: string; nom: string; parent_id?: string }

function NewRecordForm() {
  const router = useRouter()
  const params = useSearchParams()
  const { showToast, ToastComponent } = useToast()
  const supabase = createClient()

  const [patientSearch, setPatientSearch] = useState('')
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [patients, setPatients] = useState<Patient[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [form, setForm] = useState({
    date: todayIso(),
    motif: '',
    diagnostic: '',
    traitement: '',
    notes: '',
    status: 'completed' as 'pending' | 'completed' | 'cancelled',
  })
  const [loading, setLoading] = useState(false)
  const [customFields, setCustomFields] = useState<Array<{ key: string; value: string }>>([])

  const loadData = useCallback(async () => {
    const patientId = params.get('patient')
    const [patRes, svcRes] = await Promise.all([
      supabase.from('patients').select('id, nom, prenom, allergies').order('nom'),
      supabase.from('services').select('*').eq('active', true).order('nom'),
    ])
    setPatients(patRes.data ?? [])
    setServices(svcRes.data ?? [])

    if (patientId) {
      const { data } = await supabase.from('patients').select('id, nom, prenom, allergies').eq('id', patientId).single()
      if (data) { setSelectedPatient(data); setPatientSearch(`${data.nom} ${data.prenom}`) }
    }
  }, [params])

  useEffect(() => { loadData() }, [loadData])

  const patOptions = patients.map(p => ({
    value: p.id,
    label: p.nom,
    sublabel: p.prenom,
    icon: '👤',
  }))

  function toggleService(id: string) {
    setSelectedServices(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id])
  }

  function addCustomField() {
    setCustomFields(f => [...f, { key: '', value: '' }])
  }

  function updateCustomField(i: number, field: 'key' | 'value', val: string) {
    setCustomFields(f => f.map((item, idx) => idx === i ? { ...item, [field]: val } : item))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedPatient) { showToast('Sélectionnez un patient', 'er'); return }

    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

    const customObj = Object.fromEntries(customFields.filter(f => f.key).map(f => [f.key, f.value]))

    const { data: record, error } = await supabase.from('medical_records').insert({
      patient_id: selectedPatient.id,
      doctor_id: user!.id,
      date_consultation: form.date,
      motif: form.motif || null,
      diagnostic: form.diagnostic || null,
      traitement: form.traitement || null,
      notes: form.notes || null,
      status: form.status,
      custom_fields: customObj,
    }).select().single()

    if (error) { setLoading(false); showToast('Erreur : ' + error.message, 'er'); return }

    if (selectedServices.length > 0) {
      await supabase.from('record_services').insert(
        selectedServices.map(sid => ({ record_id: record.id, service_id: sid, status: 'performed' }))
      )
    }

    setLoading(false)
    showToast('Dossier créé avec succès !', 'ok')
    setTimeout(() => router.push(`/doctor/patients/${selectedPatient.id}`), 1200)
  }

  const rootServices = services.filter(s => !s.parent_id)

  return (
    <div className="animate-fadeIn">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px' }}>←</button>
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>📋 Nouvelle consultation</h2>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Patient */}
        <div style={{ background: '#fff', borderRadius: '14px', padding: '18px', marginBottom: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          <h3 style={{ margin: '0 0 14px', fontSize: '13px', fontWeight: 700, color: '#2e7d32', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Patient</h3>

          {selectedPatient ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#e8f5e9', borderRadius: '10px' }}>
              <span style={{ fontSize: '24px' }}>👤</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700 }}>{selectedPatient.nom} {selectedPatient.prenom}</div>
                {selectedPatient.allergies && <div style={{ fontSize: '12px', color: '#e65100', marginTop: '2px' }}>⚠️ {selectedPatient.allergies}</div>}
              </div>
              <button type="button" onClick={() => { setSelectedPatient(null); setPatientSearch('') }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c62828', fontWeight: 700, fontSize: '14px' }}>
                ✕ Changer
              </button>
            </div>
          ) : (
            <div>
              <Autocomplete
                value={patientSearch}
                onChange={setPatientSearch}
                options={patOptions}
                placeholder="Rechercher un patient..."
                onSelect={opt => {
                  const p = patients.find(p => p.id === opt.value)
                  if (p) { setSelectedPatient(p); setPatientSearch(`${p.nom} ${p.prenom}`) }
                }}
              />
              <div style={{ marginTop: '10px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: '#757575' }}>Patient inconnu ?</span>
                <button type="button" onClick={() => router.push('/doctor/patients/new')}
                  style={{ padding: '6px 12px', background: '#e8f5e9', color: '#2e7d32', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}>
                  + Créer nouveau
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Consultation */}
        <div style={{ background: '#fff', borderRadius: '14px', padding: '18px', marginBottom: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          <h3 style={{ margin: '0 0 14px', fontSize: '13px', fontWeight: 700, color: '#2e7d32', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Consultation</h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }} className="form-row-2">
            <div>
              <label style={LS}>Date *</label>
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required style={IS} />
            </div>
            <div>
              <label style={LS}>Statut</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as typeof form.status }))} style={IS}>
                <option value="completed">Terminée ✅</option>
                <option value="pending">En cours ⏳</option>
                <option value="cancelled">Annulée ❌</option>
              </select>
            </div>
          </div>

          <div style={{ marginTop: '14px' }}>
            <label style={LS}>Motif de consultation</label>
            <textarea value={form.motif} onChange={e => setForm(f => ({ ...f, motif: e.target.value }))} placeholder="Décrivez le motif de consultation..." rows={2} style={{ ...IS, resize: 'none', height: '70px' }} />
          </div>
          <div style={{ marginTop: '14px' }}>
            <label style={LS}>Diagnostic</label>
            <textarea value={form.diagnostic} onChange={e => setForm(f => ({ ...f, diagnostic: e.target.value }))} placeholder="Diagnostic médical..." rows={3} style={{ ...IS, resize: 'none', height: '90px' }} />
          </div>
          <div style={{ marginTop: '14px' }}>
            <label style={LS}>Traitement prescrit</label>
            <textarea value={form.traitement} onChange={e => setForm(f => ({ ...f, traitement: e.target.value }))} placeholder="Médicaments, posologie, durée..." rows={3} style={{ ...IS, resize: 'none', height: '90px' }} />
          </div>
          <div style={{ marginTop: '14px' }}>
            <label style={LS}>Notes complémentaires</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Observations, recommandations..." rows={2} style={{ ...IS, resize: 'none', height: '70px' }} />
          </div>
        </div>

        {/* Services */}
        {rootServices.length > 0 && (
          <div style={{ background: '#fff', borderRadius: '14px', padding: '18px', marginBottom: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
            <h3 style={{ margin: '0 0 14px', fontSize: '13px', fontWeight: 700, color: '#2e7d32', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Services effectués</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {rootServices.map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggleService(s.id)}
                  style={{
                    padding: '8px 16px', borderRadius: '20px', fontSize: '13px',
                    border: `1.5px solid ${selectedServices.includes(s.id) ? '#2e7d32' : '#e0e0e0'}`,
                    background: selectedServices.includes(s.id) ? '#e8f5e9' : '#fff',
                    color: selectedServices.includes(s.id) ? '#2e7d32' : '#757575',
                    cursor: 'pointer', fontWeight: selectedServices.includes(s.id) ? 700 : 400,
                    transition: 'all 0.15s',
                  }}
                >
                  {selectedServices.includes(s.id) ? '✓ ' : ''}{s.nom}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Champs personnalisés */}
        <div style={{ background: '#fff', borderRadius: '14px', padding: '18px', marginBottom: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#2e7d32', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Champs personnalisés</h3>
            <button type="button" onClick={addCustomField} style={{ padding: '6px 12px', background: '#e8f5e9', color: '#2e7d32', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}>
              + Ajouter
            </button>
          </div>
          {customFields.length === 0 ? (
            <p style={{ fontSize: '13px', color: '#9e9e9e', margin: 0 }}>Aucun champ personnalisé — cliquez sur &quot;+ Ajouter&quot;</p>
          ) : customFields.map((f, i) => (
            <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <input value={f.key} onChange={e => updateCustomField(i, 'key', e.target.value)} placeholder="Champ (ex: Tension)" style={{ ...IS, flex: 1 }} />
              <input value={f.value} onChange={e => updateCustomField(i, 'value', e.target.value)} placeholder="Valeur" style={{ ...IS, flex: 2 }} />
              <button type="button" onClick={() => setCustomFields(prev => prev.filter((_, idx) => idx !== i))}
                style={{ padding: '10px', background: '#ffebee', color: '#c62828', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}>
                ✕
              </button>
            </div>
          ))}
        </div>

        <button type="submit" disabled={loading || !selectedPatient} style={{
          width: '100%', padding: '16px', border: 'none', borderRadius: '12px',
          background: loading || !selectedPatient ? '#81c784' : '#2e7d32', color: '#fff',
          fontSize: '16px', fontWeight: 700, cursor: loading || !selectedPatient ? 'not-allowed' : 'pointer',
        }}>
          {loading ? '⏳ Enregistrement...' : '✅ Créer le dossier'}
        </button>
      </form>

      <ToastComponent />
      <style>{`.form-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; } @media (max-width: 480px) { .form-row-2 { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  )
}

export default function NewRecordPage() {
  return <Suspense><NewRecordForm /></Suspense>
}

const IS: React.CSSProperties = {
  width: '100%', padding: '12px 14px', border: '1.5px solid #e0e0e0',
  borderRadius: '10px', fontSize: '15px', outline: 'none', boxSizing: 'border-box', background: '#fff', color: '#212121',
}
const LS: React.CSSProperties = {
  display: 'block', fontSize: '11px', fontWeight: 700, color: '#757575',
  textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px',
}
