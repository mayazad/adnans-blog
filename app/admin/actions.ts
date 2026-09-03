'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { slugify } from '@/lib/utils'

export async function savePost(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const id = formData.get('id') as string | null
  const title = formData.get('title') as string
  const excerpt = formData.get('excerpt') as string
  const content = formData.get('content') as string
  const category = formData.get('category') as string
  const tagIdsStr = formData.get('tagIds') as string
  const seriesId = formData.get('seriesId') as string
  const seriesPosition = parseInt(formData.get('seriesPosition') as string) || 1
  const coverImage = formData.get('cover_image') as string
  const status = formData.get('status') as 'draft' | 'published' | 'archived'

  const slug = slugify(title)
  const tagIds: string[] = tagIdsStr ? JSON.parse(tagIdsStr) : []
  
  // Calculate reading time (rough estimate: ~200 words per minute)
  const textContent = content.replace(/<[^>]*>?/gm, '')
  const wordCount = textContent.split(/\s+/).filter(Boolean).length
  const reading_time_minutes = Math.max(1, Math.ceil(wordCount / 200))

  const postData = {
    title,
    slug,
    excerpt: excerpt || null,
    content,
    category: category || null,
    cover_image: coverImage || null,
    status,
    reading_time_minutes,
    author_id: user.id,
    ...(status === 'published' ? { published_at: new Date().toISOString() } : {}),
  }

  let resultId = id

  if (id) {
    const { error } = await supabase.from('posts').update(postData).eq('id', id)
    if (error) throw new Error(error.message)
  } else {
    const { data, error } = await supabase.from('posts').insert(postData).select('id').single()
    if (error) throw new Error(error.message)
    resultId = data.id
  }

  // Sync post_tags — delete existing, re-insert selected
  await supabase.from('post_tags').delete().eq('post_id', resultId!)
  if (tagIds.length > 0) {
    const tagRows = tagIds.map(tag_id => ({ post_id: resultId!, tag_id }))
    const { error: tagErr } = await supabase.from('post_tags').insert(tagRows)
    if (tagErr) throw new Error(tagErr.message)
  }

  // Sync series_posts — delete existing, re-insert if selected
  await supabase.from('series_posts').delete().eq('post_id', resultId!)
  if (seriesId) {
    const { error: sErr } = await supabase
      .from('series_posts')
      .insert({ series_id: seriesId, post_id: resultId!, position: seriesPosition })
    if (sErr) throw new Error(sErr.message)
  }

  revalidatePath('/')
  revalidatePath(`/${slug}`)
  revalidatePath('/admin/posts')
  revalidatePath('/topics')
  revalidatePath(`/tags`)
  
  return { id: resultId, slug }
}


export async function deletePost(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase.from('posts').delete().eq('id', id)
  if (error) throw new Error(error.message)

  revalidatePath('/')
  revalidatePath('/admin/posts')
  
  return { success: true }
}
