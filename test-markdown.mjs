import { generateHTML } from '@tiptap/html'
import { Markdown } from '@tiptap/markdown'
import StarterKit from '@tiptap/starter-kit'

const html = generateHTML('# Hello\n\nThis is markdown', [StarterKit, Markdown])
console.log(html)
