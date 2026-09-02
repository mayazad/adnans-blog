import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { relativeTime } from '@/lib/utils'
import styles from '../posts/posts.module.css' // Reuse table styles

export default async function AdminCommentsPage() {
  const supabase = await createClient()

  const { data: comments } = await supabase
    .from('comments')
    .select(`
      id,
      content,
      created_at,
      post_id,
      posts ( title, slug ),
      profiles:user_id ( full_name, username )
    `)
    .order('created_at', { ascending: false })

  async function deleteComment(formData: FormData) {
    'use server'
    const id = formData.get('id') as string
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return

    // Verify admin
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return

    await supabase.from('comments').delete().eq('id', id)
    revalidatePath('/admin/comments')
  }

  return (
    <>
      <header className="admin-header">
        <div>
          <h1 className="admin-title">Comments</h1>
          <p className="admin-subtitle">Moderate discussion on your posts.</p>
        </div>
      </header>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>User</th>
              <th>Comment</th>
              <th>Post</th>
              <th>Date</th>
              <th className={styles.actionsCell}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {comments?.map((comment: any) => (
              <tr key={comment.id}>
                <td style={{ fontWeight: 500, color: 'var(--ink)' }}>
                  {comment.profiles?.full_name ?? comment.profiles?.username ?? 'Unknown'}
                </td>
                <td style={{ maxWidth: '300px' }}>
                  <div style={{
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {comment.content}
                  </div>
                </td>
                <td>
                  <a href={`/${comment.posts?.slug}#comments`} target="_blank" style={{ color: 'var(--emerald-deep)', textDecoration: 'underline' }}>
                    {comment.posts?.title}
                  </a>
                </td>
                <td>{relativeTime(comment.created_at)}</td>
                <td className={styles.actionsCell}>
                  <form action={deleteComment} style={{ display: 'inline' }}>
                    <input type="hidden" name="id" value={comment.id} />
                    <button
                      type="submit"
                      className={styles.actionBtn}
                      style={{ color: '#D32F2F', borderColor: '#FFCDD2' }}
                    >
                      Delete
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {(!comments || comments.length === 0) && (
              <tr>
                <td colSpan={5} className={styles.empty}>
                  No comments yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}
