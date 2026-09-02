'use client'

import { useState } from 'react'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/lib/supabase/types'
import { createClient } from '@/lib/supabase/client'
import AuthModal from '../ui/AuthModal'
import styles from './ReactionRail.module.css'

interface Props {
  postId: string
  initialCount: number
  initialUserReacted: boolean
  commentCount: number
  user: User | null
  userProfile: Pick<Profile, 'id' | 'full_name' | 'username' | 'avatar_url'> | null
}

export default function ReactionRail({
  postId,
  initialCount,
  initialUserReacted,
  commentCount,
  user,
}: Props) {
  const [count, setCount] = useState(initialCount)
  const [reacted, setReacted] = useState(initialUserReacted)
  const [isPending, setIsPending] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const supabase = createClient()

  async function handleReact() {
    if (!user) {
      setAuthModalOpen(true)
      return
    }

    if (isPending) return
    setIsPending(true)

    const newReacted = !reacted
    const newCount = newReacted ? count + 1 : Math.max(0, count - 1)

    // Optimistic update
    setReacted(newReacted)
    setCount(newCount)

    if (newReacted) {
      await supabase.from('reactions').insert({
        post_id: postId,
        user_id: user.id,
        type: 'like',
      })
    } else {
      await supabase
        .from('reactions')
        .delete()
        .match({ post_id: postId, user_id: user.id, type: 'like' })
    }

    setIsPending(false)
  }

  return (
    <>
      <aside className={styles.rail} aria-label="Reactions">
        <button
          className={`${styles.reactBtn} ${reacted ? styles.active : ''}`}
          onClick={handleReact}
          aria-label={reacted ? 'Unlike' : 'Like'}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
          </svg>
          <span>{count}</span>
        </button>

        <a href="#comments" className={styles.reactBtn} aria-label="Jump to comments">
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
