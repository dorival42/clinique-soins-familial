'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatHTG, convertToHTG, todayIso } from '@/lib/utils'
import AmountInput from '@/components/shared/AmountInput'
import Autocomplete from '@/components/shared/Autocomplete'
import { useToast } from '@/components/shared/Toast'

interface Sale { id: string; description: string; montant_htg: number; devise: string; date_vente: string; notes?: string }

export default function PharmaciePage() {
  const [date, setDate] = useState(todayIso())
  const [description, setDescription] = useState('')
  const [descriptions, setDescriptions] = useState<string[]>([])
  const [amount, setAmount] = useState('')
  const [devise, setDevise] = useState<'HTG' | 'USD'>('HTG')
  const [notes, setNotes] = useState('')
  const [taux, setTaux] = useState(135)
  const [loading, setLoading] = useState(false)
  const [todayList, setTodayList] = useState<Sale[]>([])
  const { showToast, ToastComponent } = useToast()
  const supabase = createClient()

  const loadData = useCallback(async () => {
    const [rateRes, descRes, todayRes] = await Promise.all([
      supabase.from('exchange_rates').select('taux_usd_htg').order('updated_at', { ascending: false }).limit(1).single(),
      supabase.from('pharmacy_sales').select('description').order('created_at', { ascending: false }),
      supabase.from('pharmacy_sales').select('*').eq('date_vente', todayIso()).order('created_at', { ascending: false }),
    ])
    setTaux(rateRes.data?.taux_usd_htg ?? 135)
    const unique = [...new Set((descRes.data ?? []).map((r: { description: string }) => r.description))].slice(0, 200)
    setDescriptions(unique)
    setTodayList(todayRes.data ?? [])
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const descOptions = descriptions.map(d => ({ value: d, label: d, icon: '💊' }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!description.trim()) { showToast('Description obligatoire', 'er'); return }
    if (!amount || parseFloat(amount) <= 0) { showToast('Montant invalide', 'er'); return }

    setLoading(true)
    const montantHTG = convertToHTG(parseFloat(amount), devise, taux)

    const { error } = await supabase.from('pharmacy_sales').insert({
      description: description.trim(),
      montant: parseFloat(amount),
      devise, montant_htg: montantHTG,
      taux_applique: taux,
      notes: notes.trim() || null,
      date_vente: date,
    })

    setLoading(false)
    if (error) { showToast('Erreur : ' + error.message, 'er') }
    else {
      showToast(`Vente enregistrée (${formatHTG(montantHTG)} HTG)`, 'ok')
      setAmount(''); setNotes(''); setDescription('')
      await loadData()
    }
  }

  return (
    <div className="animate-fadeIn">
      <div style={{ background: '#fff', borderRadius: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.10)', padding: '20px 18px', marginBottom: '16px' }}>
        <h2 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
          💊 Nouvelle vente pharmacie
        </h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '14px' }}>
            <label style={labelStyle}>Date *</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} required style={inputStyle} />
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={labelStyle}>Description *</label>
            <Autocomplete
              value={description}
              onChange={setDescription}
              options={descOptions}
              placeholder="Ex: Amoxicilline, Paracétamol, Sérum..."
              required
            />
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={labelStyle}>Montant *</label>
            <AmountInput value={amount} onChange={setAmount} devise={devise} onDeviseChange={setDevise} taux={taux} color="#6a1b9a" />
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={labelStyle}>Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Remarques optionnelles..." rows={2} style={{ ...inputStyle, resize: 'none', height: '70px' }} />
          </div>

          <button type="submit" disabled={loading} style={{
            width: '100%', marginTop: '6px', padding: '16px', border: 'none', borderRadius: '12px',
            background: loading ? '#ce93d8' : '#6a1b9a', color: '#fff', fontSize: '16px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
          }}>
            {loading ? '⏳ Enregistrement...' : '💊 Enregistrer la vente'}
          </button>
        </form>
      </div>

      <div style={{ background: '#fff', borderRadius: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.10)', overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #f0f2f5', fontWeight: 700, fontSize: '14px' }}>
          📋 Ventes d&apos;aujourd&apos;hui ({todayList.length})
        </div>
        {todayList.length === 0 ? (
          <p style={{ padding: '24px', textAlign: 'center', color: '#757575', fontSize: '13px' }}>Aucune vente aujourd&apos;hui</p>
        ) : (
          <div style={{ padding: '0 16px' }}>
            {todayList.map(r => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0', borderBottom: '1px solid #f0f2f5' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#f3e5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>💊</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600 }}>{r.description}</div>
                  <div style={{ fontSize: '11px', color: '#757575' }}>Pharmacie · {r.devise}</div>
                </div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#6a1b9a' }}>{formatHTG(r.montant_htg)} HTG</div>
              </div>
            ))}
          </div>
        )}
      </div>
      <ToastComponent />
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', border: '1.5px solid #e0e0e0',
  borderRadius: '10px', fontSize: '15px', outline: 'none', boxSizing: 'border-box', background: '#fff', color: '#212121',
}
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '11px', fontWeight: 700, color: '#757575',
  textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px',
}
