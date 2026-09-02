import { createClient } from '@/lib/supabase/server'
import styles from './admin.module.css'

export default async function AdminOverview() {
  const supabase = await createClient()

  // Fetch basic stats
  const [{ count: postsCount }, { count: commentsCount }, { count: reactionsCount }] = await Promise.all([
    supabase.from('posts').select('*', { count: 'exact', head: true }),
    supabase.from('comments').select('*', { count: 'exact', head: true }),
    supabase.from('reactions').select('*', { count: 'exact', head: true }),
  ])

  return (
    <>
      <header className={styles.header}>
        <h1 className={styles.title}>Dashboard</h1>
        <p className={styles.subtitle}>Overview of your blog activity.</p>
      </header>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <h3>Total Posts</h3>
          <div className={styles.statValue}>{postsCount ?? 0}</div>
        </div>
        <div className={styles.statCard}>
          <h3>Comments</h3>
          <div className={styles.statValue}>{commentsCount ?? 0}</div>
        </div>
        <div className={styles.statCard}>
          <h3>Reactions</h3>
          <div className={styles.statValue}>{reactionsCount ?? 0}</div>
        </div>
      </div>
    </>
  )
}
