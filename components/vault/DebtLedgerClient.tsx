'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { addDebt, deleteDebt, toggleDebtSettled, generateShareToken } from '@/app/admin/vault/actions'
import styles from './DebtLedgerClient.module.css'

interface Debt {
  id: string; person_name: string; amount: number; purpose: string;
  type: 'gave' | 'received'; is_settled: boolean; transacted_at: string
}

function fmt(n: number) {
  return `৳${Math.abs(n).toLocaleString('en-BD', { minimumFractionDigits: 0 })}`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-BD', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function DebtLedgerClient({ debts: initialDebts }: { debts: Debt[] }) {
  const [debts, setDebts] = useState<Debt[]>(initialDebts)
  const [showAdd, setShowAdd] = useState(false)
  const [type, setType] = useState<'gave' | 'received'>('gave')
  const [personName, setPersonName] = useState('')
  const [amount, setAmount] = useState('')
  const [purpose, setPurpose] = useState('')
  const [filter, setFilter] = useState<'all' | 'gave' | 'received' | 'unsettled'>('all')
  const [expandedPerson, setExpandedPerson] = useState<string | null>(null)
  const [shareLink, setShareLink] = useState<{ person: string; url: string } | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!personName.trim() || !amount || !purpose.trim()) return
    const fd = new FormData()
    fd.set('person_name', personName.trim())
    fd.set('amount', amount)
    fd.set('purpose', purpose.trim())
    fd.set('type', type)

    const newDebt: Debt = {
      id: `temp-${Date.now()}`, person_name: personName.trim(),
      amount: parseFloat(amount), purpose: purpose.trim(),
      type, is_settled: false, transacted_at: new Date().toISOString()
    }
    setDebts(prev => [newDebt, ...prev])
    setShowAdd(false); setPersonName(''); setAmount(''); setPurpose('')

    startTransition(async () => { await addDebt(fd); router.refresh() })
  }

  async function handleToggle(id: string, settled: boolean) {
    setDebts(prev => prev.map(d => d.id === id ? { ...d, is_settled: !settled } : d))
    startTransition(async () => { await toggleDebtSettled(id, !settled); router.refresh() })
  }

  async function handleDelete(id: string) {
    setDebts(prev => prev.filter(d => d.id !== id))
    startTransition(async () => { await deleteDebt(id); router.refresh() })
  }

  async function handleShare(person: string) {
    const res = await generateShareToken(person)
    if (res?.token) {
      const url = `${window.location.origin}/vault/share/${res.token}`
      setShareLink({ person, url })
    }
  }

  // Group by person
  const people = Array.from(new Set(debts.map(d => d.person_name)))

  const filtered = filter === 'all' ? debts
    : filter === 'unsettled' ? debts.filter(d => !d.is_settled)
    : debts.filter(d => d.type === filter)

  const groupedByPerson: Record<string, Debt[]> = {}
  for (const d of filtered) {
    if (!groupedByPerson[d.person_name]) groupedByPerson[d.person_name] = []
    groupedByPerson[d.person_name].push(d)
  }

  function netForPerson(items: Debt[]) {
    return items.reduce((sum, d) => sum + (d.type === 'received' ? Number(d.amount) : -Number(d.amount)), 0)
  }

  return (
    <div>
      {/* Filter & Add */}
      <div className={styles.toolbar}>
        <div className={styles.filters}>
          {(['all', 'gave', 'received', 'unsettled'] as const).map(f => (
            <button key={f} className={`${styles.filterBtn} ${filter === f ? styles.active : ''}`} onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <button className={styles.addDebtBtn} onClick={() => setShowAdd(v => !v)}>
          {showAdd ? '✕ Cancel' : '+ Add'}
        </button>
      </div>

      {/* Add Form */}
      {showAdd && (
        <form onSubmit={handleAdd} className={styles.addForm}>
          <div className={styles.typeToggle}>
            <button type="button" className={`${styles.typeBtn} ${type === 'gave' ? styles.typeBtnActive : ''}`} onClick={() => setType('gave')}>
              💸 I Gave
            </button>
            <button type="button" className={`${styles.typeBtn} ${type === 'received' ? styles.typeBtnActive : ''}`} onClick={() => setType('received')}>
              💰 I Received
            </button>
          </div>
          <div className={styles.formGrid}>
            <input className={styles.formInput} placeholder="Person's name" value={personName} onChange={e => setPersonName(e.target.value)} required list="people-list" />
            <datalist id="people-list">{people.map(p => <option key={p} value={p} />)}</datalist>
            <input className={styles.formInput} type="number" placeholder="Amount (৳)" value={amount} onChange={e => setAmount(e.target.value)} required min="1" />
            <input className={styles.formInput} placeholder="Purpose / reason" value={purpose} onChange={e => setPurpose(e.target.value)} required style={{ gridColumn: '1 / -1' }} />
          </div>
          <button type="submit" className={styles.submitBtn} disabled={isPending}>
            {isPending ? 'Saving…' : type === 'gave' ? 'Record: I Gave' : 'Record: I Received'}
          </button>
        </form>
      )}

      {/* Share link popup */}
      {shareLink && (
        <div className={styles.sharePopup}>
          <p className={styles.shareTitle}>Share link for <strong>{shareLink.person}</strong></p>
          <div className={styles.shareUrl}>
            <span>{shareLink.url}</span>
            <button onClick={() => { navigator.clipboard.writeText(shareLink.url); }} className={styles.copyBtn}>Copy</button>
          </div>
          <p className={styles.shareNote}>Link expires in 30 days</p>
          <button className={styles.closeShareBtn} onClick={() => setShareLink(null)}>Close</button>
        </div>
      )}

      {/* Person Groups */}
      {Object.keys(groupedByPerson).length === 0 ? (
        <div className={styles.empty}>No debt records found. Tap + Add to start.</div>
      ) : (
        <div className={styles.personList}>
          {Object.entries(groupedByPerson).map(([person, items]) => {
            const net = netForPerson(items)
            const isExpanded = expandedPerson === person
            const unsettled = items.filter(d => !d.is_settled)
            return (
              <div key={person} className={styles.personCard}>
                <div className={styles.personHeader} onClick={() => setExpandedPerson(isExpanded ? null : person)}>
                  <div className={styles.personInfo}>
                    <span className={styles.personAvatar}>{person[0].toUpperCase()}</span>
                    <div>
                      <p className={styles.personName}>{person}</p>
                      <p className={styles.personMeta}>
                        {unsettled.length > 0 ? `${unsettled.length} unsettled` : 'All settled ✓'}
                      </p>
                    </div>
                  </div>
                  <div className={styles.personRight}>
                    <span className={`${styles.netBadge} ${net > 0 ? styles.netPos : net < 0 ? styles.netNeg : ''}`}>
                      {net > 0 ? `+${fmt(net)}` : net < 0 ? `-${fmt(net)}` : 'Even'}
                    </span>
                    <button className={styles.shareBtn} onClick={e => { e.stopPropagation(); handleShare(person) }} title="Share">
                      ↗
                    </button>
                    <span className={styles.chevron}>{isExpanded ? '▲' : '▼'}</span>
                  </div>
                </div>

                {isExpanded && (
                  <div className={styles.debtItems}>
                    {items.map(d => (
                      <div key={d.id} className={`${styles.debtItem} ${d.is_settled ? styles.settled : ''}`}>
                        <div className={styles.debtLeft}>
                          <span className={`${styles.debtBadge} ${d.type === 'gave' ? styles.gave : styles.received}`}>
                            {d.type === 'gave' ? '↑ Gave' : '↓ Got'}
                          </span>
                          <p className={styles.debtPurpose}>{d.purpose}</p>
                          <p className={styles.debtDate}>{formatDate(d.transacted_at)}</p>
                        </div>
                        <div className={styles.debtRight}>
                          <span className={styles.debtAmount}>{fmt(Number(d.amount))}</span>
                          <div className={styles.debtActions}>
                            <button
                              className={`${styles.settleBtn} ${d.is_settled ? styles.unsettleBtn : ''}`}
                              onClick={() => handleToggle(d.id, d.is_settled)}
                              title={d.is_settled ? 'Mark unsettled' : 'Mark settled'}
                            >
                              {d.is_settled ? '↩' : '✓'}
                            </button>
                            <button className={styles.delBtn} onClick={() => handleDelete(d.id)} title="Delete">✕</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
