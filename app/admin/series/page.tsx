import { createClient } from '@/lib/supabase/server'
import type { Series } from '@/lib/supabase/types'
import SeriesManager from './SeriesManager'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Series — Admin' }

export default async function SeriesPage() {
  const supabase = await createClient()

  const { data: seriesList } = await supabase
    .from('series')
    .select('*')
    .order('name', { ascending: true })

  // For each series, get its ordered posts
  const { data: seriesPosts } = await supabase
    .from('series_posts')
    .select('series_id, post_id, position, posts ( id, title, slug, status )')
    .order('position', { ascending: true })

  // Get all posts for the selector
  const { data: allPosts } = await supabase
    .from('posts')
    .select('id, title, slug, status')
    .order('published_at', { ascending: false })

  return (
    <SeriesManager
      initialSeries={(seriesList ?? []) as Series[]}
      initialSeriesPosts={(seriesPosts ?? []) as any[]}
      allPosts={(allPosts ?? []) as any[]}
    />
  )
}
