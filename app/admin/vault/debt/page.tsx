import { assertVaultUser, getDebts } from '../actions'
import Link from 'next/link'
import DebtLedgerClient from '@/components/vault/DebtLedgerClient'
import styles from '../vault.module.css'

export default async function DebtPage() {
  await assertVaultUser()
  const debts = await getDebts()

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>💸 Debt Ledger</h1>
          <p className={styles.subtitle}>Track who owes who</p>
        </div>
        <Link href="/admin/vault" className={styles.debtBtn}>← Back to Vault</Link>
      </div>
      <DebtLedgerClient debts={debts as any} />
    </div>
  )
}
