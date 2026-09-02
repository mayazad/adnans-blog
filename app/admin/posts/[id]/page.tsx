import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PostEditor from '@/components/admin/PostEditor'
import type { Post } from '@/lib/supabase/types'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditPostPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: post } = await supabase
    .from('posts')
    .select('*')
    .eq('id', id)
    .single()

  if (!post) notFound()

  return (
    <>
      <header className="admin-header">
        <div>
          <h1 className="admin-title">Edit Post</h1>
          <p className="admin-subtitle">Updating "{post.title}"</p>
        </div>
      </header>
      <PostEditor initialPost={post as Post} />
    </>
  )
}
