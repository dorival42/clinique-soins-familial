import { createClient } from '@/lib/supabase/server'

const actionIcons: Record<string, string> = {
  LOGIN: '🔑', LOGOUT: '🚪', INSERT: '➕', UPDATE: '✏️', DELETE: '🗑️',
}
const actionColors: Record<string, string> = {
  LOGIN: '#1565c0', LOGOUT: '#757575', INSERT: '#2e7d32', UPDATE: '#e65100', DELETE: '#c62828',
}

export default async function AuditPage() {
  const supabase = await createClient()
  const { data: logs } = await supabase
    .from('audit_logs')
    .select('*, profile:profiles(full_name, role)')
    .order('created_at', { ascending: false })
    .limit(100)

  const logList = logs ?? []

  return (
    <div className="animate-fadeIn">
      <h2 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: 700 }}>🔍 Audit — Journal des actions</h2>

      {/* Filtres résumé */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '8px', marginBottom: '20px' }}>
        {['LOGIN', 'INSERT', 'UPDATE', 'DELETE'].map(a => {
          const count = logList.filter((l: { action: string }) => l.action === a).length
          return (
            <div key={a} style={{ background: '#fff', borderRadius: '12px', padding: '12px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
              <div style={{ fontSize: '18px' }}>{actionIcons[a]}</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: actionColors[a] }}>{count}</div>
              <div style={{ fontSize: '10px', color: '#757575', textTransform: 'uppercase', letterSpacing: '0.3px' }}>{a}</div>
            </div>
          )
        })}
      </div>

      <div style={{ background: '#fff', borderRadius: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #f0f2f5', fontWeight: 700, fontSize: '14px' }}>
          {logList.length} entrées
        </div>

        {logList.length === 0 ? (
          <p style={{ padding: '32px', textAlign: 'center', color: '#757575', fontSize: '13px' }}>Aucun log disponible</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f8f9fa' }}>
                  {['Action', 'Utilisateur', 'Table', 'Date / Heure'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#757575', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logList.map((log: {
                  id: string
                  action: string
                  table_name?: string
                  created_at: string
                  profile?: { full_name: string; role: string }
                }, i: number) => (
                  <tr key={log.id} style={{ borderTop: '1px solid #f0f2f5', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                        padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700,
                        background: `${actionColors[log.action]}15`,
                        color: actionColors[log.action] ?? '#757575',
                      }}>
                        {actionIcons[log.action] ?? '•'} {log.action}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 600 }}>{log.profile?.full_name ?? 'Système'}</div>
                      {log.profile?.role && <div style={{ fontSize: '11px', color: '#9e9e9e' }}>{log.profile.role}</div>}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#757575' }}>{log.table_name ?? '—'}</td>
                    <td style={{ padding: '12px 16px', color: '#757575', whiteSpace: 'nowrap' }}>
                      {new Date(log.created_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
