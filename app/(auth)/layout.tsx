import Link from 'next/link'
import styles from './auth.module.css'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Link href="/" className={styles.wordmark}>Adnan's Blog</Link>
      </header>
      <main className={styles.main}>
        {children}
      </main>
    </div>
  )
}
