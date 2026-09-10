import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'

function fmt(n: number) {
  return `৳${Math.abs(n).toLocaleString('en-BD', { minimumFractionDigits: 0 })}`
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-BD', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true
  })
}

export default async function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = await createClient()

  // Look up the token
  const { data: shareToken } = await supabase
    .from('debt_share_tokens')
    .select('*')
    .eq('token', token)
    .single()

  if (!shareToken || new Date(shareToken.expires_at) < new Date()) notFound()

  // Fetch debts for this person using service role (owner's data)
  const { data: debts } = await supabase
    .from('finance_debts')
    .select('*')
    .eq('user_id', shareToken.user_id)
    .eq('person_name', shareToken.person_name)
    .order('transacted_at', { ascending: true })

  const items = debts ?? []
  const net = items.reduce((sum, d) => sum + (d.type === 'received' ? Number(d.amount) : -Number(d.amount)), 0)
  const totalGave = items.filter(d => d.type === 'gave').reduce((s, d) => s + Number(d.amount), 0)
  const totalGot = items.filter(d => d.type === 'received').reduce((s, d) => s + Number(d.amount), 0)

  return (
    <div style={{ minHeight: '100vh', background: '#F7F6F1', padding: '24px 16px', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <p style={{ fontSize: '0.8rem', color: '#8C8A80', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
            Debt Summary with
          </p>
          <h1 style={{ fontFamily: 'Source Serif 4, Georgia, serif', fontSize: '2rem', fontWeight: 400, color: '#1E1F1C', margin: '0 0 4px' }}>
            {shareToken.person_name}
          </h1>
          <p style={{ fontSize: '0.82rem', color: '#8C8A80', margin: 0 }}>
            Shared by Adnan · Generated {new Date(shareToken.created_at).toLocaleDateString('en-BD', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>

        {/* Net Balance Card */}
        <div style={{
          background: net >= 0 ? '#E3F0EA' : 'rgba(229,62,62,0.1)',
          border: `1px solid ${net >= 0 ? '#0B6E4F' : '#e53e3e'}`,
          borderRadius: 12, padding: '20px 24px', marginBottom: 20, textAlign: 'center'
        }}>
          <p style={{ fontSize: '0.8rem', color: net >= 0 ? '#084F39' : '#c53030', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 8px' }}>
            Net Balance
          </p>
          <p style={{ fontSize: '2rem', fontWeight: 700, color: net >= 0 ? '#084F39' : '#c53030', margin: 0 }}>
            {net > 0 ? `+${fmt(net)}` : net < 0 ? `-${fmt(Math.abs(net))}` : 'Even — all settled!'}
          </p>
          {net !== 0 && (
            <p style={{ fontSize: '0.85rem', color: net >= 0 ? '#084F39' : '#c53030', margin: '8px 0 0', opacity: 0.8 }}>
              {net > 0 ? `Adnan received ${fmt(net)} more than he gave` : `Adnan gave ${fmt(Math.abs(net))} more than he received`}
            </p>
          )}
        </div>

        {/* Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
          <div style={{ background: 'white', border: '1px solid #E3E0D5', borderRadius: 10, padding: 16 }}>
            <p style={{ fontSize: '0.75rem', color: '#8C8A80', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px' }}>Adnan Gave</p>
            <p style={{ fontSize: '1.3rem', fontWeight: 700, color: '#c53030', margin: 0 }}>{fmt(totalGave)}</p>
          </div>
          <div style={{ background: 'white', border: '1px solid #E3E0D5', borderRadius: 10, padding: 16 }}>
            <p style={{ fontSize: '0.75rem', color: '#8C8A80', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px' }}>Adnan Received</p>
            <p style={{ fontSize: '1.3rem', fontWeight: 700, color: '#0B6E4F', margin: 0 }}>{fmt(totalGot)}</p>
          </div>
        </div>

        {/* Transaction List */}
        <h2 style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.8rem', color: '#8C8A80', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>
          All Transactions
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {items.map((d: any) => (
            <div key={d.id} style={{
              background: 'white', border: '1px solid #E3E0D5', borderRadius: 10,
              padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12,
              opacity: d.is_settled ? 0.6 : 1
            }}>
              <span style={{
                display: 'inline-block', padding: '2px 10px', borderRadius: 99,
                fontSize: '0.72rem', fontWeight: 700,
                background: d.type === 'gave' ? 'rgba(229,62,62,0.1)' : 'rgba(18,148,107,0.12)',
                color: d.type === 'gave' ? '#c53030' : '#084F39',
                flexShrink: 0
              }}>
                {d.type === 'gave' ? '↑ Adnan Gave' : '↓ Adnan Got'}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#1E1F1C', fontWeight: 500 }}>{d.purpose}</p>
                <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#8C8A80' }}>{formatDateTime(d.transacted_at)}{d.is_settled ? ' · Settled ✓' : ''}</p>
              </div>
              <span style={{ fontWeight: 700, fontSize: '1rem', color: '#1E1F1C', flexShrink: 0 }}>{fmt(Number(d.amount))}</span>
            </div>
          ))}
        </div>

        <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#8C8A80', marginTop: 32 }}>
          This is a read-only summary · Link expires {new Date(shareToken.expires_at).toLocaleDateString('en-BD', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
      </div>
    </div>
  )
}
