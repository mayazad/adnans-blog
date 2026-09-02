const { Editor } = require('@tiptap/core')
const StarterKit = require('@tiptap/starter-kit').default || require('@tiptap/starter-kit')

// Need to mock document for tiptap to work in Node
const { JSDOM } = require('jsdom')
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>')
global.window = dom.window
global.document = dom.window.document
global.HTMLElement = dom.window.HTMLElement
global.Node = dom.window.Node
global.navigator = dom.window.navigator

const editor = new Editor({
  extensions: [StarterKit],
  content: '<pre><code class="language-mermaid">flowchart LR\nA --> B</code></pre>'
})

console.log(editor.getHTML())
