import styles from './ArticleFooter.module.css'
import type { Profile } from '@/lib/supabase/types'
import Image from 'next/image'

interface Props {
  author: Pick<Profile, 'id' | 'full_name' | 'username' | 'avatar_url' | 'bio'> | null
  postUrl: string
  postTitle: string
}

export default function ArticleFooter({ author, postUrl, postTitle }: Props) {
  const shareText = `Read "${postTitle}"`
  const xShareUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(postUrl)}`
  const linkedinShareUrl = `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(postUrl)}&title=${encodeURIComponent(postTitle)}`

  return (
    <footer className={styles.footer}>
      <div className={styles.shareSection}>
        <h3 className={styles.shareTitle}>Share this article</h3>
        <div className={styles.shareButtons}>
          <a href={xShareUrl} target="_blank" rel="noopener noreferrer" className={styles.shareBtn}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4l11.733 16h4.267l-11.733 -16z"></path><path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772"></path></svg>
            Post on X
          </a>
          <a href={linkedinShareUrl} target="_blank" rel="noopener noreferrer" className={styles.shareBtn}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
            Share on LinkedIn
          </a>
          <button 
            className={styles.shareBtn} 
            onClick={() => {
              navigator.clipboard.writeText(postUrl)
              alert('Link copied to clipboard!')
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
            Copy Link
          </button>
        </div>
      </div>

      {author && (
        <div className={styles.authorSection}>
          <div className={styles.authorAvatar}>
            {author.avatar_url ? (
              <Image src={author.avatar_url} alt={author.full_name || author.username || 'Author'} width={80} height={80} />
            ) : (
              <div className={styles.avatarPlaceholder}>
                {(author.full_name || author.username || '?').charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className={styles.authorInfo}>
            <div className={styles.authorName}>Written by {author.full_name || author.username}</div>
            {author.bio && <p className={styles.authorBio}>{author.bio}</p>}
          </div>
        </div>
      )}
    </footer>
  )
}
