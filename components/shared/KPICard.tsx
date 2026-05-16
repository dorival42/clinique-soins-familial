interface KPICardProps {
  icon: string
  value: string
  label: string
  color?: string
  bg?: string
}

export default function KPICard({ icon, value, label, color = '#1565c0', bg = '#e3f2fd' }: KPICardProps) {
  return (
    <div style={{
      background: '#fff',
      borderRadius: '14px',
      padding: '18px 14px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.10)',
      textAlign: 'center',
      borderTop: `3px solid ${color}`,
    }}>
      <div style={{ fontSize: '24px', marginBottom: '8px' }}>{icon}</div>
      <div style={{ fontSize: '20px', fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '10px', color: '#757575', marginTop: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {label}
      </div>
    </div>
  )
}
