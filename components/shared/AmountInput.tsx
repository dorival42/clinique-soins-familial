'use client'

import { useState } from 'react'
import { formatHTG } from '@/lib/utils'

interface AmountInputProps {
  value: string
  onChange: (val: string) => void
  devise: 'HTG' | 'USD'
  onDeviseChange: (d: 'HTG' | 'USD') => void
  taux: number
  color?: string
}

export default function AmountInput({ value, onChange, devise, onDeviseChange, taux, color = '#2e7d32' }: AmountInputProps) {
  const amount = parseFloat(value) || 0
  const converted = devise === 'USD'
    ? `≈ ${formatHTG(Math.round(amount * taux))} HTG`
    : amount > 0 ? `≈ ${(amount / taux).toFixed(2)} USD` : ''

  return (
    <div>
      <div style={{ position: 'relative' }}>
        <input
          type="number"
          value={value}
          onChange={e => onChange(e.target.value)}
          min="0.01"
          step="0.01"
          placeholder="0.00"
          required
          style={{
            width: '100%',
            padding: '14px 100px 14px 14px',
            border: '1.5px solid #e0e0e0',
            borderRadius: '10px',
            fontSize: '18px',
            fontWeight: 700,
            outline: 'none',
            boxSizing: 'border-box',
          }}
          onFocus={e => (e.target.style.borderColor = color)}
          onBlur={e => (e.target.style.borderColor = '#e0e0e0')}
        />
        <div style={{
          position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)',
          display: 'flex', borderRadius: '7px', overflow: 'hidden',
          border: '1px solid #e0e0e0', background: '#f5f5f5',
        }}>
          {(['HTG', 'USD'] as const).map(d => (
            <button
              key={d}
              type="button"
              onClick={() => onDeviseChange(d)}
              style={{
                padding: '7px 10px',
                border: 'none',
                background: devise === d ? color : 'transparent',
                color: devise === d ? '#fff' : '#757575',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {d}
            </button>
          ))}
        </div>
      </div>
      {converted && (
        <p style={{ fontSize: '12px', color: '#757575', marginTop: '5px', minHeight: '16px' }}>
          {converted}
        </p>
      )}
    </div>
  )
}
