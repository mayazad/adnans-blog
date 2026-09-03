'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Series } from '@/lib/supabase/types'
import { slugify } from '@/lib/utils'
import styles from '../admin.module.css'

interface SimplePost { id: string; title: string; slug: string; status: string }
interface SeriesWithPosts extends Series { posts: (SimplePost & { position: number })[] }

interface Props {
  initialSeries: Series[]
  initialSeriesPosts: { series_id: string; post_id: string; position: number; posts: SimplePost }[]
  allPosts: SimplePost[]
}

export default function SeriesManager({ initialSeries, initialSeriesPosts, allPosts }: Props) {
  const supabase = createClient()

  // Build series with posts map
  const buildSeriesWithPosts = (series: Series[]): SeriesWithPosts[] =>
    series.map(s => ({
      ...s,
      posts: initialSeriesPosts
        .filter(sp => sp.series_id === s.id)
        .sort((a, b) => a.position - b.position)
        .map(sp => ({ ...sp.posts, position: sp.position })),
    }))

  const [seriesList, setSeriesList] = useState<SeriesWithPosts[]>(buildSeriesWithPosts(initialSeries))
  const [showForm, setShowForm] = useState(false)
  const [editingSeries, setEditingSeries] = useState<SeriesWithPosts | null>(null)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [selectedPosts, setSelectedPosts] = useState<{ postId: string; position: number }[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function openNew() {
    setEditingSeries(null)
    setName(''); setSlug(''); setDescription(''); setSelectedPosts([])
    setShowForm(true)
  }

  function openEdit(s: SeriesWithPosts) {
    setEditingSeries(s)
    setName(s.name); setSlug(s.slug); setDescription(s.description ?? '')
    setSelectedPosts(s.posts.map(p => ({ postId: p.id, position: p.position })))
    setShowForm(true)
  }

  function cancel() { setShowForm(false); setEditingSeries(null); setError(null) }

  function addPost(postId: string) {
    if (selectedPosts.find(sp => sp.postId === postId)) return
    const nextPos = selectedPosts.length + 1
    setSelectedPosts(prev => [...prev, { postId, position: nextPos }])
  }

  function removePost(postId: string) {
    setSelectedPosts(prev => {
      const filtered = prev.filter(sp => sp.postId !== postId)
      return filtered.map((sp, i) => ({ ...sp, position: i + 1 }))
    })
  }

  function movePost(postId: string, dir: 'up' | 'down') {
    setSelectedPosts(prev => {
      const idx = prev.findIndex(sp => sp.postId === postId)
      if (idx < 0) return prev
      const next = [...prev]
      const swapIdx = dir === 'up' ? idx - 1 : idx + 1
      if (swapIdx < 0 || swapIdx >= next.length) return prev
      ;[next[idx], next[swapIdx]] = [next[swapIdx], next[idx]]
      return next.map((sp, i) => ({ ...sp, position: i + 1 }))
    })
  }

  async function handleSave() {
    if (!name.trim() || !slug.trim()) { setError('Name and slug are required.'); return }
    setIsSaving(true); setError(null)
    const payload = { name: name.trim(), slug: slug.trim(), description: description || null }

    let seriesId: string
    if (editingSeries) {
      const { error: err } = await supabase.from('series').update(payload).eq('id', editingSeries.id)
      if (err) { setError(err.message); setIsSaving(false); return }
      seriesId = editingSeries.id
      // Remove old post links
      await supabase.from('series_posts').delete().eq('series_id', seriesId)
    } else {
      const { data, error: err } = await supabase.from('series').insert(payload).select().single()
      if (err) { setError(err.message); setIsSaving(false); return }
      seriesId = (data as Series).id
    }

    // Insert ordered posts
    if (selectedPosts.length > 0) {
      const rows = selectedPosts.map(sp => ({ series_id: seriesId, post_id: sp.postId, position: sp.position }))
      const { error: err2 } = await supabase.from('series_posts').insert(rows)
      if (err2) { setError(err2.message); setIsSaving(false); return }
    }

    // Reload page to get fresh data
    window.location.reload()
  }

  async function handleDelete(s: SeriesWithPosts) {
    if (!confirm(`Delete series "${s.name}"? Posts will not be deleted.`)) return
    const { error: err } = await supabase.from('series').delete().eq('id', s.id)
    if (err) { alert(err.message); return }
    setSeriesList(prev => prev.filter(x => x.id !== s.id))
  }

  const unselectedPosts = allPosts.filter(p => !selectedPosts.find(sp => sp.postId === p.id))

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Series</h1>
          <p className={styles.pageSubtitle}>{seriesList.length} series</p>
        </div>
        <button className="btn-primary" onClick={openNew}>+ New Series</button>
      </div>

      {showForm && (
        <div style={{ background: 'var(--bg-raised)', border: '1px solid var(--line)', borderRadius: 'var(--radius-md)', padding: '24px', marginBottom: '24px' }}>
          <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.1rem', marginBottom: '16px' }}>
            {editingSeries ? 'Edit Series' : 'New Series'}
          </h2>
          <div style={{ display: 'grid', gap: '12px', marginBottom: '24px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--ink-soft)', marginBottom: '4px' }}>Series Name *</label>
              <input type="text" className={styles.input} value={name} onChange={e => { setName(e.target.value); if (!editingSeries) setSlug(slugify(e.target.value)) }} placeholder="e.g. Machine Learning Fundamentals" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--ink-soft)', marginBottom: '4px' }}>Slug *</label>
              <input type="text" className={styles.input} value={slug} onChange={e => setSlug(e.target.value)} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--ink-soft)', marginBottom: '4px' }}>Description</label>
              <textarea className={styles.input} rows={2} value={description} onChange={e => setDescription(e.target.value)} placeholder="A short description for the series hub page" />
            </div>
          </div>

          <h3 style={{ fontFamily: 'var(--sans)', fontSize: '0.9rem', color: 'var(--ink-soft)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Posts in this series (in order)</h3>

          {selectedPosts.length > 0 && (
            <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {selectedPosts.map((sp, i) => {
                const post = allPosts.find(p => p.id === sp.postId)
                if (!post) return null
                return (
                  <div key={sp.postId} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 12px', background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)' }}>
                    <span style={{ color: 'var(--ink-faint)', fontFamily: 'monospace', minWidth: '20px' }}>{i + 1}</span>
                    <span style={{ flex: 1, fontSize: '0.9rem' }}>{post.title}</span>
                    <button type="button" onClick={() => movePost(sp.postId, 'up')} disabled={i === 0} style={{ background: 'none', border: 'none', cursor: i === 0 ? 'not-allowed' : 'pointer', opacity: i === 0 ? 0.3 : 1, fontSize: '1rem' }}>↑</button>
                    <button type="button" onClick={() => movePost(sp.postId, 'down')} disabled={i === selectedPosts.length - 1} style={{ background: 'none', border: 'none', cursor: i === selectedPosts.length - 1 ? 'not-allowed' : 'pointer', opacity: i === selectedPosts.length - 1 ? 0.3 : 1, fontSize: '1rem' }}>↓</button>
                    <button type="button" onClick={() => removePost(sp.postId)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e53e3e', fontSize: '1rem' }}>×</button>
                  </div>
                )
              })}
            </div>
          )}

          {unselectedPosts.length > 0 && (
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--ink-soft)', marginBottom: '8px' }}>Add a post:</label>
              <select className={styles.input} style={{ width: 'auto' }} onChange={e => { if (e.target.value) addPost(e.target.value); e.target.value = '' }} defaultValue="">
                <option value="" disabled>— Select a post —</option>
                {unselectedPosts.map(p => (
                  <option key={p.id} value={p.id}>{p.title} ({p.status})</option>
                ))}
              </select>
            </div>
          )}

          {error && <p style={{ color: '#e53e3e', fontSize: '0.9rem', marginTop: '12px' }}>{error}</p>}
          <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
            <button className="btn-primary" onClick={handleSave} disabled={isSaving}>{isSaving ? 'Saving…' : 'Save Series'}</button>
            <button className="btn-secondary" onClick={cancel}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {seriesList.length === 0 ? (
          <div style={{ background: 'var(--bg-raised)', border: '1px solid var(--line)', borderRadius: 'var(--radius-md)', padding: '40px', textAlign: 'center' }}>
            <p style={{ color: 'var(--ink-faint)', fontFamily: 'var(--serif)' }}>No series yet. Create one to build a reading path.</p>
          </div>
        ) : seriesList.map(s => (
          <div key={s.id} style={{ background: 'var(--bg-raised)', border: '1px solid var(--line)', borderRadius: 'var(--radius-md)', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div>
                <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.1rem', margin: '0 0 4px' }}>{s.name}</h2>
                {s.description && <p style={{ color: 'var(--ink-soft)', fontSize: '0.9rem', margin: 0 }}>{s.description}</p>}
              </div>
              <div style={{ display: 'flex', gap: '12px', flexShrink: 0 }}>
                <button onClick={() => openEdit(s)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--emerald)', fontSize: '0.85rem' }}>Edit</button>
                <button onClick={() => handleDelete(s)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e53e3e', fontSize: '0.85rem' }}>Delete</button>
              </div>
            </div>
            {s.posts.length > 0 ? (
              <ol style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {s.posts.map(p => (
                  <li key={p.id} style={{ fontSize: '0.9rem', color: 'var(--ink-soft)' }}>{p.title}</li>
                ))}
              </ol>
            ) : (
              <p style={{ color: 'var(--ink-faint)', fontSize: '0.85rem', margin: 0 }}>No posts yet.</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
