import matter from 'gray-matter';
const { data, content } = matter("---\ntitle: abc\n---\nHello");
console.log(content);
