'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import styles from '../auth.module.css'

function LoginForm() {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const redirectTo = searchParams.get('redirectTo') || '/'

  async function handleGoogle() {
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${redirectTo}`,
      },
    })
  }

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault()
    if (!identifier || !password) return
    setIsSubmitting(true)
    setError(null)

    let emailToUse = identifier

    // If identifier doesn't look like an email, assume it's a username
    if (!identifier.includes('@')) {
      const { data: email, error: rpcError } = await supabase.rpc('get_email_for_username', {
        p_username: identifier.toLowerCase()
      })
      
      if (rpcError || !email) {
        setError('Invalid username or password')
        setIsSubmitting(false)
        return
      }
      emailToUse = email
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: emailToUse,
      password,
    })

    if (signInError) {
      setError(signInError.message)
      setIsSubmitting(false)
    } else {
      router.push(redirectTo)
      router.refresh()
    }
  }

  return (
    <div className={styles.card}>
      <h1 className={styles.title}>Welcome back</h1>
      <p className={styles.subtitle}>Sign in to Adnan's Blog</p>

      {error && <div className={styles.error}>{error}</div>}

      <button 
        className="btn-secondary" 
        style={{ width: '100%', justifyContent: 'center' }} 
        onClick={handleGoogle}
      >
        Continue with Google
      </button>

      <div className={styles.divider}>
        <span>or</span>
      </div>

      <form className={styles.form} onSubmit={handleEmail}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="identifier">Username or Email</label>
          <input
            id="identifier"
            type="text"
            className={styles.input}
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            className={styles.input}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button 
          type="submit" 
          className="btn-primary" 
          style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      <div className={styles.footer}>
        Don't have an account? <Link href={`/signup?redirectTo=${redirectTo}`} className={styles.link}>Sign up</Link>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className={styles.card}>Loading...</div>}>
      <LoginForm />
    </Suspense>
  )
}
