import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { PostWithAuthor } from '@/lib/supabase/types'

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data: tag } = await supabase.from('tags').select('name').eq('slug', slug).single()
  if (!tag) return { title: 'Tag not found' }
  return {
    title: `${tag.name} — Adnan's Blog`,
    description: `All posts tagged with ${tag.name}`,
  }
}

export default async function TagPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: tag } = await supabase
    .from('tags')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!tag) notFound()

  // Get all published posts with this tag
  const { data: postTagRows } = await supabase
    .from('post_tags')
    .select(`
      posts (
        id, slug, title, excerpt, cover_image, published_at,
        reading_time_minutes, category,
        profiles:author_id ( id, full_name, username, avatar_url )
      )
    `)
    .eq('tag_id', tag.id)

  const posts = (postTagRows ?? [])
    .map((row: any) => row.posts)
    .filter((p: any) => p && p.slug)
    .sort((a: any, b: any) =>
      new Date(b.published_at ?? 0).getTime() - new Date(a.published_at ?? 0).getTime()
    ) as PostWithAuthor[]

  return (
    <div className="wrap" style={{ maxWidth: '720px', margin: '0 auto', padding: '60px 24px' }}>
      <Link href="/topics" style={{ fontSize: '0.9rem', color: 'var(--ink-soft)', display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '32px', textDecoration: 'none' }}>
        ← All Topics
      </Link>
      <div style={{ marginBottom: '40px' }}>
        <span style={{ display: 'inline-block', background: 'var(--emerald-tint)', color: 'var(--emerald-deep)', padding: '4px 12px', borderRadius: 'var(--radius-pill)', fontSize: '0.85rem', marginBottom: '12px' }}>
          {tag.category ?? 'Tag'}
        </span>
        <h1 style={{ fontFamily: 'var(--serif)', fontSize: '2.5rem', fontWeight: 400, margin: '0 0 8px' }}>
          {tag.name}
        </h1>
        {tag.aliases.length > 0 && (
          <p style={{ color: 'var(--ink-soft)', fontSize: '0.9rem' }}>
            Also known as: {tag.aliases.join(', ')}
          </p>
        )}
        <p style={{ color: 'var(--ink-soft)', fontSize: '0.9rem', margin: '8px 0 0' }}>
          {posts.length} post{posts.length !== 1 ? 's' : ''}
        </p>
      </div>

      {posts.length === 0 ? (
        <p style={{ color: 'var(--ink-faint)', fontFamily: 'var(--serif)', fontSize: '1.1rem', textAlign: 'center', padding: '60px 0' }}>
          No posts with this tag yet.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {posts.map((post, i) => (
            <article key={post.id} style={{ padding: '24px 0', borderBottom: i < posts.length - 1 ? '1px solid var(--line)' : 'none' }}>
              <Link href={`/${post.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.4rem', fontWeight: 400, margin: '0 0 8px', lineHeight: 1.3 }}>
                  {post.title}
                </h2>
                {post.excerpt && (
                  <p style={{ color: 'var(--ink-soft)', fontSize: '0.95rem', margin: '0 0 12px', lineHeight: 1.5 }}>
                    {post.excerpt}
                  </p>
                )}
                <div style={{ display: 'flex', gap: '12px', fontSize: '0.85rem', color: 'var(--ink-faint)' }}>
                  {post.published_at && (
                    <span>{new Date(post.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  )}
                  {post.reading_time_minutes && (
                    <span>{post.reading_time_minutes} min read</span>
                  )}
                </div>
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
