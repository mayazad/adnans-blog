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
  const tagsStr = formData.get('tags') as string
  const coverImage = formData.get('cover_image') as string
  const status = formData.get('status') as 'draft' | 'published' | 'archived'

  const slug = slugify(title)
  const tags = tagsStr ? tagsStr.split(',').map((t) => t.trim()).filter(Boolean) : []
  
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
    tags,
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

  revalidatePath('/')
  revalidatePath(`/${slug}`)
  revalidatePath('/admin/posts')
  
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
