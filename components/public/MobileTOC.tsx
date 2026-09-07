'use client'

import { useState, useEffect } from 'react'
import styles from './MobileTOC.module.css'

interface Heading {
  id: string
  text: string
  level: number
}

interface Props {
  headings: Heading[]
}

export default function MobileTOC({ headings }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeId, setActiveId] = useState<string>('')

  // Intersection Observer for highlighting active heading
  useEffect(() => {
    if (headings.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        })
      },
      { rootMargin: '0px 0px -80% 0px' }
    )

    headings.forEach((heading) => {
      const el = document.getElementById(heading.id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [headings])

  // Prevent background scrolling when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!headings || headings.length === 0) return null

  return (
    <div className={styles.wrapper}>
      {/* FAB to open TOC */}
      <button 
        className={styles.toggleBtn}
        onClick={() => setIsOpen(true)}
        aria-label="Table of Contents"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="8" y1="6" x2="21" y2="6"></line>
          <line x1="8" y1="12" x2="21" y2="12"></line>
          <line x1="8" y1="18" x2="21" y2="18"></line>
          <line x1="3" y1="6" x2="3.01" y2="6"></line>
          <line x1="3" y1="12" x2="3.01" y2="12"></line>
          <line x1="3" y1="18" x2="3.01" y2="18"></line>
        </svg>
      </button>

      {/* Overlay */}
      <div 
        className={`${styles.overlay} ${isOpen ? styles.overlayOpen : ''}`} 
        onClick={() => setIsOpen(false)} 
      />

      {/* Drawer */}
      <div className={`${styles.drawer} ${isOpen ? styles.drawerOpen : ''}`}>
        <div className={styles.header}>
          <h3 className={styles.title}>Table of Contents</h3>
          <button className={styles.closeBtn} onClick={() => setIsOpen(false)} aria-label="Close">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <nav className={styles.content}>
          {headings.map((heading) => (
            <a
              key={heading.id}
              href={`#${heading.id}`}
              className={styles.link}
              style={{
                marginLeft: `${(heading.level - 2) * 12}px`,
                color: activeId === heading.id ? 'var(--emerald-deep)' : 'var(--ink-soft)',
                fontWeight: activeId === heading.id ? 600 : 400,
                borderLeft: activeId === heading.id ? '2px solid var(--emerald)' : 'none',
                paddingLeft: activeId === heading.id ? '10px' : '12px',
                background: activeId === heading.id ? 'var(--emerald-tint)' : 'transparent',
              }}
              onClick={() => setIsOpen(false)}
            >
              {heading.text}
            </a>
          ))}
        </nav>
      </div>
    </div>
  )
}
