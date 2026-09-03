'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Tag } from '@/lib/supabase/types'
import { slugify } from '@/lib/utils'
import styles from '../admin.module.css'

const CATEGORIES = [
  'Machine Learning',
  'Web Development',
  'AI Ethics',
  'Tools & Infrastructure',
  'Generative AI',
  'Data Science',
  'Opinion',
  'Other',
]

interface Props {
  initialTags: Tag[]
}

export default function TagsManager({ initialTags }: Props) {
  const supabase = createClient()
  const [tags, setTags] = useState<Tag[]>(initialTags)
  const [showForm, setShowForm] = useState(false)
  const [editingTag, setEditingTag] = useState<Tag | null>(null)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [category, setCategory] = useState('')
  const [aliasInput, setAliasInput] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function openNew() {
    setEditingTag(null)
    setName(''); setSlug(''); setCategory(''); setAliasInput('')
    setShowForm(true)
  }

  function openEdit(tag: Tag) {
    setEditingTag(tag)
    setName(tag.name)
    setSlug(tag.slug)
    setCategory(tag.category ?? '')
    setAliasInput(tag.aliases.join(', '))
    setShowForm(true)
  }

  function cancel() {
    setShowForm(false)
    setEditingTag(null)
    setError(null)
  }

  function handleNameChange(val: string) {
    setName(val)
    if (!editingTag) setSlug(slugify(val))
  }

  async function handleSave() {
    if (!name.trim() || !slug.trim()) {
      setError('Name and slug are required.')
      return
    }
    setIsSaving(true); setError(null)
    const aliases = aliasInput.split(',').map(a => a.trim()).filter(Boolean)
    const payload = { name: name.trim(), slug: slug.trim(), category: category || null, aliases }

    if (editingTag) {
      const { data, error: err } = await supabase
        .from('tags').update(payload).eq('id', editingTag.id).select().single()
      if (err) { setError(err.message); setIsSaving(false); return }
      setTags(prev => prev.map(t => t.id === editingTag.id ? data as Tag : t))
    } else {
      const { data, error: err } = await supabase
        .from('tags').insert(payload).select().single()
      if (err) { setError(err.message); setIsSaving(false); return }
      setTags(prev => [...prev, data as Tag].sort((a, b) => a.name.localeCompare(b.name)))
    }

    setIsSaving(false); cancel()
  }

  async function handleDelete(tag: Tag) {
    if (!confirm(`Delete tag "${tag.name}"? Posts using it will lose this tag.`)) return
    const { error: err } = await supabase.from('tags').delete().eq('id', tag.id)
    if (err) { alert(err.message); return }
    setTags(prev => prev.filter(t => t.id !== tag.id))
  }

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Tags</h1>
          <p className={styles.pageSubtitle}>{tags.length} tag{tags.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn-primary" onClick={openNew}>+ New Tag</button>
      </div>

      {showForm && (
        <div style={{ background: 'var(--bg-raised)', border: '1px solid var(--line)', borderRadius: 'var(--radius-md)', padding: '24px', marginBottom: '24px' }}>
          <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.1rem', marginBottom: '16px' }}>
            {editingTag ? 'Edit Tag' : 'New Tag'}
          </h2>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--ink-soft)', marginBottom: '4px' }}>Canonical Name *</label>
              <input
                type="text"
                className={styles.input}
                value={name}
                onChange={e => handleNameChange(e.target.value)}
                placeholder="e.g. Machine Learning"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--ink-soft)', marginBottom: '4px' }}>Slug * (used in URLs)</label>
              <input
                type="text"
                className={styles.input}
                value={slug}
                onChange={e => setSlug(e.target.value)}
                placeholder="e.g. machine-learning"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--ink-soft)', marginBottom: '4px' }}>Category</label>
              <select className={styles.input} value={category} onChange={e => setCategory(e.target.value)}>
                <option value="">— None —</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--ink-soft)', marginBottom: '4px' }}>Aliases (comma-separated)</label>
              <input
                type="text"
                className={styles.input}
                value={aliasInput}
                onChange={e => setAliasInput(e.target.value)}
                placeholder="e.g. ML, machine learning, ML models"
              />
            </div>
            {error && <p style={{ color: '#e53e3e', fontSize: '0.9rem' }}>{error}</p>}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn-primary" onClick={handleSave} disabled={isSaving}>
                {isSaving ? 'Saving…' : 'Save Tag'}
              </button>
              <button className="btn-secondary" onClick={cancel}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ background: 'var(--bg-raised)', border: '1px solid var(--line)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
        {tags.length === 0 ? (
          <p style={{ padding: '40px', textAlign: 'center', color: 'var(--ink-faint)', fontFamily: 'var(--serif)' }}>
            No tags yet. Create your first one above.
          </p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--line)', textAlign: 'left' }}>
                <th style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'var(--ink-soft)', fontWeight: 500 }}>NAME</th>
                <th style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'var(--ink-soft)', fontWeight: 500 }}>SLUG</th>
                <th style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'var(--ink-soft)', fontWeight: 500 }}>CATEGORY</th>
                <th style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'var(--ink-soft)', fontWeight: 500 }}>ALIASES</th>
                <th style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'var(--ink-soft)', fontWeight: 500 }}></th>
              </tr>
            </thead>
            <tbody>
              {tags.map((tag, i) => (
                <tr key={tag.id} style={{ borderBottom: i < tags.length - 1 ? '1px solid var(--line)' : 'none' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 500 }}>{tag.name}</td>
                  <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--ink-soft)' }}>{tag.slug}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--ink-soft)', fontSize: '0.9rem' }}>{tag.category ?? '—'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {tag.aliases.length === 0 ? (
                        <span style={{ color: 'var(--ink-faint)', fontSize: '0.85rem' }}>—</span>
                      ) : tag.aliases.map(a => (
                        <span key={a} style={{ background: 'var(--neutral-tint)', padding: '2px 8px', borderRadius: 'var(--radius-pill)', fontSize: '0.8rem', color: 'var(--ink-soft)' }}>{a}</span>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button onClick={() => openEdit(tag)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--emerald)', fontSize: '0.85rem', marginRight: '12px' }}>Edit</button>
                    <button onClick={() => handleDelete(tag)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e53e3e', fontSize: '0.85rem' }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
