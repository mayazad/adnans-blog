import MermaidBlock from './MermaidBlock'
import styles from './ArticleBody.module.css'

// Parse HTML content and extract mermaid code blocks to render separately
function parseContent(html: string): Array<{ type: 'html' | 'mermaid'; content: string }> {
  // Match <pre><code class="language-mermaid">...</code></pre>
  const mermaidRegex = /<pre><code[^>]*class="[^"]*language-mermaid[^"]*"[^>]*>([\s\S]*?)<\/code><\/pre>/gi
  const parts: Array<{ type: 'html' | 'mermaid'; content: string }> = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = mermaidRegex.exec(html)) !== null) {
    // HTML before this mermaid block
    if (match.index > lastIndex) {
      parts.push({ type: 'html', content: html.slice(lastIndex, match.index) })
    }
    // Decode HTML entities in the mermaid source
    const decoded = match[1]
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
    parts.push({ type: 'mermaid', content: decoded })
    lastIndex = match.index + match[0].length
  }

  // Remaining HTML
  if (lastIndex < html.length) {
    parts.push({ type: 'html', content: html.slice(lastIndex) })
  }

  return parts.length > 0 ? parts : [{ type: 'html', content: html }]
}

export default function ArticleBody({ content }: { content: string }) {
  const parts = parseContent(content)

  return (
    <article className={styles.articleBody}>
      {parts.map((part, i) =>
        part.type === 'mermaid' ? (
          <MermaidBlock key={i} chart={part.content} />
        ) : (
          <div
            key={i}
            dangerouslySetInnerHTML={{ __html: part.content }}
          />
        )
      )}
    </article>
  )
}
