import Image from 'next/image'
import type { PostWithAuthor } from '@/lib/supabase/types'
import { formatDate } from '@/lib/utils'
import styles from './ArticleHeader.module.css'

export default function ArticleHeader({ post }: { post: PostWithAuthor }) {
  const tag = post.category ?? post.tags?.[0]
  const author = post.profiles

  return (
    <header className={styles.header}>
      {tag && <span className="tag">{tag}</span>}
      
      <h1 className={styles.title}>{post.title}</h1>
      
      <div className={styles.meta}>
        {author && (
          <div className={styles.author}>
            {author.avatar_url ? (
              <Image
                src={author.avatar_url}
                alt={author.full_name ?? author.username ?? 'Author'}
                width={22}
                height={22}
                className="avatar avatar-sm"
                style={{ objectFit: 'cover' }}
              />
            ) : (
              <span className="avatar avatar-sm">
                {(author.full_name ?? author.username ?? '?').charAt(0).toUpperCase()}
              </span>
            )}
            <span>Written by {author.full_name ?? author.username ?? 'Unknown'}</span>
          </div>
        )}
        
        {author && <span className={styles.dot}>·</span>}
        
        {post.published_at && (
          <>
            <span>{formatDate(post.published_at)}</span>
            <span className={styles.dot}>·</span>
          </>
        )}
        
        {post.reading_time_minutes && (
          <span>{post.reading_time_minutes} min read</span>
        )}
      </div>
    </header>
  )
}
