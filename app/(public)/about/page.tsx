export default function AboutPage() {
  return (
    <div className="wrap" style={{ padding: '64px 0', maxWidth: '680px' }}>
      <h1 style={{ fontFamily: 'var(--serif)', fontSize: '2.5rem', fontWeight: 400, marginBottom: '24px', color: 'var(--ink)' }}>
        About
      </h1>
      
      <div style={{ fontFamily: 'var(--serif)', fontSize: '1.1rem', lineHeight: 1.7, color: 'var(--ink-soft)' }}>
        <p style={{ marginBottom: '20px' }}>
          Welcome to Adnan's Blog. This is a space dedicated to exploring artificial intelligence—how it works beneath the surface, where it excels, where it fails, and what comes next.
        </p>
        <p style={{ marginBottom: '20px' }}>
          The goal is to demystify complex AI concepts and provide clear, thoughtful commentary on the rapidly evolving landscape of machine learning and technology.
        </p>
        <p>
          Feel free to join the discussion on any of the essays!
        </p>
      </div>
    </div>
  )
}
