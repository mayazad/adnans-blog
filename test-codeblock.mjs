import { generateHTML } from '@tiptap/html'
import StarterKit from '@tiptap/starter-kit'

const doc = {
  type: 'doc',
  content: [
    {
      type: 'codeBlock',
      attrs: { language: 'mermaid' },
      content: [{ type: 'text', text: 'flowchart LR\n  A --> B' }]
    }
  ]
}

console.log(generateHTML(doc, [StarterKit]))
