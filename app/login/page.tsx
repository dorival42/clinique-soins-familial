'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) {
      setError(authError.message)
      setLoading(false)
    } else {
      router.refresh()
      router.push('/')
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #1a237e 0%, #3949ab 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
    }}>
      <div style={{
        background: '#fff',
        borderRadius: '20px',
        padding: '40px 32px',
        width: '100%',
        maxWidth: '380px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '48px', lineHeight: 1, marginBottom: '12px' }}>🏥</div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#1a237e' }}>
            Clinique Familiale
          </h1>
          <p style={{ margin: '6px 0 0', color: '#757575', fontSize: '13px' }}>
            Connectez-vous à votre espace
          </p>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: '#ffebee',
            color: '#c62828',
            padding: '12px 16px',
            borderRadius: '10px',
            fontSize: '13px',
            marginBottom: '20px',
            fontWeight: 500,
          }}>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '11px',
              fontWeight: 700,
              color: '#757575',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '6px',
            }}>
              Adresse email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="votre@email.com"
              required
              autoComplete="email"
              style={{
                width: '100%',
                padding: '14px',
                border: '1.5px solid #e0e0e0',
                borderRadius: '10px',
                fontSize: '15px',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box',
              }}
              onFocus={e => (e.target.style.borderColor = '#3949ab')}
              onBlur={e => (e.target.style.borderColor = '#e0e0e0')}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '11px',
              fontWeight: 700,
              color: '#757575',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '6px',
            }}>
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              style={{
                width: '100%',
                padding: '14px',
                border: '1.5px solid #e0e0e0',
                borderRadius: '10px',
                fontSize: '15px',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box',
              }}
              onFocus={e => (e.target.style.borderColor = '#3949ab')}
              onBlur={e => (e.target.style.borderColor = '#e0e0e0')}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '16px',
              border: 'none',
              borderRadius: '12px',
              background: loading ? '#9fa8da' : '#1a237e',
              color: '#fff',
              fontSize: '16px',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s',
            }}
          >
            {loading ? '⏳ Connexion...' : 'Se connecter'}
          </button>
        </form>

        <p style={{ marginTop: '24px', textAlign: 'center', fontSize: '12px', color: '#9e9e9e' }}>
          Clinique des Soins et du Bien-Être Familial
        </p>
      </div>
    </div>
  )
}
