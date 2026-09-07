'use client'

import { useState } from 'react'
import type { User } from '@supabase/supabase-js'
import type { Profile, ReactionType } from '@/lib/supabase/types'
import { createClient } from '@/lib/supabase/client'
import AuthModal from '../ui/AuthModal'
import styles from './ReactionRail.module.css'

interface Props {
  postId: string
  initialCounts: { like: number, insightful: number, love: number }
  initialUserReacted: { like: boolean, insightful: boolean, love: boolean }
  commentCount: number
  user: User | null
  userProfile: Pick<Profile, 'id' | 'full_name' | 'username' | 'avatar_url'> | null
}

export default function ReactionRail({
  postId,
  initialCounts,
  initialUserReacted,
  commentCount,
  user,
}: Props) {
  const [counts, setCounts] = useState(initialCounts)
  const [reacted, setReacted] = useState(initialUserReacted)
  const [pending, setPending] = useState({ like: false, insightful: false, love: false })
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const supabase = createClient()

  async function handleReact(type: ReactionType) {
    if (!user) {
      setAuthModalOpen(true)
      return
    }

    if (pending[type]) return
    setPending(p => ({ ...p, [type]: true }))

    const newReactedState = !reacted[type]
    const newCount = newReactedState ? counts[type] + 1 : Math.max(0, counts[type] - 1)

    // Optimistic update
    setReacted(r => ({ ...r, [type]: newReactedState }))
    setCounts(c => ({ ...c, [type]: newCount }))

    let error = null
    if (newReactedState) {
      const res = await supabase.from('reactions').insert({
        post_id: postId,
        user_id: user.id,
        type,
      })
      error = res.error
    } else {
      const res = await supabase
        .from('reactions')
        .delete()
        .match({ post_id: postId, user_id: user.id, type })
      error = res.error
    }

    if (error) {
      console.error(`Error updating ${type} reaction:`, error)
      setReacted(r => ({ ...r, [type]: !newReactedState }))
      setCounts(c => ({ ...c, [type]: !newReactedState ? newCount + 1 : Math.max(0, newCount - 1) }))
      alert('Failed to save reaction. Please try again.')
    }

    setPending(p => ({ ...p, [type]: false }))
  }

  return (
    <>
      <aside className={styles.rail} aria-label="Reactions">
        {/* Like */}
        <button
          className={`${styles.reactBtn} ${reacted.like ? styles.active : ''}`}
          onClick={() => handleReact('like')}
          aria-label={reacted.like ? 'Unlike' : 'Like'}
          title="Like"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
          </svg>
          <span>{counts.like}</span>
        </button>

        {/* Insightful */}
        <button
          className={`${styles.reactBtn} ${reacted.insightful ? styles.activeInsightful : ''}`}
          onClick={() => handleReact('insightful')}
          aria-label={reacted.insightful ? 'Remove Insightful' : 'Mark Insightful'}
          title="Insightful"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
          </svg>
          <span>{counts.insightful}</span>
        </button>

        {/* Love */}
        <button
          className={`${styles.reactBtn} ${reacted.love ? styles.activeLove : ''}`}
          onClick={() => handleReact('love')}
          aria-label={reacted.love ? 'Remove Love' : 'Love'}
          title="Love"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          <span>{counts.love}</span>
        </button>

        <a href="#comments" className={styles.reactBtn} aria-label="Jump to comments" title="Comments">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
          <span>{commentCount}</span>
        </a>

        {!user && <p className={styles.note}>Sign in to react.</p>}
      </aside>

      {authModalOpen && (
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          message="Sign in to react to this post."
        />
      )}
    </>
  )
}
