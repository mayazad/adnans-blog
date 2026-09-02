import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import styles from './settings.module.css'

export default async function AdminSettingsPage() {
  const supabase = await createClient()

  const { data } = await supabase.from('settings').select('*')
  
  const settingsMap = (data ?? []).reduce((acc: any, row) => {
    acc[row.key] = row.value
    return acc
  }, {})

  async function updateSettings(formData: FormData) {
    'use server'
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Verify admin
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return

    const siteName = formData.get('site_name') as string
    const allowRegistrations = formData.get('allow_registrations') === 'on' ? 'true' : 'false'
    const commentsEnabled = formData.get('comments_enabled') === 'on' ? 'true' : 'false'

    await supabase.from('settings').upsert([
      { key: 'site_name', value: siteName },
      { key: 'allow_registrations', value: allowRegistrations },
      { key: 'comments_enabled', value: commentsEnabled }
    ])

    revalidatePath('/')
    revalidatePath('/admin/settings')
  }

  // Settings values are stored as raw text strings
  const siteName = settingsMap.site_name || "Adnan's Blog"
  const allowRegistrations = settingsMap.allow_registrations === 'true'
  const commentsEnabled = settingsMap.comments_enabled === 'true'

  return (
    <>
      <header className="admin-header">
        <div>
          <h1 className="admin-title">Settings</h1>
          <p className="admin-subtitle">Manage your blog's configuration.</p>
        </div>
      </header>

      <form action={updateSettings} className={styles.formCard}>
        <div className={styles.field}>
          <label htmlFor="site_name">Site Name</label>
          <input
            type="text"
            id="site_name"
            name="site_name"
            defaultValue={siteName}
            className={styles.input}
          />
        </div>

        <div className={styles.toggleField}>
          <input
            type="checkbox"
            id="allow_registrations"
            name="allow_registrations"
            defaultChecked={allowRegistrations}
            className={styles.checkbox}
          />
          <div className={styles.toggleText}>
            <label htmlFor="allow_registrations">Allow User Registrations</label>
            <p>If disabled, new users cannot sign up.</p>
          </div>
        </div>

        <div className={styles.toggleField}>
          <input
            type="checkbox"
            id="comments_enabled"
            name="comments_enabled"
            defaultChecked={commentsEnabled}
            className={styles.checkbox}
          />
          <div className={styles.toggleText}>
            <label htmlFor="comments_enabled">Enable Comments globally</label>
            <p>If disabled, the comment section is hidden on all posts.</p>
          </div>
        </div>

        <div className={styles.actions}>
          <button type="submit" className="btn-primary">
            Save Settings
          </button>
        </div>
      </form>
    </>
  )
}
