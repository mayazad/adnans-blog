'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { addExpense, deleteExpense, setMonthIncome, lockVault } from '@/app/admin/vault/actions'
import styles from '@/app/admin/vault/vault.module.css'

const PRESET_CATEGORIES = ['Fare', 'Food', 'Bills', 'Grocery', 'Medicine', 'Recharge', 'Shopping', 'Other']

interface Expense {
  id: string; amount: number; category: string; description: string | null; spent_at: string
}
interface MonthData {
  id: string; income_amount: number
}

interface Props {
  monthData: MonthData | null
  expenses: Expense[]
  totalSpent: number
  remaining: number
  monthLabel: string
}

function fmt(n: number) {
  return `৳${Math.abs(n).toLocaleString('en-BD', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-BD', { hour: '2-digit', minute: '2-digit', hour12: true })
}

function formatDay(iso: string) {
  const d = new Date(iso)
  const today = new Date()
  const yesterday = new Date(); yesterday.setDate(today.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-BD', { weekday: 'short', month: 'short', day: 'numeric' })
}

export default function VaultDashboardClient({ monthData, expenses, totalSpent, remaining, monthLabel }: Props) {
  const [income, setIncome] = useState(Number(monthData?.income_amount ?? 0))
  const [editingIncome, setEditingIncome] = useState(income === 0)
  const [incomeInput, setIncomeInput] = useState(income === 0 ? '' : String(income))
  const [quickInput, setQuickInput] = useState('')
  const [desc, setDesc] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [formError, setFormError] = useState('')
  const [localExpenses, setLocalExpenses] = useState<Expense[]>(expenses)
  const [localSpent, setLocalSpent] = useState(totalSpent)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const spentPercent = income > 0 ? Math.min((localSpent / income) * 100, 100) : 0
  const localRemaining = income - localSpent

  function fillCategory(cat: string) {
    setSelectedCategory(cat)
    // If quick input has no comma yet, add category after comma
    const parts = quickInput.split(',')
    if (parts.length >= 1 && parts[0].trim()) {
      setQuickInput(`${parts[0].trim()}, ${cat}`)
    } else {
      setQuickInput(`0, ${cat}`)
    }
  }

  async function handleAddExpense(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    const parts = quickInput.split(',').map(s => s.trim())
    if (parts.length < 2) { setFormError('Format: amount, Category'); return }
    const amount = parseFloat(parts[0])
    if (isNaN(amount) || amount <= 0) { setFormError('Invalid amount'); return }

    const fd = new FormData()
    fd.set('quick_input', quickInput)
    fd.set('description', desc)
    fd.set('month_id', monthData?.id ?? '')

    const newExp: Expense = {
      id: `temp-${Date.now()}`,
      amount,
      category: parts[1],
      description: desc || null,
      spent_at: new Date().toISOString(),
    }
    setLocalExpenses(prev => [newExp, ...prev])
    setLocalSpent(s => s + amount)
    setQuickInput('')
    setDesc('')
    setSelectedCategory('')

    startTransition(async () => {
      const res = await addExpense(fd)
      if (res?.error) { setFormError(res.error); setLocalExpenses(expenses); setLocalSpent(totalSpent) }
      else router.refresh()
    })
  }

  async function handleDelete(id: string, amount: number) {
    setLocalExpenses(prev => prev.filter(e => e.id !== id))
    setLocalSpent(s => Math.max(0, s - amount))
    startTransition(async () => {
      await deleteExpense(id)
      router.refresh()
    })
  }

  async function handleSaveIncome(e: React.FormEvent) {
    e.preventDefault()
    const val = parseFloat(incomeInput)
    if (isNaN(val) || val < 0) return
    setIncome(val)
    setEditingIncome(false)
    startTransition(async () => {
      await setMonthIncome(monthData!.id, val)
      router.refresh()
    })
  }

  // Group expenses by day
  const grouped: Record<string, Expense[]> = {}
  for (const exp of localExpenses) {
    const key = formatDay(exp.spent_at)
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(exp)
  }

  const progressClass = spentPercent >= 90 ? styles.danger : spentPercent >= 70 ? styles.warn : ''

  return (
    <div>
      {/* Budget Card */}
      <div className={styles.budgetCard}>
        <div className={styles.budgetTop}>
          <div className={styles.budgetStats}>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Income</span>
              <span className={styles.statValue}>{fmt(income)}</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Spent</span>
              <span className={`${styles.statValue} ${spentPercent >= 90 ? styles.danger : ''}`}>{fmt(localSpent)}</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Left</span>
              <span className={`${styles.statValue} ${localRemaining < 0 ? styles.danger : styles.safe}`}>
                {localRemaining < 0 ? '-' : ''}{fmt(localRemaining)}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button className={styles.editIncomeBtn} onClick={() => setEditingIncome(v => !v)}>
              ✏️ {income === 0 ? 'Set Income' : 'Edit'}
            </button>
            <button className={styles.editIncomeBtn} onClick={() => lockVault()} title="Lock vault">🔒</button>
          </div>
        </div>

        {editingIncome && (
          <form onSubmit={handleSaveIncome} className={styles.incomeForm}>
            <span style={{ fontFamily: 'var(--sans)', color: 'var(--ink-soft)', flexShrink: 0 }}>৳</span>
            <input
              type="number"
              className={styles.incomeInput}
              value={incomeInput}
              onChange={e => setIncomeInput(e.target.value)}
              placeholder="Enter monthly income"
              autoFocus
            />
            <button type="submit" className={styles.saveBtn}>Save</button>
          </form>
        )}

        {income > 0 && (
          <>
            <div className={styles.progressBar}>
              <div
                className={`${styles.progressFill} ${progressClass}`}
                style={{ width: `${spentPercent}%` }}
              />
            </div>
            <div className={styles.progressLabels}>
              <span>{spentPercent.toFixed(0)}% spent</span>
              <span>{fmt(localRemaining)} left</span>
            </div>
          </>
        )}
      </div>

      {/* Quick Add */}
      {monthData && (
        <div className={styles.quickAdd}>
          <p className={styles.quickAddTitle}>+ Add Expense</p>
          <form onSubmit={handleAddExpense}>
            <div className={styles.quickAddRow}>
              <input
                type="text"
                className={styles.quickInput}
                value={quickInput}
                onChange={e => setQuickInput(e.target.value)}
                placeholder="100, Fare"
              />
              <button type="submit" className={styles.addBtn} disabled={isPending || !quickInput.trim()}>
                {isPending ? '…' : 'Add'}
              </button>
            </div>
            <input
              type="text"
              className={styles.descInput}
              value={desc}
              onChange={e => setDesc(e.target.value)}
              placeholder="Description (optional)"
            />
            <div className={styles.categoryChips}>
              {PRESET_CATEGORIES.map(cat => (
                <button
                  key={cat}
                  type="button"
                  className={`${styles.chip} ${selectedCategory === cat ? styles.active : ''}`}
                  onClick={() => fillCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
            {formError && <p className={styles.formError}>{formError}</p>}
          </form>
        </div>
      )}

      {/* Expense List */}
      {Object.keys(grouped).length === 0 ? (
        <div className={styles.emptyState}>
          No expenses yet this month.<br />Add your first one above!
        </div>
      ) : (
        <div className={styles.expenseList}>
          {Object.entries(grouped).map(([day, items]) => (
            <div key={day} className={styles.dayGroup}>
              <p className={styles.dayLabel}>{day}</p>
              {items.map(exp => (
                <div key={exp.id} className={styles.expenseItem}>
                  <div className={styles.expenseLeft}>
                    <p className={styles.expenseCategory}>{exp.category}</p>
                    {exp.description && <p className={styles.expenseDesc}>{exp.description}</p>}
                  </div>
                  <span className={styles.expenseTime}>{formatTime(exp.spent_at)}</span>
                  <span className={styles.expenseAmount}>{fmt(Number(exp.amount))}</span>
                  <button
                    className={styles.deleteBtn}
                    onClick={() => handleDelete(exp.id, Number(exp.amount))}
                    title="Delete"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
