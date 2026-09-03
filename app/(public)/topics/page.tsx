import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { slugify } from '@/lib/utils'

export const metadata: Metadata = {
  title: "Topics — Adnan's Blog",
  description: 'Browse all topics and series on the blog.',
}

export default async function TopicsPage() {
  const supabase = await createClient()

  // Get all distinct categories from tags
  const { data: tagRows } = await supabase
    .from('tags')
    .select('category, name, slug')
    .not('category', 'is', null)
    .order('category')

  // Group tags by category
  const categoryMap = new Map<string, { name: string; slug: string }[]>()
  for (const tag of tagRows ?? []) {
    if (!tag.category) continue
    if (!categoryMap.has(tag.category)) categoryMap.set(tag.category, [])
    categoryMap.get(tag.category)!.push({ name: tag.name, slug: tag.slug })
  }

  // Get all series
  const { data: seriesList } = await supabase
    .from('series')
    .select('id, name, slug, description')
    .order('name')

  // Count posts per series
  const { data: seriesPostCounts } = await supabase
    .from('series_posts')
    .select('series_id')

  const seriesCountMap: Record<string, number> = {}
  for (const sp of seriesPostCounts ?? []) {
    seriesCountMap[sp.series_id] = (seriesCountMap[sp.series_id] ?? 0) + 1
  }

  const categories = Array.from(categoryMap.entries())

  return (
    <div className="wrap" style={{ maxWidth: '900px', margin: '0 auto', padding: '60px 24px' }}>
      <h1 style={{ fontFamily: 'var(--serif)', fontSize: '2.5rem', fontWeight: 400, margin: '0 0 8px' }}>Topics</h1>
      <p style={{ color: 'var(--ink-soft)', fontSize: '1rem', margin: '0 0 60px' }}>
        Browse posts by topic, or follow a curated series from start to finish.
      </p>

      {/* Series */}
      {(seriesList ?? []).length > 0 && (
        <section style={{ marginBottom: '60px' }}>
          <h2 style={{ fontFamily: 'var(--sans)', fontSize: '0.8rem', color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 20px' }}>
            Reading Paths
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {(seriesList ?? []).map(s => (
              <Link key={s.id} href={`/topics/${s.slug}`} style={{ textDecoration: 'none', display: 'block', background: 'var(--bg-raised)', border: '1px solid var(--line)', borderRadius: 'var(--radius-md)', padding: '20px', transition: 'box-shadow 0.15s ease' }}>
                <h3 style={{ fontFamily: 'var(--serif)', fontSize: '1.1rem', fontWeight: 400, margin: '0 0 8px', color: 'var(--ink)' }}>{s.name}</h3>
                {s.description && <p style={{ color: 'var(--ink-soft)', fontSize: '0.9rem', margin: '0 0 12px', lineHeight: 1.4 }}>{s.description}</p>}
                <span style={{ color: 'var(--ink-faint)', fontSize: '0.82rem' }}>
                  {seriesCountMap[s.id] ?? 0} post{(seriesCountMap[s.id] ?? 0) !== 1 ? 's' : ''}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Categories with their tags */}
      {categories.length > 0 && (
        <section>
          <h2 style={{ fontFamily: 'var(--sans)', fontSize: '0.8rem', color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 20px' }}>
            Browse by Topic
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {categories.map(([category, tags]) => (
              <div key={category}>
                <Link href={`/topics/${slugify(category)}`} style={{ fontFamily: 'var(--serif)', fontSize: '1.2rem', color: 'var(--ink)', textDecoration: 'none', display: 'block', marginBottom: '12px' }}>
                  {category} →
                </Link>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {tags.map(tag => (
                    <Link key={tag.slug} href={`/tags/${tag.slug}`} style={{ display: 'inline-block', background: 'var(--neutral-tint)', color: 'var(--ink-soft)', padding: '4px 12px', borderRadius: 'var(--radius-pill)', fontSize: '0.85rem', textDecoration: 'none', transition: 'background 0.1s' }}>
                      {tag.name}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {categories.length === 0 && (seriesList ?? []).length === 0 && (
        <p style={{ color: 'var(--ink-faint)', fontFamily: 'var(--serif)', textAlign: 'center', padding: '60px 0' }}>
          No topics yet. Create some tags with categories in the Admin panel.
        </p>
      )}
    </div>
  )
}
