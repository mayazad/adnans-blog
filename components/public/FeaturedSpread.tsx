import Link from 'next/link'
import Image from 'next/image'
import type { PostWithAuthor } from '@/lib/supabase/types'
import { formatDate } from '@/lib/utils'
import { NodeMotif } from './NodeMotif'
import styles from './FeaturedSpread.module.css'

interface Props {
  post: PostWithAuthor
  reactionCount: number
}

export default function FeaturedSpread({ post, reactionCount }: Props) {
  const tag = post.category ?? ((post as any).post_tags?.[0]?.tags?.name ?? 'Essay')

  return (
    <section className={styles.spread} aria-label="Featured post">
      <div className={styles.content}>
        <span className="tag">{tag}</span>
        <h1 className={styles.title}>
          <Link href={`/${post.slug}`}>{post.title}</Link>
        </h1>
        {post.excerpt && (
          <p className={styles.excerpt}>{post.excerpt}</p>
        )}
        <div className="meta-line">
          {post.reading_time_minutes && (
            <span>{post.reading_time_minutes} min read</span>
          )}
          {reactionCount > 0 && (
            <span>{reactionCount} reaction{reactionCount !== 1 ? 's' : ''}</span>
          )}
          {post.published_at && (
            <span>{formatDate(post.published_at)}</span>
          )}
        </div>
      </div>

      <div className={styles.cover}>
        {post.cover_image ? (
          <Image
            src={post.cover_image}
            alt={post.title}
            fill
            sizes="(max-width: 900px) 100vw, 40vw"
            style={{ objectFit: 'cover', borderRadius: '4px' }}
            priority
          />
        ) : (
          <div className={styles.coverPlaceholder}>
            <NodeMotif size={80} />
          </div>
        )}
      </div>
    </section>
  )
}
