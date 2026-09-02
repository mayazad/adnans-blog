'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { User } from '@supabase/supabase-js'
import type { Profile, CommentWithUser } from '@/lib/supabase/types'
import { createClient } from '@/lib/supabase/client'
import { relativeTime } from '@/lib/utils'
import AuthModal from '../ui/AuthModal'
import styles from './CommentsSection.module.css'

interface Props {
  postId: string
  initialComments: CommentWithUser[]
  user: User | null
  userProfile: Pick<Profile, 'id' | 'full_name' | 'username' | 'avatar_url'> | null
}

export default function CommentsSection({
  postId,
  initialComments,
  user,
  userProfile,
}: Props) {
  const [comments, setComments] = useState(initialComments)
  const [input, setInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || isSubmitting || !user || !userProfile) return

    setIsSubmitting(true)
    const content = input.trim()
    setInput('') // Optimistic clear

    const tempId = `temp-${Date.now()}`
    const tempComment: CommentWithUser = {
      id: tempId,
      post_id: postId,
      user_id: user.id,
      parent_comment_id: null,
      content,
      created_at: new Date().toISOString(),
      profiles: {
        id: userProfile.id,
        full_name: userProfile.full_name,
        username: userProfile.username,
        avatar_url: userProfile.avatar_url,
      },
    }

    // Optimistic insert (at top)
    setComments([tempComment, ...comments])

    const { data, error } = await supabase
      .from('comments')
      .insert({
        post_id: postId,
        user_id: user.id,
        content,
      })
      .select(`
        *,
        profiles:user_id ( id, full_name, username, avatar_url )
      `)
      .single()

    if (error || !data) {
      // Rollback
      setComments((prev) => prev.filter((c) => c.id !== tempId))
      setInput(content)
      alert('Failed to post comment. Please try again.')
    } else {
      // Swap temp with real
      setComments((prev) =>
        prev.map((c) => (c.id === tempId ? (data as CommentWithUser) : c))
      )
    }
    
    setIsSubmitting(false)
  }

  function getInitials(name: string | null, username: string | null) {
    const display = name ?? username ?? '?'
    return display.charAt(0).toUpperCase()
  }

  return (
    <section className={styles.section} id="comments" aria-label="Comments">
      <h2 className={styles.heading}>Discussion ({comments.length})</h2>

      {!user ? (
        <div className={styles.gate}>
          <p>Sign in to join the discussion.</p>
          <div className={styles.gateActions}>
            <button className="btn-primary" onClick={() => setAuthModalOpen(true)}>
              Continue with Google
            </button>
            <button className="btn-secondary" onClick={() => setAuthModalOpen(true)}>
              Sign up with email
            </button>
          </div>
        </div>
      ) : (
        <form className={styles.form} onSubmit={handleSubmit}>
          {userProfile?.avatar_url ? (
            <Image
              src={userProfile.avatar_url}
              alt="You"
              width={32}
              height={32}
              className="avatar avatar-md"
              style={{ objectFit: 'cover' }}
            />
          ) : (
            <span className="avatar avatar-md">
              {getInitials(userProfile?.full_name ?? null, userProfile?.username ?? null)}
            </span>
          )}
          
          <div className={styles.inputWrapper}>
            <textarea
              className={styles.textarea}
              placeholder="Add to the discussion"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isSubmitting}
              rows={2}
            />
            <div className={styles.formActions}>
              <button
                type="submit"
                className="btn-primary"
                disabled={!input.trim() || isSubmitting}
              >
                Post
              </button>
            </div>
          </div>
        </form>
      )}

      <div className={styles.list}>
        {comments.map((comment) => (
          <div key={comment.id} className={styles.comment}>
            {comment.profiles.avatar_url ? (
              <Image
                src={comment.profiles.avatar_url}
                alt={comment.profiles.full_name ?? comment.profiles.username ?? 'User'}
                width={32}
                height={32}
                className="avatar avatar-md"
                style={{ objectFit: 'cover' }}
              />
            ) : (
              <span className="avatar avatar-md">
                {getInitials(comment.profiles.full_name, comment.profiles.username)}
              </span>
            )}
            
            <div className={styles.commentContent}>
              <div className={styles.commentMeta}>
                <span className={styles.commentName}>
                  {comment.profiles.full_name ?? comment.profiles.username ?? 'Unknown'}
                </span>
                <span className={styles.commentTime}>
                  {relativeTime(comment.created_at)}
                </span>
              </div>
              <p className={styles.commentText}>{comment.content}</p>
            </div>
          </div>
        ))}
      </div>

      {authModalOpen && (
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          message="Sign in to join the discussion."
        />
      )}
    </section>
  )
}
