'use client'

import { useEffect, useState } from 'react'
import styles from './TOC.module.css'

interface Heading {
  id: string
  text: string
  level: number
}

export default function TOC({ headings }: { headings: Heading[] }) {
  const [activeId, setActiveId] = useState<string>('')

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        })
      },
      { rootMargin: '-20% 0px -70% 0px' }
    )

    headings.forEach((heading) => {
      const el = document.getElementById(heading.id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [headings])

  if (headings.length === 0) return null

  return (
    <nav className={styles.toc} aria-label="Table of contents">
      <div className={styles.label}>On this page</div>
      <div className={styles.links}>
        {headings.map((heading) => (
          <a
            key={heading.id}
            href={`#${heading.id}`}
            className={`${styles.link} ${
              activeId === heading.id ? styles.active : ''
            }`}
            style={{ marginLeft: heading.level === 3 ? '12px' : '0' }}
          >
            {heading.text}
          </a>
        ))}
      </div>
    </nav>
  )
}
