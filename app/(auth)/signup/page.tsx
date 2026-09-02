'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import styles from '../auth.module.css'

function SignupForm() {
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
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
    if (!email || !password || !fullName || !username) return
    setIsSubmitting(true)
    setError(null)
    setSuccess(false)

    // Check if username is taken first
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .single()

    if (existing) {
      setError('Username is already taken.')
      setIsSubmitting(false)
      return
    }

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          username,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${redirectTo}`,
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setIsSubmitting(false)
    } else {
      setSuccess(true)
      setIsSubmitting(false)
    }
  }

  return (
    <div className={styles.card}>
      <h1 className={styles.title}>Join Adnan's Blog</h1>
      <p className={styles.subtitle}>Create an account to join the discussion</p>

      {error && <div className={styles.error}>{error}</div>}
      {success && (
        <div className={styles.success}>
          Check your email for a confirmation link to finish signing up.
        </div>
      )}

      {!success && (
        <>
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
              <label className={styles.label} htmlFor="fullName">Full Name</label>
              <input
                id="fullName"
                type="text"
                className={styles.input}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                className={styles.input}
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                required
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                className={styles.input}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                minLength={6}
              />
            </div>
            <button 
              type="submit" 
              className="btn-primary" 
              style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating account...' : 'Create account'}
            </button>
          </form>
        </>
      )}

      <div className={styles.footer}>
        Already have an account? <Link href={`/login?redirectTo=${redirectTo}`} className={styles.link}>Sign in</Link>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className={styles.card}>Loading...</div>}>
      <SignupForm />
    </Suspense>
  )
}
