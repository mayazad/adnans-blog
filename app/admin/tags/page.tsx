import { createClient } from '@/lib/supabase/server'
import type { Tag } from '@/lib/supabase/types'
import TagsManager from './TagsManager'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Tags — Admin' }

export default async function TagsPage() {
  const supabase = await createClient()
  const { data: tags } = await supabase
    .from('tags')
    .select('*')
    .order('name', { ascending: true })

  return <TagsManager initialTags={(tags ?? []) as Tag[]} />
}
