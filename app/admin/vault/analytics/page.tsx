import { assertVaultUser, getOrCreateMonth, getMonthExpenses } from '../actions'
import Link from 'next/link'
import VaultAnalyticsClient from '@/components/vault/VaultAnalyticsClient'
import styles from '../vault.module.css'

export default async function AnalyticsPage() {
  await assertVaultUser()

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  const monthData = await getOrCreateMonth(year, month)
  const expenses = monthData ? await getMonthExpenses(monthData.id) : []

  const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>📊 Analyse</h1>
          <p className={styles.subtitle}>{MONTH_NAMES[month - 1]} {year}</p>
        </div>
        <Link href="/admin/vault" className={styles.debtBtn}>← Back to Vault</Link>
      </div>
      <VaultAnalyticsClient
        expenses={expenses as any}
        income={Number(monthData?.income_amount ?? 0)}
        year={year}
        month={month}
        monthName={MONTH_NAMES[month - 1]}
      />
    </div>
  )
}
