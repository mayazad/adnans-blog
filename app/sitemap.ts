import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const supabase = await createClient()

  // Fetch all published posts
  const { data: posts } = await supabase
    .from('posts')
    .select('slug, updated_at, published_at')
    .eq('status', 'published')

  // Fetch all tags
  const { data: tags } = await supabase
    .from('tags')
    .select('slug, updated_at')

  // Fetch all series
  const { data: series } = await supabase
    .from('series')
    .select('slug, updated_at')

  const sitemap: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/topics`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ]

  // Add posts to sitemap
  if (posts) {
    posts.forEach((post) => {
      sitemap.push({
        url: `${baseUrl}/${post.slug}`,
        lastModified: new Date(post.updated_at || post.published_at || new Date()),
        changeFrequency: 'weekly',
        priority: 0.9,
      })
    })
  }

  // Add tags to sitemap
  if (tags) {
    tags.forEach((tag) => {
      sitemap.push({
        url: `${baseUrl}/tags/${tag.slug}`,
        lastModified: new Date(tag.updated_at || new Date()),
        changeFrequency: 'weekly',
        priority: 0.6,
      })
    })
  }

  // Add series to sitemap
  if (series) {
    series.forEach((s) => {
      sitemap.push({
        url: `${baseUrl}/topics/${s.slug}`,
        lastModified: new Date(s.updated_at || new Date()),
        changeFrequency: 'weekly',
        priority: 0.7,
      })
    })
  }

  return sitemap
}
