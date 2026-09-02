'use client'

import { useEffect, useRef } from 'react'

interface Props {
  chart: string
}

export default function MermaidBlock({ chart }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false

    async function render() {
      const mermaid = (await import('mermaid')).default
      mermaid.initialize({
        startOnLoad: false,
        theme: 'neutral',
        fontFamily: 'inherit',
      })

      if (!ref.current || cancelled) return

      try {
        const id = `mermaid-${Math.random().toString(36).slice(2)}`
        const { svg } = await mermaid.render(id, chart.trim())
        if (ref.current && !cancelled) {
          ref.current.innerHTML = svg
        }
      } catch (err) {
        if (ref.current && !cancelled) {
          ref.current.innerHTML = `<pre style="color:red;font-size:0.8rem;">Mermaid error: ${err}</pre>`
        }
      }
    }

    render()
    return () => { cancelled = true }
  }, [chart])

  return (
    <div
      ref={ref}
      style={{
        margin: '2rem 0',
        display: 'flex',
        justifyContent: 'center',
        overflow: 'auto',
      }}
    />
  )
}
