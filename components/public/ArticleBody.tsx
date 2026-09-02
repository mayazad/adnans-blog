import MermaidBlock from './MermaidBlock'
import styles from './ArticleBody.module.css'

// Parse HTML content and extract mermaid code blocks to render separately
function parseContent(html: string): Array<{ type: 'html' | 'mermaid'; content: string }> {
  // Match any <pre><code> block
  const codeBlockRegex = /<pre[^>]*>\s*<code([^>]*)>([\s\S]*?)<\/code>\s*<\/pre>/gi
  const parts: Array<{ type: 'html' | 'mermaid'; content: string }> = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = codeBlockRegex.exec(html)) !== null) {
    // HTML before this code block
    if (match.index > lastIndex) {
      parts.push({ type: 'html', content: html.slice(lastIndex, match.index) })
    }

    const codeAttributes = match[1]
    const rawContent = match[2]
    
    // Decode HTML entities in the source
    const decoded = rawContent
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')

    // Check if it's a mermaid block by checking the class OR the content
    const isMermaidClass = /class=['"][^'"]*language-mermaid[^'"]*['"]/i.test(codeAttributes)
    const isMermaidSyntax = /^\s*(flowchart|graph|sequenceDiagram|classDiagram|stateDiagram|erDiagram|journey|gantt|pie|quadrantChart|requirementDiagram|gitGraph|mindmap|timeline)/i.test(decoded)

    if (isMermaidClass || isMermaidSyntax) {
      parts.push({ type: 'mermaid', content: decoded })
    } else {
      parts.push({ type: 'html', content: match[0] }) // Push the original matched block as HTML
    }
    
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
