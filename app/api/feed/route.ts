import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()

  const { data: posts } = await supabase
    .from('posts')
    .select('title, slug, excerpt, published_at, profiles:author_id (full_name, username)')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(20)

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://adnans-blog.com'

  let rss = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>Adnan's Blog</title>
  <link>${baseUrl}</link>
  <description>Field notes on artificial intelligence</description>
  <atom:link href="${baseUrl}/api/feed" rel="self" type="application/rss+xml" />
`

  if (posts) {
    posts.forEach((post) => {
      const author = post.profiles ? (post.profiles.full_name || post.profiles.username) : 'Adnan'
      rss += `
  <item>
    <title><![CDATA[${post.title}]]></title>
    <link>${baseUrl}/${post.slug}</link>
    <guid>${baseUrl}/${post.slug}</guid>
    <pubDate>${new Date(post.published_at || new Date()).toUTCString()}</pubDate>
    <description><![CDATA[${post.excerpt ?? ''}]]></description>
    <author>${author}</author>
  </item>`
    })
  }

  rss += `
</channel>
</rss>`

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
