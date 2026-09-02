import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'
import styles from './posts.module.css'

export default async function AdminPostsPage() {
  const supabase = await createClient()

  const { data: posts } = await supabase
    .from('posts')
    .select('id, title, slug, status, published_at, created_at')
    .order('created_at', { ascending: false })

  return (
    <>
      <header className="admin-header">
        <div>
          <h1 className="admin-title">Posts</h1>
          <p className="admin-subtitle">Manage your written content.</p>
        </div>
        <Link href="/admin/posts/new" className="btn-primary">
          New Post
        </Link>
      </header>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Title</th>
              <th>Status</th>
              <th>Date</th>
              <th className={styles.actionsCell}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {posts?.map((post) => (
              <tr key={post.id}>
                <td>
                  <div className={styles.postTitle}>{post.title}</div>
                  <div className={styles.postSlug}>/{post.slug}</div>
                </td>
                <td>
                  <span className={`${styles.badge} ${styles[post.status]}`}>
                    {post.status}
                  </span>
                </td>
                <td>
                  {post.status === 'published' && post.published_at
                    ? formatDate(post.published_at)
                    : formatDate(post.created_at)}
                </td>
                <td className={styles.actionsCell}>
                  <Link href={`/admin/posts/${post.id}`} className={styles.actionBtn}>
                    Edit
                  </Link>
                  <Link href={`/${post.slug}`} className={styles.actionBtn} target="_blank">
                    View
                  </Link>
                </td>
              </tr>
            ))}
            {(!posts || posts.length === 0) && (
              <tr>
                <td colSpan={4} className={styles.empty}>
                  No posts found. Start writing!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}
