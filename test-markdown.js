const { Editor } = require('@tiptap/core')
const StarterKit = require('@tiptap/starter-kit').default || require('@tiptap/starter-kit')
const { Markdown } = require('@tiptap/markdown')

const editor = new Editor({
  extensions: [StarterKit, Markdown],
  content: ''
})

editor.commands.setContent('# Hello\n\nThis is markdown', true)
console.log('setContent HTML:', editor.getHTML())
editor.commands.insertContent('**bold**')
console.log('insertContent HTML:', editor.getHTML())
