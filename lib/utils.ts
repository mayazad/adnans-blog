/**
 * Generates a URL-safe slug from a title string.
 * e.g. "What AI Actually Does" → "what-ai-actually-does"
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Estimates reading time from HTML/text content.
 * Average reading speed: 238 wpm
 */
export function estimateReadingTime(content: string): number {
  const words = content
    .replace(/<[^>]*>/g, ' ') // strip HTML tags
    .trim()
    .split(/\s+/)
    .filter(Boolean).length
  return Math.max(1, Math.ceil(words / 238))
}

/**
 * Formats a date string for display.
 * e.g. "2026-09-02T00:00:00Z" → "Sept 2, 2026"
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Returns relative time string.
 * e.g. "2 days ago", "just now"
 */
export function relativeTime(dateString: string): string {
  const now = Date.now()
  const then = new Date(dateString).getTime()
  const diff = Math.floor((now - then) / 1000)

  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)} day${Math.floor(diff / 86400) === 1 ? '' : 's'} ago`
  return formatDate(dateString)
}

/**
 * Extracts plain text from an HTML string.
 */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim()
}

/**
 * Truncates text to a given character count, adding ellipsis.
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trimEnd() + '…'
}

/**
 * Extracts headings from HTML content for TOC generation.
 * Returns array of { id, text, level }
 */
export function extractHeadings(
  html: string
): { id: string; text: string; level: number }[] {
  const matches = [...html.matchAll(/<h([23])[^>]*id="([^"]*)"[^>]*>(.*?)<\/h[23]>/gi)]
  return matches.map((m) => ({
    level: parseInt(m[1]),
    id: m[2],
    text: m[3].replace(/<[^>]*>/g, ''),
  }))
}

/**
 * Parses raw HTML and injects `id="..."` into <h2> and <h3> tags based on their text content.
 */
export function addHeadingIds(html: string): string {
  return html.replace(/<h([23])([^>]*)>(.*?)<\/h\1>/gi, (match, level, attrs, content) => {
    // If it already has an ID, leave it alone
    if (attrs.includes('id=')) return match;
    const text = content.replace(/<[^>]*>/g, '').trim();
    const id = slugify(text);
    return `<h${level} id="${id}"${attrs}>${content}</h${level}>`;
  });
}

/**
 * Generates a safe heading ID from text.
 * e.g. "The Illusion" → "the-illusion"
 */
export function headingId(text: string): string {
  return slugify(text)
}

/**
 * Clamps a number between min and max.
 */
export function clamp(val: number, min: number, max: number): number {
  return Math.min(Math.max(val, min), max)
}
