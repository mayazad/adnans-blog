'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import styles from './AuthModal.module.css'

interface Props {
  isOpen: boolean
  onClose: () => void
  message?: string
}

export default function AuthModal({ isOpen, onClose, message = 'Sign in to continue.' }: Props) {
  const modalRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const supabase = createClient()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      window.addEventListener('keydown', onKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen || !mounted) return null

  function handleGoogle() {
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${window.location.pathname}`,
      },
    })
  }

  function handleEmail() {
    onClose()
    router.push(`/login?redirectTo=${encodeURIComponent(window.location.pathname)}`)
  }

  return createPortal(
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true">
      <div 
        className={styles.modal} 
        onClick={(e) => e.stopPropagation()}
        ref={modalRef}
      >
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <h2 className={styles.title}>Join the conversation</h2>
        <p className={styles.message}>{message}</p>

        <div className={styles.actions}>
          <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleGoogle}>
            Continue with Google
          </button>
          
          <div className={styles.divider}>
            <span>or</span>
          </div>
          
          <button className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleEmail}>
            Sign in with Email
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
