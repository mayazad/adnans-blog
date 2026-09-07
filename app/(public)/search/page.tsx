import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import styles from './search.module.css'

export const metadata = {
  title: 'Search — Adnan\'s Blog',
}

interface Props {
  searchParams: Promise<{ q?: string }>
}

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams
  const query = q ?? ''
  
  let results: any[] = []
  
  if (query.trim().length > 0) {
    const supabase = await createClient()
    
    // Supabase FTS: to_tsvector on title and content
    // We can use the textSearch method or an RPC.
    // For simplicity without changing the schema to add a tsvector column,
    // we will use plain text search ilike for now, OR we can use textSearch on the english dictionary.
    
    const { data } = await supabase
      .from('posts')
      .select('id, slug, title, excerpt, published_at')
      .eq('status', 'published')
      .textSearch('title', query, { type: 'websearch', config: 'english' })
      .limit(20)

    // Also search excerpt if title doesn't yield enough
    const { data: excerptData } = await supabase
      .from('posts')
      .select('id, slug, title, excerpt, published_at')
      .eq('status', 'published')
      .textSearch('excerpt', query, { type: 'websearch', config: 'english' })
      .limit(20)

    // Merge and deduplicate
    const combined = [...(data || []), ...(excerptData || [])]
    const unique = new Map()
    combined.forEach(p => unique.set(p.id, p))
    results = Array.from(unique.values()).sort((a, b) => 
      new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
    )
  }

  return (
    <div className="wrap" style={{ maxWidth: '720px', margin: '0 auto', padding: '60px 24px' }}>
      <h1 className={styles.title}>Search</h1>
      
      <form method="get" action="/search" className={styles.searchForm}>
        <input 
          type="search" 
          name="q" 
          defaultValue={query} 
          placeholder="Search articles..." 
          className={styles.searchInput}
          autoFocus
        />
        <button type="submit" className={styles.searchBtn}>Search</button>
      </form>

      {query && (
        <div className={styles.resultsContainer}>
          <p className={styles.resultsMeta}>
            Found {results.length} result{results.length !== 1 ? 's' : ''} for "{query}"
          </p>

          <div className={styles.resultsList}>
            {results.map((post) => (
              <article key={post.id} className={styles.resultItem}>
                <Link href={`/${post.slug}`} className={styles.resultLink}>
                  <h2 className={styles.resultTitle}>{post.title}</h2>
                  {post.excerpt && <p className={styles.resultExcerpt}>{post.excerpt}</p>}
                </Link>
              </article>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
