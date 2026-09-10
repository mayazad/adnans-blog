import { assertVaultUser, getOrCreateMonth, getMonthExpenses } from './actions'
import Link from 'next/link'
import VaultDashboardClient from '@/components/vault/VaultDashboardClient'
import styles from './vault.module.css'

export default async function VaultPage() {
  const user = await assertVaultUser()

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  const monthData = await getOrCreateMonth(year, month)
  const expenses = monthData ? await getMonthExpenses(monthData.id) : []

  const totalSpent = expenses.reduce((sum: number, e: any) => sum + Number(e.amount), 0)
  const remaining = Number(monthData?.income_amount ?? 0) - totalSpent

  const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>💰 My Vault</h1>
          <p className={styles.subtitle}>{MONTH_NAMES[month - 1]} {year}</p>
        </div>
        <div className={styles.headerActions}>
          <Link href="/admin/vault/analytics" className={styles.analyseBtn}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
            Analyse
          </Link>
          <Link href="/admin/vault/debt" className={styles.debtBtn}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            Debts
          </Link>
        </div>
      </div>

      <VaultDashboardClient
        monthData={monthData}
        expenses={expenses}
        totalSpent={totalSpent}
        remaining={remaining}
        monthLabel={`${MONTH_NAMES[month - 1]} ${year}`}
      />
    </div>
  )
}
