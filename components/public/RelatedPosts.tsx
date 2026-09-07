import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { Tag, PostWithAuthor } from '@/lib/supabase/types'
import styles from './RelatedPosts.module.css'

interface Props {
  currentPostId: string
  tags: Tag[]
}

export default async function RelatedPosts({ currentPostId, tags }: Props) {
  if (!tags || tags.length === 0) return null

  const supabase = await createClient()
  const tagIds = tags.map((t) => t.id)

  // Find posts with overlapping tags
  const { data: postTags } = await supabase
    .from('post_tags')
    .select('post_id')
    .in('tag_id', tagIds)
    .neq('post_id', currentPostId)

  if (!postTags || postTags.length === 0) return null

  // Count occurrences of each post_id
  const postCounts: Record<string, number> = {}
  for (const pt of postTags) {
    postCounts[pt.post_id] = (postCounts[pt.post_id] || 0) + 1
  }

  // Sort by count descending, then take top 3
  const topPostIds = Object.entries(postCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map((entry) => entry[0])

  if (topPostIds.length === 0) return null

  // Fetch the actual posts
  const { data: relatedPosts } = await supabase
    .from('posts')
    .select('id, slug, title, excerpt, published_at')
    .in('id', topPostIds)
    .eq('status', 'published')
    .limit(3)

  if (!relatedPosts || relatedPosts.length === 0) return null

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Read Next</h3>
      <div className={styles.grid}>
        {relatedPosts.map((post) => (
          <Link key={post.id} href={`/${post.slug}`} className={styles.card}>
            <h4 className={styles.postTitle}>{post.title}</h4>
            {post.excerpt && <p className={styles.postExcerpt}>{post.excerpt}</p>}
          </Link>
        ))}
      </div>
    </div>
  )
}
