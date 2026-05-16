'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatHTG, convertToHTG, todayIso } from '@/lib/utils'
import AmountInput from '@/components/shared/AmountInput'
import Autocomplete from '@/components/shared/Autocomplete'
import { useToast } from '@/components/shared/Toast'

interface Category { id: string; nom: string }
interface Expense { id: string; description: string; categorie_nom?: string; montant_htg: number; devise: string; date_depense: string; notes?: string }

export default function DepensesPage() {
  const [date, setDate] = useState(todayIso())
  const [categories, setCategories] = useState<Category[]>([])
  const [catId, setCatId] = useState('')
  const [newCat, setNewCat] = useState('')
  const [showNewCat, setShowNewCat] = useState(false)
  const [description, setDescription] = useState('')
  const [descriptions, setDescriptions] = useState<string[]>([])
  const [amount, setAmount] = useState('')
  const [devise, setDevise] = useState<'HTG' | 'USD'>('HTG')
  const [notes, setNotes] = useState('')
  const [taux, setTaux] = useState(135)
  const [loading, setLoading] = useState(false)
  const [todayList, setTodayList] = useState<Expense[]>([])
  const { showToast, ToastComponent } = useToast()
  const supabase = createClient()

  const loadData = useCallback(async () => {
    const [catRes, rateRes, descRes, todayRes] = await Promise.all([
      supabase.from('finance_categories').select('*').eq('type', 'Dépense').eq('active', true).order('nom'),
      supabase.from('exchange_rates').select('taux_usd_htg').order('updated_at', { ascending: false }).limit(1).single(),
      supabase.from('expenses').select('description').order('created_at', { ascending: false }),
      supabase.from('expenses').select('*').eq('date_depense', todayIso()).order('created_at', { ascending: false }),
    ])
    setCategories(catRes.data ?? [])
    setTaux(rateRes.data?.taux_usd_htg ?? 135)
    const unique = [...new Set((descRes.data ?? []).map((r: { description: string }) => r.description))].slice(0, 200)
    setDescriptions(unique)
    setTodayList(todayRes.data ?? [])
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const descOptions = descriptions.map(d => ({ value: d, label: d, icon: '📝' }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const catNom = showNewCat ? newCat.trim() : categories.find(c => c.id === catId)?.nom ?? ''
    if (!catNom) { showToast('Choisissez une catégorie', 'er'); return }
    if (!description.trim()) { showToast('Description obligatoire', 'er'); return }

    setLoading(true)
    const montantHTG = convertToHTG(parseFloat(amount), devise, taux)

    if (showNewCat && newCat.trim()) {
      await supabase.from('finance_categories').insert({ type: 'Dépense', nom: newCat.trim() })
    }

    const { error } = await supabase.from('expenses').insert({
      description: description.trim(),
      categorie_nom: catNom,
      montant: parseFloat(amount),
      devise, montant_htg: montantHTG,
      taux_applique: taux,
      notes: notes.trim() || null,
      date_depense: date,
    })

    setLoading(false)
    if (error) { showToast('Erreur : ' + error.message, 'er') }
    else {
      showToast(`Dépense enregistrée (${formatHTG(montantHTG)} HTG)`, 'ok')
      setAmount(''); setNotes(''); setDescription(''); setNewCat(''); setShowNewCat(false); setCatId('')
      await loadData()
    }
  }

  return (
    <div className="animate-fadeIn">
      <div style={{ background: '#fff', borderRadius: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.10)', padding: '20px 18px', marginBottom: '16px' }}>
        <h2 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
          📤 Nouvelle dépense
        </h2>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }} className="form-row">
            <Field label="Date *">
              <input type="date" value={date} onChange={e => setDate(e.target.value)} required style={inputStyle} />
            </Field>
            <Field label="Catégorie *">
              <select
                value={catId}
                onChange={e => { setCatId(e.target.value); setShowNewCat(e.target.value === '__new__') }}
                required={!showNewCat}
                style={inputStyle}
              >
                <option value="">-- Choisir --</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                <option value="__new__">➕ Nouvelle catégorie</option>
              </select>
              {showNewCat && (
                <div style={{ marginTop: '8px' }}>
                  <input type="text" value={newCat} onChange={e => setNewCat(e.target.value)} placeholder="Nom de la catégorie..." style={{ ...inputStyle, borderColor: '#e65100' }} />
                  <small style={{ fontSize: '11px', color: '#e65100', marginTop: '4px', display: 'block' }}>⚡ Sera enregistrée automatiquement</small>
                </div>
              )}
            </Field>
          </div>

          <div style={{ marginTop: '14px' }}>
            <Field label="Description *">
              <Autocomplete
                value={description}
                onChange={setDescription}
                options={descOptions}
                placeholder="Ex: Fournitures, Électricité, Salaire..."
                required
              />
            </Field>
          </div>

          <div style={{ marginTop: '14px' }}>
            <Field label="Montant *">
              <AmountInput value={amount} onChange={setAmount} devise={devise} onDeviseChange={setDevise} taux={taux} color="#c62828" />
            </Field>
          </div>

          <div style={{ marginTop: '14px' }}>
            <Field label="Notes">
              <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Remarques optionnelles..." rows={2} style={{ ...inputStyle, resize: 'none', height: '70px' }} />
            </Field>
          </div>

          <button type="submit" disabled={loading} style={{
            width: '100%', marginTop: '8px', padding: '16px', border: 'none', borderRadius: '12px',
            background: loading ? '#ef9a9a' : '#c62828', color: '#fff', fontSize: '16px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
          }}>
            {loading ? '⏳ Enregistrement...' : '❌ Enregistrer la dépense'}
          </button>
        </form>
      </div>

      <div style={{ background: '#fff', borderRadius: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.10)', overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #f0f2f5', fontWeight: 700, fontSize: '14px' }}>
          📋 Dépenses d&apos;aujourd&apos;hui ({todayList.length})
        </div>
        {todayList.length === 0 ? (
          <p style={{ padding: '24px', textAlign: 'center', color: '#757575', fontSize: '13px' }}>Aucune dépense aujourd&apos;hui</p>
        ) : (
          <div style={{ padding: '0 16px' }}>
            {todayList.map(r => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0', borderBottom: '1px solid #f0f2f5' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#ffebee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>📤</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600 }}>{r.description}</div>
                  <div style={{ fontSize: '11px', color: '#757575' }}>{r.categorie_nom} · {r.devise}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#c62828' }}>-{formatHTG(r.montant_htg)} HTG</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ToastComponent />
      <style>{`@media (max-width: 480px) { .form-row { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
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
