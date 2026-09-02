'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import matter from 'gray-matter'
import TiptapEditor from './TiptapEditor'
import type { TiptapEditorRef } from './TiptapEditor'
import { savePost, deletePost } from '@/app/admin/actions'
import { createClient } from '@/lib/supabase/client'
import type { Post, PostStatus } from '@/lib/supabase/types'
import styles from './PostEditor.module.css'

interface Props {
  initialPost?: Post
}

export default function PostEditor({ initialPost }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const editorRef = useRef<TiptapEditorRef>(null)
  
  const [title, setTitle] = useState(initialPost?.title ?? '')
  const [excerpt, setExcerpt] = useState(initialPost?.excerpt ?? '')
  const [content, setContent] = useState(initialPost?.content ?? '')
  const [category, setCategory] = useState(initialPost?.category ?? '')
  const [tags, setTags] = useState(initialPost?.tags?.join(', ') ?? '')
  const [coverImage, setCoverImage] = useState(initialPost?.cover_image ?? '')
  const [importStatus, setImportStatus] = useState<string | null>(null)
  
  const [status, setStatus] = useState<PostStatus>(initialPost?.status ?? 'draft')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // ── Markdown Import ──────────────────────────────────────────────────────────
  const handleMarkdownImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (ev) => {
      const raw = ev.target?.result as string
      if (!raw) return

      // Parse frontmatter + body
      const { data: frontmatter, content: body } = matter(raw)

      // Auto-fill fields from frontmatter
      if (frontmatter.title) setTitle(frontmatter.title)
      if (frontmatter.excerpt || frontmatter.description) setExcerpt(frontmatter.excerpt ?? frontmatter.description)
      if (frontmatter.category) setCategory(frontmatter.category)
      if (frontmatter.tags) {
        setTags(Array.isArray(frontmatter.tags) ? frontmatter.tags.join(', ') : frontmatter.tags)
      }
      if (frontmatter.cover_image || frontmatter.image) {
        setCoverImage(frontmatter.cover_image ?? frontmatter.image)
      }

      // Detect local image paths and warn
      const localImagePattern = /!\[.*?\]\((?!https?:\/\/)([^)]+)\)/g
      const localImages = [...body.matchAll(localImagePattern)]
      let warningMsg = `✓ Imported: ${file.name}`
      if (localImages.length > 0) {
        warningMsg += `\n⚠ ${localImages.length} local image(s) detected. Upload them via the image button in the toolbar.`
      }

      // ── Cleanup Body ──
      let cleanBody = body.trimStart()
      
      // 0. Remove any leading <div ...> tags
      cleanBody = cleanBody.replace(/^<div[^>]*>\n*/i, '').trimStart()
      
      // 1. Extract H1 Title if it's the very first thing
      const h1Match = cleanBody.match(/^#\s+([^\n]+)/)
      if (h1Match) {
        if (!frontmatter.title) setTitle(h1Match[1].trim())
        cleanBody = cleanBody.replace(/^#\s+[^\n]+\n*/, '').trimStart()
      }

      // 2. Extract Author Block (Name + Email) if it's at the top
      const authorMatch = cleanBody.match(/^([a-zA-Z\s]+)\n+([a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\n*/)
      if (authorMatch) {
        cleanBody = cleanBody.replace(/^([a-zA-Z\s]+)\n+([a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\n*/, '').trimStart()
      }

      // 3. Remove rogue HTML tags like </div> or HRs (---) at the top
      cleanBody = cleanBody.replace(/^(<\/div>|<hr\/?>|---|___|\*\*\*)\n*/i, '').trimStart()
      cleanBody = cleanBody.replace(/^(<\/div>|<hr\/?>|---|___|\*\*\*)\n*/i, '').trimStart() // Run twice in case of </div>\n---

      // Load markdown body into Tiptap
      editorRef.current?.loadMarkdown(cleanBody)
      setImportStatus(warningMsg)

      // Clear the file input so the same file can be re-imported
      e.target.value = ''
    }
    reader.readAsText(file)
  }, [])

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.length) return
    setIsUploading(true)
    setUploadError(null)
    const file = e.target.files[0]
    const fileExt = file.name.split('.').pop()
    const fileName = `cover-${Date.now()}.${fileExt}`
    
    const { error } = await supabase.storage
      .from('public-assets')
      .upload(fileName, file)
      
    if (error) {
      setUploadError(error.message || 'Error uploading cover image')
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
          {/* Import .md button */}
          <label className={styles.importBtn} title="Import a Markdown (.md) file">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            Import .md
            <input type="file" accept=".md,.markdown" hidden onChange={handleMarkdownImport} />
          </label>
        </div>

        {/* Import status toast */}
        {importStatus && (
          <div className={styles.importStatus}>
            {importStatus.split('\n').map((line, i) => (
              <p key={i}>{line}</p>
            ))}
            <button className={styles.dismissStatus} onClick={() => setImportStatus(null)}>×</button>
          </div>
        )}
        
        <div className={styles.editorContainer}>
          <TiptapEditor ref={editorRef} content={content} onChange={setContent} />
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
                onClick={() => setShowDeleteConfirm(true)}
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
            <>
              <label className={styles.uploadBtn}>
                {isUploading ? 'Uploading...' : 'Upload Image'}
                <input type="file" accept="image/*" hidden onChange={handleCoverUpload} disabled={isUploading} />
              </label>
              {uploadError && <p className={styles.errorText}>{uploadError}</p>}
            </>
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

      {/* Custom Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>Delete Post</h3>
            <p>Are you sure you want to delete this post? This action cannot be undone.</p>
            <div className={styles.modalActions}>
              <button 
                className="btn-secondary" 
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button 
                className="btn-primary" 
                style={{ background: '#D32F2F', borderColor: '#D32F2F' }}
                onClick={async () => {
                  setIsSubmitting(true)
                  try {
                    await deletePost(initialPost!.id)
                    router.push('/admin/posts')
                  } catch (err) {
                    setIsSubmitting(false)
                    alert('Error deleting post')
                  }
                }}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
