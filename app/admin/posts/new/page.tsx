import PostEditor from '@/components/admin/PostEditor'

export default function NewPostPage() {
  return (
    <>
      <header className="admin-header">
        <div>
          <h1 className="admin-title">New Post</h1>
          <p className="admin-subtitle">Write something new.</p>
        </div>
      </header>
      <PostEditor />
    </>
  )
}
