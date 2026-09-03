'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { PostWithAuthor } from '@/lib/supabase/types'
import { NodeMotif } from './NodeMotif'
import styles from './PostGrid.module.css'

interface Props {
  posts: PostWithAuthor[]
  reactionMap: Record<string, number>
}

export default function PostGrid({ posts, reactionMap }: Props) {
  const [activeTag, setActiveTag] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')

  // Collect unique tag names from relational post_tags
  const allTagNames = posts.flatMap((p) => ((p as any).post_tags ?? []).map((pt: any) => pt.tags?.name).filter(Boolean) as string[])
  const categoryNames = posts.map(p => p.category).filter(Boolean) as string[]
  const tags = ['All', ...Array.from(new Set([...categoryNames, ...allTagNames]))]

  // Listen for search events from Masthead
  useEffect(() => {
    function handler(e: Event) {
      setSearchQuery((e as CustomEvent<string>).detail ?? '')
    }
    window.addEventListener('latent:search', handler)
    return () => window.removeEventListener('latent:search', handler)
  }, [])

  const visible = posts.filter((p) => {
    const postTagNames: string[] = ((p as any).post_tags ?? []).map((pt: any) => pt.tags?.name).filter(Boolean)
    const matchesTag =
      activeTag === 'All' ||
      postTagNames.includes(activeTag) ||
      p.category === activeTag
    const matchesSearch =
      !searchQuery ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.excerpt ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      postTagNames.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesTag && matchesSearch
  })

  return (
    <section className={styles.section} id="topics" aria-label="All posts">
      <h2 className={styles.heading}>Latest</h2>

      {/* Topic chips */}
      <div className={styles.chips} role="group" aria-label="Filter by topic">
        {tags.map((tag) => (
          <button
            key={tag}
            className={`chip ${activeTag === tag ? 'active' : ''}`}
            onClick={() => setActiveTag(tag)}
            aria-pressed={activeTag === tag}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Post grid */}
      {visible.length > 0 ? (
        <div className={styles.grid}>
          {visible.map((post) => {
            const tag = post.category ?? ((post as any).post_tags?.[0]?.tags?.name ?? null)
            const tint = post.id.charCodeAt(0) % 2 === 0 ? 'a' : 'b'
            return (
              <Link
                key={post.id}
                href={`/${post.slug}`}
                className={styles.card}
              >
                <div className={`${styles.cover} ${styles[`tint${tint}`]}`}>
                  {post.cover_image ? (
                    <Image
                      src={post.cover_image}
                      alt={post.title}
                      fill
                      sizes="(max-width: 560px) 100vw, (max-width: 900px) 50vw, 33vw"
                      style={{ objectFit: 'cover' }}
                    />
                  ) : (
                    <NodeMotif size={36} />
                  )}
                </div>
                <h3 className={styles.title}>{post.title}</h3>
                <div className="meta-line">
                  {tag && <span>{tag}</span>}
                  {post.reading_time_minutes && (
                    <span>{post.reading_time_minutes} min read</span>
                  )}
                  {(reactionMap[post.id] ?? 0) > 0 && (
                    <span>{reactionMap[post.id]} reactions</span>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <p className={styles.empty}>
          {searchQuery ? `No posts matching "${searchQuery}"` : 'No posts in this topic yet.'}
        </p>
      )}
    </section>
  )
}
