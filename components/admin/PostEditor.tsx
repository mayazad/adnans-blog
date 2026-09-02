'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import TiptapEditor from './TiptapEditor'
import { savePost, deletePost } from '@/app/admin/actions'
import { createClient } from '@/lib/supabase/client'
import type { Post } from '@/lib/supabase/types'
import styles from './PostEditor.module.css'

interface Props {
  initialPost?: Post
}

export default function PostEditor({ initialPost }: Props) {
  const router = useRouter()
  const supabase = createClient()
  
  const [title, setTitle] = useState(initialPost?.title ?? '')
  const [excerpt, setExcerpt] = useState(initialPost?.excerpt ?? '')
  const [content, setContent] = useState(initialPost?.content ?? '')
  const [category, setCategory] = useState(initialPost?.category ?? '')
  const [tags, setTags] = useState(initialPost?.tags?.join(', ') ?? '')
  const [coverImage, setCoverImage] = useState(initialPost?.cover_image ?? '')
  
  const [status, setStatus] = useState<'draft' | 'published' | 'archived'>(initialPost?.status ?? 'draft')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.length) return
    setIsUploading(true)
    const file = e.target.files[0]
    const fileExt = file.name.split('.').pop()
    const fileName = `cover-${Date.now()}.${fileExt}`
    
    const { data, error } = await supabase.storage
      .from('public-assets')
      .upload(fileName, file)
      
    if (error) {
      alert('Error uploading cover image')
      setIsUploading(false)
      return
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from('public-assets')
      .getPublicUrl(fileName)
      
    setCoverImage(publicUrl)
    setIsUploading(false)
  }

  async function handleSubmit(actionStatus: 'draft' | 'published' | 'archived') {
    if (!title.trim()) {
      alert('Title is required')
      return
    }
    
    setIsSubmitting(true)
    
    const formData = new FormData()
    if (initialPost?.id) formData.append('id', initialPost.id)
    formData.append('title', title)
    formData.append('excerpt', excerpt)
    formData.append('content', content)
    formData.append('category', category)
    formData.append('tags', tags)
    formData.append('cover_image', coverImage)
    formData.append('status', actionStatus)
    
    try {
      const { slug } = await savePost(formData)
      if (actionStatus === 'published') {
        router.push(`/${slug}`)
      } else {
        router.push('/admin/posts')
      }
    } catch (err: any) {
      alert(err.message || 'Error saving post')
      setIsSubmitting(false)
    }
  }

  return (
    <div className={styles.layout}>
      {/* Main Editor Area */}
      <div className={styles.main}>
        <div className={styles.header}>
          <input
            type="text"
            className={styles.titleInput}
            placeholder="Post Title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        
        <div className={styles.editorContainer}>
          <TiptapEditor content={content} onChange={setContent} />
        </div>
      </div>

      {/* Sidebar Meta Panel */}
      <aside className={styles.sidebar}>
        <div className={styles.panel}>
          <h3 className={styles.panelTitle}>Publishing</h3>
          <div className={styles.actions}>
            <button
              className="btn-primary"
              onClick={() => handleSubmit('published')}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Publish'}
            </button>
            <button
              className="btn-secondary"
              onClick={() => handleSubmit('draft')}
              disabled={isSubmitting}
            >
              Save Draft
            </button>
            {initialPost && (
              <button
                className="btn-secondary"
                style={{ color: '#D32F2F', borderColor: '#FFCDD2', background: '#FFF' }}
                onClick={async () => {
                  if (confirm('Are you sure you want to delete this post?')) {
                    await deletePost(initialPost.id)
                  }
                }}
              >
                Delete Post
              </button>
            )}
          </div>
        </div>

        <div className={styles.panel}>
          <h3 className={styles.panelTitle}>Cover Image</h3>
          {coverImage ? (
            <div className={styles.coverPreview}>
              <Image src={coverImage} alt="Cover" fill style={{ objectFit: 'cover' }} />
              <button
                className={styles.removeCover}
                onClick={() => setCoverImage('')}
                title="Remove cover"
              >
                ×
              </button>
            </div>
          ) : (
            <label className={styles.uploadBtn}>
              {isUploading ? 'Uploading...' : 'Upload Image'}
              <input type="file" accept="image/*" hidden onChange={handleCoverUpload} disabled={isUploading} />
            </label>
          )}
        </div>

        <div className={styles.panel}>
          <h3 className={styles.panelTitle}>Metadata</h3>
          
          <div className={styles.field}>
            <label>Excerpt</label>
            <textarea
              className={styles.input}
              rows={3}
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Short summary for previews..."
            />
          </div>

          <div className={styles.field}>
            <label>Category</label>
            <input
              type="text"
              className={styles.input}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. Essay"
            />
          </div>

          <div className={styles.field}>
            <label>Tags</label>
            <input
              type="text"
              className={styles.input}
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Comma separated"
            />
          </div>
        </div>
      </aside>
    </div>
  )
}
