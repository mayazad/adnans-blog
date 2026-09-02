import Link from 'next/link'
import styles from './Footer.module.css'

export default function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className={styles.footer}>
      <div className={`wrap ${styles.inner}`}>
        <span>
          <Link href="/" className={styles.wordmark}>Adnan's Blog</Link>
          {' '}— Field notes on artificial intelligence.
        </span>
        <span className={styles.copy}>© {year}</span>
      </div>
    </footer>
  )
}
