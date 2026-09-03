import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { CommentWithUser, PostWithAuthor, Tag, Series } from '@/lib/supabase/types'
import ArticleHeader from '@/components/public/ArticleHeader'
import ArticleBody from '@/components/public/ArticleBody'
import TOC from '@/components/public/TOC'
import ReactionRail from '@/components/public/ReactionRail'
import CommentsSection from '@/components/public/CommentsSection'
import ReadingProgressBar from '@/components/public/ReadingProgressBar'
import { extractHeadings, addHeadingIds } from '@/lib/utils'
import styles from './post.module.css'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data: post } = await supabase
    .from('posts')
    .select('title, excerpt, cover_image')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (!post) return { title: 'Post not found' }

  return {
    title: post.title,
    description: post.excerpt ?? undefined,
    openGraph: {
      title: post.title,
      description: post.excerpt ?? undefined,
      images: post.cover_image ? [post.cover_image] : [],
    },
  }
}

// Removed static generation since we use cookies() for user-specific data

export default async function PostPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  // Fetch post with relational tags and series
  const { data: post } = await supabase
    .from('posts')
    .select(`
      *,
      profiles:author_id ( id, full_name, username, avatar_url ),
      post_tags ( tags ( id, name, slug ) ),
      series_posts ( position, series ( id, name, slug, description ) )
    `)
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (!post) notFound()

  const typedPost = post as PostWithAuthor
  const postTags: Tag[] = ((post as any).post_tags ?? []).map((pt: any) => pt.tags).filter(Boolean)
  const seriesEntry = ((post as any).series_posts ?? [])[0]
  const seriesData: { position: number; series: Series } | null = seriesEntry
    ? { position: seriesEntry.position, series: seriesEntry.series }
    : null

  // Fetch prev/next posts in series if in a series
  let prevPost: { title: string; slug: string } | null = null
  let nextPost: { title: string; slug: string } | null = null
  let totalInSeries = 0
  if (seriesData) {
    const { data: siblings } = await supabase
      .from('series_posts')
      .select('position, posts ( title, slug, status )')
      .eq('series_id', seriesData.series.id)
      .order('position', { ascending: true })
    const published = (siblings ?? []).filter((sp: any) => sp.posts?.status === 'published')
    totalInSeries = published.length
    const myPos = seriesData.position
    const prevSibling = published.find((sp: any) => sp.position === myPos - 1)
    const nextSibling = published.find((sp: any) => sp.position === myPos + 1)
    if (prevSibling) prevPost = prevSibling.posts as unknown as { title: string; slug: string }
    if (nextSibling) nextPost = nextSibling.posts as unknown as { title: string; slug: string }
  }

  // Fetch comments with user profile and votes
  const { data: comments } = await supabase
    .from('comments')
    .select(`
      *,
      profiles:user_id ( id, full_name, username, avatar_url ),
      comment_votes ( vote_value, user_id )
    `)
    .eq('post_id', post.id)
    .order('created_at', { ascending: true })

  // Fetch reactions
  const { data: reactions } = await supabase
    .from('reactions')
    .select('id, user_id, type')
    .eq('post_id', post.id)

  // Current user
  const { data: { user } } = await supabase.auth.getUser()
  let userProfile = null
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, username, avatar_url')
      .eq('id', user.id)
      .single()
    userProfile = data
  }

  const htmlWithIds = addHeadingIds(post.content ?? '')
  const headings = extractHeadings(htmlWithIds)
  const reactionCount = reactions?.length ?? 0
  const userReaction = user
    ? reactions?.find((r) => r.user_id === user.id)
    : null

  return (
    <>
      <ReadingProgressBar />

      <div className="wrap">
        <a href="/" className={styles.backLink}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Back to Adnan's Blog
        </a>

        <ArticleHeader post={typedPost} />

        <div className={styles.articleGrid}>
          {/* Table of contents — desktop left sidebar */}
          <div className={styles.leftSidebar}>
            {headings.length > 0 && <TOC headings={headings} />}
          </div>

          {/* Article body */}
          <div className={styles.mainContent}>
            {/* Series strip */}
            {seriesData && (
              <div style={{
                background: 'var(--emerald-tint)',
                border: '1px solid var(--emerald-bright)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 16px',
                marginBottom: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                flexWrap: 'wrap',
              }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--emerald)', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 500 }}>Series</span>
                  <p style={{ margin: '2px 0 0', fontFamily: 'var(--serif)', fontSize: '0.95rem', color: 'var(--emerald-deep)' }}>
                    Part {seriesData.position} of {totalInSeries} — <Link href={`/topics/${seriesData.series.slug}`} style={{ color: 'inherit', fontWeight: 500 }}>{seriesData.series.name}</Link>
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                  {prevPost && (
                    <Link href={`/${prevPost.slug}`} style={{ fontSize: '0.82rem', color: 'var(--emerald-deep)', background: 'rgba(255,255,255,0.5)', padding: '4px 10px', borderRadius: 'var(--radius-sm)', textDecoration: 'none' }}>
                      ← Previous
                    </Link>
                  )}
                  {nextPost && (
                    <Link href={`/${nextPost.slug}`} style={{ fontSize: '0.82rem', color: 'var(--emerald-deep)', background: 'rgba(255,255,255,0.5)', padding: '4px 10px', borderRadius: 'var(--radius-sm)', textDecoration: 'none' }}>
                      Next →
                    </Link>
                  )}
                </div>
              </div>
            )}
            <ArticleBody content={htmlWithIds} />
            {/* Tag chips below article */}
            {postTags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '40px', paddingTop: '24px', borderTop: '1px solid var(--line)' }}>
                {postTags.map(tag => (
                  <Link key={tag.id} href={`/tags/${tag.slug}`} style={{ display: 'inline-block', background: 'var(--neutral-tint)', color: 'var(--ink-soft)', padding: '4px 12px', borderRadius: 'var(--radius-pill)', fontSize: '0.83rem', textDecoration: 'none', transition: 'background 0.1s ease' }}>
                    {tag.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Reaction rail — desktop right sidebar */}
          <div className={styles.rightSidebar}>
            <ReactionRail
              postId={post.id}
              initialCount={reactionCount}
              initialUserReacted={!!userReaction}
              commentCount={comments?.length ?? 0}
              user={user}
              userProfile={userProfile}
            />
          </div>
        </div>

        {/* Comments */}
        <CommentsSection
          postId={post.id}
          initialComments={(comments ?? []) as CommentWithUser[]}
          user={user}
          userProfile={userProfile}
        />
      </div>
    </>
  )
}
