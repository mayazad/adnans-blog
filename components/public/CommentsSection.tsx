'use client'

import { useState, useMemo } from 'react'
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
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  
  // Custom Modal States
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [reportingId, setReportingId] = useState<string | null>(null)
  const [reportReason, setReportReason] = useState('')
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  const supabase = createClient()

  // Group comments into a tree
  const rootComments = useMemo(() => {
    const map = new Map<string, CommentWithUser & { children: any[] }>()
    const roots: any[] = []
    
    // Create map
    comments.forEach(c => map.set(c.id, { ...c, children: [] }))
    
    // Link children
    comments.forEach(c => {
      if (c.parent_comment_id) {
        const parent = map.get(c.parent_comment_id)
        if (parent) {
          parent.children.push(map.get(c.id)!)
        } else {
          roots.push(map.get(c.id)!) // Parent not found, treat as root
        }
      } else {
        roots.push(map.get(c.id)!)
      }
    })
    
    return roots
  }, [comments])

  async function handleSubmit(e: React.FormEvent, parentId: string | null = null, replyContent: string = input) {
    e.preventDefault()
    if (!replyContent.trim() || isSubmitting || !user || !userProfile) return

    setIsSubmitting(true)
    if (!parentId) setInput('')
    if (parentId) setReplyingTo(null)

    const tempId = `temp-${Date.now()}`
    const tempComment: CommentWithUser = {
      id: tempId,
      post_id: postId,
      user_id: user.id,
      parent_comment_id: parentId,
      content: replyContent.trim(),
      created_at: new Date().toISOString(),
      profiles: {
        id: userProfile.id,
        full_name: userProfile.full_name,
        username: userProfile.username,
        avatar_url: userProfile.avatar_url,
      },
      comment_votes: []
    }

    setComments((prev) => [...prev, tempComment])

    const { data, error } = await supabase
      .from('comments')
      .insert({
        post_id: postId,
        user_id: user.id,
        content: replyContent.trim(),
        parent_comment_id: parentId,
      })
      .select(`
        *,
        profiles:user_id ( id, full_name, username, avatar_url ),
        comment_votes ( vote_value, user_id )
      `)
      .single()

    if (error || !data) {
      setComments((prev) => prev.filter((c) => c.id !== tempId))
      if (!parentId) setInput(replyContent)
      setToastMsg('Failed to post comment. Please try again.')
    } else {
      setComments((prev) => prev.map((c) => (c.id === tempId ? (data as CommentWithUser) : c)))
    }
    
    setIsSubmitting(false)
  }

  async function handleVote(commentId: string, value: 1 | -1) {
    if (!user) return setAuthModalOpen(true)
    
    const comment = comments.find(c => c.id === commentId)
    if (!comment) return
    const existingVote = comment.comment_votes?.find(v => v.user_id === user.id)
    
    const newVoteValue = existingVote?.vote_value === value ? 0 : value
    
    setComments(prev => prev.map(c => {
      if (c.id !== commentId) return c
      let newVotes = [...(c.comment_votes || [])]
      if (newVoteValue === 0) {
        newVotes = newVotes.filter(v => v.user_id !== user.id)
      } else if (existingVote) {
        newVotes = newVotes.map(v => v.user_id === user.id ? { ...v, vote_value: newVoteValue } : v)
      } else {
        newVotes.push({ user_id: user.id, vote_value: newVoteValue })
      }
      return { ...c, comment_votes: newVotes }
    }))

    if (newVoteValue === 0) {
      await supabase.from('comment_votes').delete().match({ comment_id: commentId, user_id: user.id })
    } else {
      await supabase.from('comment_votes').upsert({
        comment_id: commentId,
        user_id: user.id,
        vote_value: newVoteValue
      }, { onConflict: 'comment_id,user_id' })
    }
  }

  async function confirmDelete() {
    if (!deletingId) return
    const commentId = deletingId
    setDeletingId(null)
    
    setComments(prev => prev.filter(c => c.id !== commentId && c.parent_comment_id !== commentId))
    
    const { error } = await supabase.from('comments').delete().eq('id', commentId)
    if (error) setToastMsg('Failed to delete comment.')
  }

  async function confirmReport(e: React.FormEvent) {
    e.preventDefault()
    if (!reportingId || !reportReason.trim() || !user) return
    
    const commentId = reportingId
    const reason = reportReason
    setReportingId(null)
    setReportReason('')
    
    const { error } = await supabase.from('reports').insert({
      comment_id: commentId,
      reporter_id: user.id,
      reason
    })
    
    if (error) setToastMsg('You have already reported this or an error occurred.')
    else setToastMsg('Report submitted successfully. Thank you.')
  }

  function getInitials(name: string | null, username: string | null) {
    const display = name ?? username ?? '?'
    return display.charAt(0).toUpperCase()
  }

  const renderComment = (c: any, depth = 0) => {
    const isOwner = user?.id === c.user_id
    const upvotes = c.comment_votes?.filter((v: any) => v.vote_value === 1).length || 0
    const downvotes = c.comment_votes?.filter((v: any) => v.vote_value === -1).length || 0
    const score = upvotes - downvotes
    const myVote = c.comment_votes?.find((v: any) => v.user_id === user?.id)?.vote_value || 0

    return (
      <div key={c.id} className={`${styles.commentThread} ${depth > 0 ? styles.replyDepth : ''}`}>
        <div className={styles.comment}>
          {c.profiles.avatar_url ? (
            <Image
              src={c.profiles.avatar_url}
              alt={c.profiles.full_name ?? c.profiles.username ?? 'User'}
              width={32}
              height={32}
              className="avatar avatar-md"
              style={{ objectFit: 'cover' }}
            />
          ) : (
            <span className="avatar avatar-md">
              {getInitials(c.profiles.full_name, c.profiles.username)}
            </span>
          )}
          
          <div className={styles.commentContent}>
            <div className={styles.commentMeta}>
              <span className={styles.commentName}>
                {c.profiles.full_name ?? c.profiles.username ?? 'Unknown'}
              </span>
              <span className={styles.commentTime}>
                {relativeTime(c.created_at)}
              </span>
            </div>
            <p className={styles.commentText}>{c.content}</p>
            
            <div className={styles.commentActions}>
              <div className={styles.voteButtons}>
                <button 
                  className={`${styles.voteBtn} ${myVote === 1 ? styles.votedUp : ''}`} 
                  onClick={() => handleVote(c.id, 1)}
                  title="Upvote"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill={myVote === 1 ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18v-6H5l7-7 7 7h-4v6H9z"/></svg>
                  <span className={styles.voteCount}>{upvotes > 0 ? upvotes : ''}</span>
                </button>
                <button 
                  className={`${styles.voteBtn} ${myVote === -1 ? styles.votedDown : ''}`} 
                  onClick={() => handleVote(c.id, -1)}
                  title="Downvote"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill={myVote === -1 ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6v6h4l-7 7-7-7h4V6h6z"/></svg>
                  <span className={styles.voteCount}>{downvotes > 0 ? downvotes : ''}</span>
                </button>
              </div>
              <button 
                className={styles.actionText} 
                onClick={() => setReplyingTo(replyingTo === c.id ? null : c.id)}
              >
                Reply
              </button>
              {isOwner ? (
                <button className={styles.actionText} onClick={() => setDeletingId(c.id)}>Delete</button>
              ) : (
                <button className={styles.actionText} onClick={() => {
                  if (!user) return setAuthModalOpen(true)
                  setReportingId(c.id)
                }}>Report</button>
              )}
            </div>

            {replyingTo === c.id && (
              <form 
                className={styles.replyForm}
                onSubmit={(e) => {
                  const val = (e.target as any).elements.reply.value;
                  handleSubmit(e, c.id, val);
                }}
              >
                <textarea
                  name="reply"
                  className={styles.textarea}
                  placeholder="Write a reply..."
                  rows={2}
                  required
                />
                <div className={styles.formActions}>
                  <button type="button" className="btn-secondary" onClick={() => setReplyingTo(null)}>Cancel</button>
                  <button type="submit" className="btn-primary" disabled={isSubmitting} style={{ marginLeft: '8px' }}>Reply</button>
                </div>
              </form>
            )}
          </div>
        </div>
        {c.children.length > 0 && (
          <div className={styles.repliesList}>
            {c.children.map((child: any) => renderComment(child, depth + 1))}
          </div>
        )}
      </div>
    )
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
        <form className={styles.form} onSubmit={(e) => handleSubmit(e, null, input)}>
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
        {rootComments.map((comment) => renderComment(comment, 0))}
      </div>

      {authModalOpen && (
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          message="Sign in to join the discussion."
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <h3 className={styles.modalTitle}>Delete Comment?</h3>
            <p className={styles.modalDesc}>This action cannot be undone.</p>
            <div className={styles.modalActions}>
              <button className="btn-secondary" onClick={() => setDeletingId(null)}>Cancel</button>
              <button className="btn-primary" style={{ background: '#e53e3e', borderColor: '#e53e3e' }} onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {reportingId && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <h3 className={styles.modalTitle}>Report Comment</h3>
            <form onSubmit={confirmReport}>
              <textarea
                className={styles.textarea}
                placeholder="Why are you reporting this comment?"
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                rows={3}
                required
                autoFocus
              />
              <div className={styles.modalActions} style={{ marginTop: '16px' }}>
                <button type="button" className="btn-secondary" onClick={() => {
                  setReportingId(null)
                  setReportReason('')
                }}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={!reportReason.trim()}>Submit Report</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMsg && (
        <div className={styles.toast}>
          <p>{toastMsg}</p>
          <button className={styles.toastClose} onClick={() => setToastMsg(null)}>×</button>
        </div>
      )}
    </section>
  )
}
