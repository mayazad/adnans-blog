import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import type { CommentWithUser, PostWithAuthor } from '@/lib/supabase/types'
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

  // Fetch post
  const { data: post } = await supabase
    .from('posts')
    .select(`
      *,
      profiles:author_id ( id, full_name, username, avatar_url )
    `)
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (!post) notFound()

  const typedPost = post as PostWithAuthor

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
            <ArticleBody content={htmlWithIds} />
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
