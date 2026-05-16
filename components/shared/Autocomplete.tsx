'use client'

import { useState, useRef, useEffect } from 'react'

interface Option {
  value: string
  label: string
  sublabel?: string
  icon?: string
}

interface AutocompleteProps {
  value: string
  onChange: (val: string) => void
  options: Option[]
  placeholder?: string
  required?: boolean
  onSelect?: (option: Option) => void
}

export default function Autocomplete({ value, onChange, options, placeholder, required, onSelect }: AutocompleteProps) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  const filtered = value.length >= 1
    ? options.filter(o =>
        o.label.toLowerCase().includes(value.toLowerCase()) ||
        (o.sublabel?.toLowerCase().includes(value.toLowerCase()))
      ).slice(0, 8)
    : []

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function highlight(text: string, query: string): React.ReactNode {
    if (!query) return text
    const i = text.toLowerCase().indexOf(query.toLowerCase())
    if (i < 0) return text
    return <>
      {text.slice(0, i)}
      <strong style={{ color: '#3949ab' }}>{text.slice(i, i + query.length)}</strong>
      {text.slice(i + query.length)}
    </>
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <input
        type="text"
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        required={required}
        style={{
          width: '100%',
          padding: '12px 14px',
          border: '1.5px solid #e0e0e0',
          borderRadius: '10px',
          fontSize: '15px',
          outline: 'none',
          boxSizing: 'border-box',
          transition: 'border-color 0.2s',
        }}
        onFocusCapture={e => (e.target.style.borderColor = '#3949ab')}
        onBlurCapture={e => (e.target.style.borderColor = '#e0e0e0')}
      />
      {open && filtered.length > 0 && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          left: 0, right: 0,
          background: '#fff',
          border: '1.5px solid #3949ab',
          borderRadius: '10px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.13)',
          maxHeight: '220px',
          overflowY: 'auto',
          zIndex: 500,
          animationName: 'fadeIn',
          animationDuration: '0.15s',
        }}>
          {filtered.map((opt, i) => (
            <div
              key={i}
              onMouseDown={() => {
                onChange(opt.label)
                onSelect?.(opt)
                setOpen(false)
              }}
              style={{
                padding: '11px 14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                borderBottom: i < filtered.length - 1 ? '1px solid #f5f5f5' : 'none',
                transition: 'background 0.12s',
              }}
              onMouseEnter={e => ((e.currentTarget as HTMLDivElement).style.background = '#e3f2fd')}
              onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.background = 'transparent')}
            >
              {opt.icon && <span style={{ fontSize: '16px' }}>{opt.icon}</span>}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '14px', fontWeight: 600 }}>
                  {highlight(opt.label, value)}
                </div>
                {opt.sublabel && (
                  <div style={{ fontSize: '12px', color: '#757575' }}>{opt.sublabel}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
