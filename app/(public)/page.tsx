import { createClient } from '@/lib/supabase/server'
import type { PostWithAuthor } from '@/lib/supabase/types'
import FeaturedSpread from '@/components/public/FeaturedSpread'
import RecentList from '@/components/public/RecentList'
import PostGrid from '@/components/public/PostGrid'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Adnan's Blog — Field notes on artificial intelligence",
  description:
    "Adnan's Blog is about AI — how it works, where it fails, and what comes next.",
}



export default async function HomePage() {
  const supabase = await createClient()

  const { data: posts } = await supabase
    .from('posts')
    .select(
      `
      id, slug, title, excerpt, cover_image, tags, reading_time_minutes,
      published_at, category, source, status,
      profiles:author_id ( id, full_name, username, avatar_url )
    `
    )
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(16)

  // Cast through any because we omit some fields (like content) in the select
  const allPosts = (posts ?? []) as any as PostWithAuthor[]

  // Reaction counts per post
  const postIds = allPosts.map((p) => p.id)
  const { data: reactionCounts } = postIds.length
    ? await supabase
        .from('reactions')
        .select('post_id')
        .in('post_id', postIds)
    : { data: [] }

  const reactionMap: Record<string, number> = {}
  for (const r of reactionCounts ?? []) {
    reactionMap[r.post_id] = (reactionMap[r.post_id] ?? 0) + 1
  }

  const featured = allPosts[0] ?? null
  const recent = allPosts.slice(1, 5)
  const grid = allPosts.slice(5)

  return (
    <div className="wrap">
      {featured && (
        <FeaturedSpread post={featured} reactionCount={reactionMap[featured.id] ?? 0} />
      )}
      {recent.length > 0 && (
        <RecentList posts={recent} reactionMap={reactionMap} />
      )}
      {grid.length > 0 && (
        <PostGrid posts={grid} reactionMap={reactionMap} />
      )}
      {allPosts.length === 0 && (
        <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--ink-faint)' }}>
          <p style={{ fontFamily: 'var(--serif)', fontSize: '1.2rem' }}>
            No posts yet. Check back soon.
          </p>
        </div>
      )}
    </div>
  )
}
