'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import CharacterCount from '@tiptap/extension-character-count'
import TextAlign from '@tiptap/extension-text-align'
import { Table, TableRow, TableCell, TableHeader } from '@tiptap/extension-table'
import { Markdown } from '@tiptap/markdown'
import { useCallback, useImperativeHandle, forwardRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import styles from './TiptapEditor.module.css'

export interface TiptapEditorRef {
  loadMarkdown: (markdown: string) => void
}

interface Props {
  content: string
  onChange: (html: string) => void
}

const TiptapEditor = forwardRef<TiptapEditorRef, Props>(function TiptapEditor({ content, onChange }, ref) {
  const supabase = createClient()

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({
        placeholder: 'Start writing...',
      }),
      Link.configure({
        openOnClick: false,
      }),
      Image.configure({
        HTMLAttributes: {
          class: styles.editorImage,
        },
      }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableHeader,
      TableCell,
      CharacterCount,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Markdown,
    ],
    content,
    editorProps: {
      attributes: {
        class: styles.prose,
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  useImperativeHandle(ref, () => ({
    loadMarkdown(markdown: string) {
      if (!editor) return
      import('marked').then(({ marked }) => {
        const html = marked.parse(markdown) as string
        editor.commands.setContent(html)
        onChange(editor.getHTML())
      })
    },
  }))

  const setLink = useCallback(() => {
    if (!editor) return
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('URL', previousUrl)
    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }, [editor])

  const addImage = useCallback(async () => {
    if (!editor) return
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async () => {
      if (input.files?.length) {
        const file = input.files[0]
        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random()}.${fileExt}`
        const filePath = `post-images/${fileName}`

        const { error } = await supabase.storage
          .from('public-assets')
          .upload(filePath, file)

        if (error) {
          alert('Error uploading image.')
          return
        }

        const { data: { publicUrl } } = supabase.storage
          .from('public-assets')
          .getPublicUrl(filePath)

        editor.chain().focus().setImage({ src: publicUrl }).run()
      }
    }
    input.click()
  }, [editor, supabase])

  if (!editor) return null

  return (
    <div className={styles.editorWrapper}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarGroup}>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`${styles.toolbarBtn} ${editor.isActive('bold') ? styles.active : ''}`}
            title="Bold"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path></svg>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`${styles.toolbarBtn} ${editor.isActive('italic') ? styles.active : ''}`}
            title="Italic"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="4" x2="10" y2="4"></line><line x1="14" y1="20" x2="5" y2="20"></line><line x1="15" y1="4" x2="9" y2="20"></line></svg>
          </button>
          <button
            type="button"
            onClick={setLink}
            className={`${styles.toolbarBtn} ${editor.isActive('link') ? styles.active : ''}`}
            title="Link"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
          </button>
        </div>

        <div className={styles.toolbarDivider} />

        <div className={styles.toolbarGroup}>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={`${styles.toolbarBtn} ${editor.isActive({ textAlign: 'left' }) ? styles.active : ''}`}
            title="Align Left"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="17" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="17" y1="18" x2="3" y2="18"/></svg>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={`${styles.toolbarBtn} ${editor.isActive({ textAlign: 'center' }) ? styles.active : ''}`}
            title="Align Center"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="10" x2="6" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="18" y1="18" x2="6" y2="18"/></svg>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={`${styles.toolbarBtn} ${editor.isActive({ textAlign: 'right' }) ? styles.active : ''}`}
            title="Align Right"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="21" y1="10" x2="7" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="21" y1="18" x2="7" y2="18"/></svg>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            className={`${styles.toolbarBtn} ${editor.isActive({ textAlign: 'justify' }) ? styles.active : ''}`}
            title="Justify"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="21" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="21" y1="18" x2="3" y2="18"/></svg>
          </button>
        </div>

        <div className={styles.toolbarDivider} />

        <div className={styles.toolbarGroup}>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`${styles.toolbarBtn} ${editor.isActive('heading', { level: 1 }) ? styles.active : ''}`}
            title="Heading 1"
          >
            H1
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`${styles.toolbarBtn} ${editor.isActive('heading', { level: 2 }) ? styles.active : ''}`}
            title="Heading 2"
          >
            H2
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`${styles.toolbarBtn} ${editor.isActive('heading', { level: 3 }) ? styles.active : ''}`}
            title="Heading 3"
          >
            H3
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`${styles.toolbarBtn} ${editor.isActive('blockquote') ? styles.active : ''}`}
            title="Quote"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"></path><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"></path></svg>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={`${styles.toolbarBtn} ${editor.isActive('codeBlock') ? styles.active : ''}`}
            title="Code Block"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
          </button>
        </div>

        <div className={styles.toolbarDivider} />

        <div className={styles.toolbarGroup}>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`${styles.toolbarBtn} ${editor.isActive('bulletList') ? styles.active : ''}`}
            title="Bullet List"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`${styles.toolbarBtn} ${editor.isActive('orderedList') ? styles.active : ''}`}
            title="Ordered List"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/></svg>
          </button>
          <button
            type="button"
            onClick={addImage}
            className={styles.toolbarBtn}
            title="Add Image"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
          </button>
        </div>
      </div>

      {/* Editor Body */}
      <div className={styles.editorScrollArea}>
        <EditorContent editor={editor} />
      </div>
      
      {/* Footer Info */}
      <div className={styles.editorFooter}>
        {editor.storage.characterCount.words()} words
      </div>
    </div>
  )
})

export default TiptapEditor
