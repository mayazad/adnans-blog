'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/lib/supabase/types'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import styles from './Masthead.module.css'

interface MastheadProps {
  user: User | null
  profile: Pick<Profile, 'id' | 'full_name' | 'username' | 'avatar_url' | 'role'> | null
}

export default function Masthead({ user, profile }: MastheadProps) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus()
  }, [searchOpen])

  // Dispatch search event for PostGrid/RecentList to react to
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('latent:search', { detail: searchQuery }))
  }, [searchQuery])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.refresh()
  }

  function getInitials(name: string | null, username: string | null) {
    const display = name ?? username ?? '?'
    return display
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <header className={styles.masthead}>
      <div className={styles.inner}>
        {/* Wordmark */}
        <Link href="/" className={styles.wordmark}>
          Adnan's Blog
        </Link>

        {/* Desktop nav */}
        <nav className={styles.nav} aria-label="Main navigation">
          <Link href="/" className={styles.navLink}>Essays</Link>
          <Link href="/topics" className={styles.navLink}>Topics</Link>
          <Link href="/about" className={styles.navLink}>About</Link>
          {profile?.role === 'admin' || profile?.role === 'editor' ? (
            <Link href="/admin" className={styles.navLink} style={{ color: 'var(--emerald-deep)' }}>
              Admin
            </Link>
          ) : null}
        </nav>

        {/* Right controls */}
        <div className={styles.controls}>
          {/* Search */}
          <div className={`${styles.searchBox} ${searchOpen ? styles.searchOpen : ''}`}>
            <button
              className="icon-btn"
              aria-label="Toggle search"
              onClick={() => {
                setSearchOpen((o) => !o)
                if (searchOpen) setSearchQuery('')
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <circle cx="11" cy="11" r="7" />
                <line x1="21" y1="21" x2="16.6" y2="16.6" />
              </svg>
            </button>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search essays…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
              aria-label="Search essays"
            />
          </div>

          {/* Auth */}
          {user && profile ? (
            <div className={styles.userMenu}>
              <button
                className={styles.avatarBtn}
                onClick={() => setMenuOpen((o) => !o)}
                aria-label="Account menu"
                aria-expanded={menuOpen}
              >
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.full_name ?? 'Avatar'}
                    className={`avatar avatar-sm ${styles.avatarImg}`}
                  />
                ) : (
                  <span className="avatar avatar-sm">
                    {getInitials(profile.full_name, profile.username)}
                  </span>
                )}
                <span className={styles.userName}>
                  {profile.full_name ?? profile.username ?? 'You'}
                </span>
              </button>
              {menuOpen && (
                <div className={styles.dropdown}>
                  <button onClick={handleSignOut} className={styles.dropdownItem}>
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login" className={styles.signInBtn}>
              Sign in
            </Link>
          )}

          {/* Mobile hamburger */}
          <button
            className={`icon-btn ${styles.hamburger}`}
            aria-label="Open menu"
            onClick={() => setMenuOpen((o) => !o)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile nav dropdown */}
      {menuOpen && (
        <nav className={styles.mobileNav} aria-label="Mobile navigation">
          <Link href="/" className={styles.mobileNavLink} onClick={() => setMenuOpen(false)}>Essays</Link>
          <Link href="/topics" className={styles.mobileNavLink} onClick={() => setMenuOpen(false)}>Topics</Link>
          <Link href="/about" className={styles.mobileNavLink} onClick={() => setMenuOpen(false)}>About</Link>
          {(profile?.role === 'admin' || profile?.role === 'editor') && (
            <Link href="/admin" className={styles.mobileNavLink} onClick={() => setMenuOpen(false)}>Admin</Link>
          )}
          {!user && (
            <Link href="/login" className={styles.mobileNavLink} onClick={() => setMenuOpen(false)}>Sign in</Link>
          )}
          {user && (
            <button className={styles.mobileNavLink} onClick={handleSignOut}>Sign out</button>
          )}
        </nav>
      )}
    </header>
  )
}
