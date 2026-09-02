const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf-8');
const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/);

async function run() {
  const res = await fetch(`${urlMatch[1]}/rest/v1/posts?select=title,content&order=created_at.desc.nullslast&limit=1`, {
    headers: {
      'apikey': keyMatch[1],
      'Authorization': `Bearer ${keyMatch[1]}`
    }
  });
  const data = await res.json();
  if (data && data.length > 0) {
    const c = data[0].content;
    console.log("TITLE:", data[0].title);
    const mermaidMatch = c.match(/<pre[^>]*><code[^>]*>/gi);
    console.log("CODE TAGS:", mermaidMatch);
  } else {
    console.log("No posts found or error:", data);
  }
}
run();
