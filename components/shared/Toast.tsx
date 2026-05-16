'use client'

import { useEffect, useState } from 'react'

export type ToastType = 'ok' | 'er' | 'in'

interface ToastProps {
  message: string
  type: ToastType
  onClose: () => void
}

export function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500)
    return () => clearTimeout(t)
  }, [onClose])

  const colors = { ok: '#2e7d32', er: '#c62828', in: '#1565c0' }

  return (
    <div style={{
      position: 'fixed',
      bottom: '80px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: colors[type],
      color: '#fff',
      padding: '13px 20px',
      borderRadius: '12px',
      fontSize: '14px',
      fontWeight: 600,
      zIndex: 1000,
      boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
      maxWidth: '90vw',
      textAlign: 'center',
      animation: 'fadeIn 0.3s ease-out',
    }}>
      {message}
    </div>
  )
}

export function useToast() {
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)

  function showToast(message: string, type: ToastType = 'in') {
    setToast({ message, type })
  }

  function ToastComponent() {
    if (!toast) return null
    return <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
  }

  return { showToast, ToastComponent }
}
