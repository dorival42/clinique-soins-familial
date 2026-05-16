'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { UserRole } from '@/lib/types/database'

interface NavItem {
  href: string
  icon: string
  label: string
  roles: UserRole[]
}

const NAV_ITEMS: NavItem[] = [
  { href: '/finance',          icon: '🏠', label: 'Accueil',    roles: ['finance', 'admin'] },
  { href: '/finance/recettes', icon: '📥', label: 'Recette',    roles: ['finance', 'admin'] },
  { href: '/finance/pharmacie',icon: '💊', label: 'Pharmacie',  roles: ['finance', 'admin'] },
  { href: '/finance/depenses', icon: '📤', label: 'Dépense',    roles: ['finance', 'admin'] },
  { href: '/finance/rapport',  icon: '📊', label: 'Rapport',    roles: ['finance', 'admin'] },
  { href: '/doctor',           icon: '🏠', label: 'Accueil',    roles: ['doctor', 'admin'] },
  { href: '/doctor/patients',  icon: '👥', label: 'Patients',   roles: ['doctor', 'admin'] },
  { href: '/doctor/records/new',icon:'📋', label: 'Consultation',roles: ['doctor', 'admin'] },
  { href: '/doctor/errors',    icon: '⚠️', label: 'Erreurs',    roles: ['doctor', 'admin'] },
  { href: '/admin',            icon: '📊', label: 'Dashboard',  roles: ['admin'] },
  { href: '/admin/users',      icon: '👥', label: 'Utilisateurs',roles: ['admin'] },
  { href: '/admin/alerts',     icon: '🚨', label: 'Alertes',    roles: ['admin'] },
  { href: '/admin/reports',    icon: '⚠️', label: 'Rapports',   roles: ['admin'] },
  { href: '/admin/audit',      icon: '🔍', label: 'Audit',      roles: ['admin'] },
]

interface AppLayoutProps {
  children: React.ReactNode
  role: UserRole
  userName: string
  taux?: number
  onTauxClick?: () => void
  section: 'finance' | 'doctor' | 'admin'
}

export default function AppLayout({ children, role, userName, taux, onTauxClick, section }: AppLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  const navItems = NAV_ITEMS.filter(item =>
    item.roles.includes(role) && item.href.startsWith('/' + section)
  )

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const SECTION_COLORS = {
    finance: '#1a237e',
    doctor: '#1b5e20',
    admin: '#37474f',
  }
  const headerBg = SECTION_COLORS[section]

  const SECTION_LABELS = {
    finance: '💰 Gestion Financière',
    doctor: '🩺 Espace Médecin',
    admin: '🧑‍💼 Administration',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

      {/* TOP BAR */}
      <header style={{
        background: headerBg,
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        zIndex: 200,
        boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            style={{
              display: 'none',
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              color: '#fff',
              padding: '8px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '18px',
            }}
            className="mobile-menu-btn"
          >
            ☰
          </button>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>
              {SECTION_LABELS[section]}
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginTop: '1px' }}>
              {userName}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {section === 'finance' && taux !== undefined && (
            <button
              onClick={onTauxClick}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                background: 'rgba(255,255,255,0.12)',
                border: 'none',
                borderRadius: '20px',
                padding: '6px 12px',
                cursor: 'pointer',
                color: '#fff',
                fontSize: '12px',
              }}
            >
              <span>1 USD =</span>
              <strong style={{ fontSize: '13px' }}>{taux}</strong>
              <span>HTG ✎</span>
            </button>
          )}
          <button
            onClick={handleLogout}
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              color: '#fff',
              padding: '7px 12px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600,
            }}
          >
            ⏻ Quitter
          </button>
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* SIDEBAR — desktop */}
        <nav style={{
          width: '220px',
          background: '#fff',
          borderRight: '1px solid #e0e0e0',
          flexShrink: 0,
          overflowY: 'auto',
          padding: '16px 0',
        }} className="desktop-sidebar">
          {navItems.map(item => {
            const active = pathname === item.href || (item.href !== '/' + section && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '13px 20px',
                  color: active ? headerBg : '#757575',
                  fontWeight: active ? 700 : 400,
                  fontSize: '14px',
                  textDecoration: 'none',
                  background: active ? (section === 'finance' ? '#e3f2fd' : section === 'doctor' ? '#e8f5e9' : '#eceff1') : 'transparent',
                  borderLeft: active ? `3px solid ${headerBg}` : '3px solid transparent',
                  transition: 'all 0.15s',
                }}
              >
                <span style={{ fontSize: '18px' }}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* MOBILE DRAWER */}
        {mobileOpen && (
          <>
            <div
              onClick={() => setMobileOpen(false)}
              style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                zIndex: 300, display: 'none',
              }}
              className="mobile-overlay"
            />
            <nav style={{
              position: 'fixed', top: '60px', left: 0, bottom: 0,
              width: '240px',
              background: '#fff',
              boxShadow: '2px 0 12px rgba(0,0,0,0.15)',
              zIndex: 400,
              padding: '16px 0',
              overflowY: 'auto',
              display: 'none',
            }} className="mobile-drawer">
              {navItems.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '14px 20px',
                    color: pathname === item.href ? headerBg : '#757575',
                    fontWeight: pathname === item.href ? 700 : 400,
                    fontSize: '15px',
                    textDecoration: 'none',
                  }}
                >
                  <span style={{ fontSize: '20px' }}>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
          </>
        )}

        {/* MAIN CONTENT */}
        <main style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px',
          paddingBottom: '80px',
        }} className="main-content">
          <div style={{ maxWidth: '960px', margin: '0 auto' }}>
            {children}
          </div>
        </main>
      </div>

      {/* BOTTOM NAV — mobile only */}
      <nav style={{
        position: 'fixed',
        bottom: 0, left: 0, right: 0,
        height: '64px',
        background: '#fff',
        borderTop: '1px solid #e0e0e0',
        display: 'none',
        alignItems: 'stretch',
        zIndex: 200,
        boxShadow: '0 -2px 12px rgba(0,0,0,0.08)',
      }} className="mobile-bottom-nav">
        {navItems.map(item => {
          const active = pathname === item.href || (item.href !== '/' + section && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '3px',
                color: active ? headerBg : '#757575',
                textDecoration: 'none',
                fontSize: '9px',
                fontWeight: active ? 700 : 400,
                padding: '6px 2px',
                position: 'relative',
                borderTop: active ? `3px solid ${headerBg}` : '3px solid transparent',
              }}
            >
              <span style={{ fontSize: '20px', lineHeight: 1 }}>{item.icon}</span>
              <span style={{ letterSpacing: '0.3px' }}>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <style>{`
        @media (max-width: 768px) {
          .desktop-sidebar { display: none !important; }
          .mobile-bottom-nav { display: flex !important; }
          .mobile-menu-btn { display: block !important; }
          .mobile-overlay { display: block !important; }
          .mobile-drawer { display: block !important; }
          .main-content { padding: 12px !important; padding-bottom: 80px !important; }
        }
        @media (max-width: 480px) {
          .main-content { padding: 8px !important; padding-bottom: 76px !important; }
        }
      `}</style>
    </div>
  )
}
