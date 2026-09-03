import Link from 'next/link'
import type { PostWithAuthor } from '@/lib/supabase/types'
import { formatDate } from '@/lib/utils'
import styles from './RecentList.module.css'

interface Props {
  posts: PostWithAuthor[]
  reactionMap: Record<string, number>
}

export default function RecentList({ posts, reactionMap }: Props) {
  return (
    <section className={styles.section} aria-label="Recent posts">
      <h2 className={styles.heading}>Recent</h2>
      <div className={styles.list}>
        {posts.map((post) => {
          const tag = post.category ?? ((post as any).post_tags?.[0]?.tags?.name ?? null)
          return (
            <Link
              key={post.id}
              href={`/${post.slug}`}
              className={styles.row}
              data-title={post.title.toLowerCase()}
            >
              <h3 className={styles.title}>{post.title}</h3>
              <div className="meta-line">
                {tag && <span>{tag}</span>}
                {post.reading_time_minutes && (
                  <span>{post.reading_time_minutes} min read</span>
                )}
                {(reactionMap[post.id] ?? 0) > 0 && (
                  <span>{reactionMap[post.id]} reactions</span>
                )}
                {post.published_at && (
                  <span>{formatDate(post.published_at)}</span>
                )}
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
