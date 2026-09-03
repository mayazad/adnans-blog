import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { slugify } from '@/lib/utils'

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  // Find series by slug first
  const { data: series } = await supabase.from('series').select('name, description').eq('slug', slug).single()
  if (series) {
    return { title: `${series.name} — Adnan's Blog`, description: series.description ?? undefined }
  }
  // Otherwise it's a category slug
  return { title: `Topic: ${slug} — Adnan's Blog` }
}

export default async function TopicSlugPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  // Try series first
  const { data: series } = await supabase
    .from('series')
    .select(`
      *,
      series_posts (
        position,
        posts ( id, title, slug, excerpt, published_at, reading_time_minutes, status )
      )
    `)
    .eq('slug', slug)
    .single()

  if (series) {
    const orderedPosts = (series.series_posts as any[])
      .filter(sp => sp.posts?.status === 'published')
      .sort((a, b) => a.position - b.position)

    return (
      <div className="wrap" style={{ maxWidth: '720px', margin: '0 auto', padding: '60px 24px' }}>
        <Link href="/topics" style={{ fontSize: '0.9rem', color: 'var(--ink-soft)', display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '32px', textDecoration: 'none' }}>
          ← All Topics
        </Link>
        <h1 style={{ fontFamily: 'var(--serif)', fontSize: '2.5rem', fontWeight: 400, margin: '0 0 12px' }}>{series.name}</h1>
        {series.description && (
          <p style={{ color: 'var(--ink-soft)', fontSize: '1rem', margin: '0 0 40px', lineHeight: 1.6 }}>{series.description}</p>
        )}
        <p style={{ color: 'var(--ink-faint)', fontSize: '0.85rem', margin: '0 0 32px' }}>{orderedPosts.length} post{orderedPosts.length !== 1 ? 's' : ''} in this series</p>

        <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0' }}>
          {orderedPosts.map((sp: any, i: number) => (
            <li key={sp.posts.id} style={{ padding: '20px 0', borderBottom: i < orderedPosts.length - 1 ? '1px solid var(--line)' : 'none', display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
              <span style={{ fontFamily: 'var(--serif)', fontSize: '1.5rem', color: 'var(--ink-faint)', minWidth: '28px', lineHeight: 1 }}>{sp.position}</span>
              <Link href={`/${sp.posts.slug}`} style={{ textDecoration: 'none', color: 'inherit', flex: 1 }}>
                <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.25rem', fontWeight: 400, margin: '0 0 6px' }}>{sp.posts.title}</h2>
                {sp.posts.excerpt && <p style={{ color: 'var(--ink-soft)', fontSize: '0.9rem', margin: '0 0 8px', lineHeight: 1.5 }}>{sp.posts.excerpt}</p>}
                {sp.posts.reading_time_minutes && (
                  <span style={{ fontSize: '0.82rem', color: 'var(--ink-faint)' }}>{sp.posts.reading_time_minutes} min read</span>
                )}
              </Link>
            </li>
          ))}
        </ol>
      </div>
    )
  }

  // Try as a category slug
  const { data: categoryTags } = await supabase
    .from('tags')
    .select('id, name, slug')
    .filter('category', 'ilike', slug.replace(/-/g, '%'))

  // Find the actual category name
  if (!categoryTags || categoryTags.length === 0) notFound()

  // Get posts for all these tags
  const tagIds = categoryTags.map(t => t.id)
  const { data: postTagRows } = await supabase
    .from('post_tags')
    .select(`posts ( id, slug, title, excerpt, published_at, reading_time_minutes )`)
    .in('tag_id', tagIds)

  const posts = (postTagRows ?? [])
    .map((r: any) => r.posts)
    .filter((p: any) => p && p.slug)
    .reduce((acc: any[], p: any) => {
      if (!acc.find(x => x.id === p.id)) acc.push(p)
      return acc
    }, [])
    .sort((a: any, b: any) => new Date(b.published_at ?? 0).getTime() - new Date(a.published_at ?? 0).getTime())

  const categoryName = categoryTags[0] ? slug.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ') : slug

  return (
    <div className="wrap" style={{ maxWidth: '720px', margin: '0 auto', padding: '60px 24px' }}>
      <Link href="/topics" style={{ fontSize: '0.9rem', color: 'var(--ink-soft)', display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '32px', textDecoration: 'none' }}>
        ← All Topics
      </Link>
      <h1 style={{ fontFamily: 'var(--serif)', fontSize: '2.5rem', fontWeight: 400, margin: '0 0 12px' }}>{categoryName}</h1>
      <p style={{ color: 'var(--ink-soft)', fontSize: '0.9rem', margin: '0 0 16px' }}>Tags in this topic:</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '40px' }}>
        {categoryTags.map(t => (
          <Link key={t.slug} href={`/tags/${t.slug}`} style={{ display: 'inline-block', background: 'var(--emerald-tint)', color: 'var(--emerald-deep)', padding: '4px 12px', borderRadius: 'var(--radius-pill)', fontSize: '0.85rem', textDecoration: 'none' }}>
            {t.name}
          </Link>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {posts.map((post: any, i: number) => (
          <article key={post.id} style={{ padding: '20px 0', borderBottom: i < posts.length - 1 ? '1px solid var(--line)' : 'none' }}>
            <Link href={`/${post.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.25rem', fontWeight: 400, margin: '0 0 6px' }}>{post.title}</h2>
              {post.excerpt && <p style={{ color: 'var(--ink-soft)', fontSize: '0.9rem', margin: '0 0 8px', lineHeight: 1.5 }}>{post.excerpt}</p>}
              {post.reading_time_minutes && <span style={{ fontSize: '0.82rem', color: 'var(--ink-faint)' }}>{post.reading_time_minutes} min read</span>}
            </Link>
          </article>
        ))}
      </div>
    </div>
  )
}
