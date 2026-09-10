'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import bcrypt from 'bcryptjs'

const VAULT_ALLOWED_USERNAME = 'mayazad'
const VAULT_COOKIE = 'vault_unlocked'
const VAULT_COOKIE_SECRET = process.env.VAULT_SECRET ?? 'vault_secret_fallback_key'

// ─── Access Guard ───────────────────────────────────────────────────────────
export async function assertVaultUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single()

  if (profile?.username !== VAULT_ALLOWED_USERNAME) redirect('/admin')
  return user
}

export async function isVaultUnlocked(): Promise<boolean> {
  const jar = await cookies()
  const val = jar.get(VAULT_COOKIE)?.value
  return val === VAULT_COOKIE_SECRET
}

// ─── PIN Management ─────────────────────────────────────────────────────────
export async function hasPinSet(userId: string): Promise<boolean> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('vault_settings')
    .select('id')
    .eq('user_id', userId)
    .single()
  return !!data
}

export async function setupPin(pin: string) {
  const user = await assertVaultUser()
  if (pin.length < 4) return { error: 'PIN must be at least 4 digits' }

  const hash = await bcrypt.hash(pin, 10)
  const supabase = await createClient()
  const { error } = await supabase.from('vault_settings').upsert({
    user_id: user.id,
    pin_hash: hash,
    updated_at: new Date().toISOString(),
  })
  if (error) return { error: 'Failed to save PIN' }

  const jar = await cookies()
  jar.set(VAULT_COOKIE, VAULT_COOKIE_SECRET, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 2, // 2 hours
    path: '/',
  })
  return { success: true }
}

export async function verifyPin(pin: string) {
  const user = await assertVaultUser()
  const supabase = await createClient()
  const { data } = await supabase
    .from('vault_settings')
    .select('pin_hash')
    .eq('user_id', user.id)
    .single()

  if (!data) return { error: 'No PIN set' }
  const match = await bcrypt.compare(pin, data.pin_hash)
  if (!match) return { error: 'Incorrect PIN' }

  const jar = await cookies()
  jar.set(VAULT_COOKIE, VAULT_COOKIE_SECRET, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 2,
    path: '/',
  })
  return { success: true }
}

export async function lockVault() {
  const jar = await cookies()
  jar.delete(VAULT_COOKIE)
  redirect('/admin/vault')
}

export async function changePin(currentPin: string, newPin: string) {
  const user = await assertVaultUser()
  if (newPin.length < 4) return { error: 'New PIN must be at least 4 digits' }

  const supabase = await createClient()
  const { data } = await supabase
    .from('vault_settings')
    .select('pin_hash')
    .eq('user_id', user.id)
    .single()

  if (!data) return { error: 'No PIN set' }
  const match = await bcrypt.compare(currentPin, data.pin_hash)
  if (!match) return { error: 'Current PIN is incorrect' }

  const hash = await bcrypt.hash(newPin, 10)
  await supabase.from('vault_settings').update({
    pin_hash: hash,
    updated_at: new Date().toISOString(),
  }).eq('user_id', user.id)

  return { success: true }
}

// ─── Monthly Budget ─────────────────────────────────────────────────────────
export async function getOrCreateMonth(year: number, month: number) {
  const user = await assertVaultUser()
  const supabase = await createClient()

  let { data } = await supabase
    .from('finance_months')
    .select('*')
    .eq('user_id', user.id)
    .eq('year', year)
    .eq('month', month)
    .single()

  if (!data) {
    const { data: created } = await supabase
      .from('finance_months')
      .insert({ user_id: user.id, year, month, income_amount: 0 })
      .select()
      .single()
    data = created
  }
  return data
}

export async function setMonthIncome(monthId: string, amount: number) {
  await assertVaultUser()
  const supabase = await createClient()
  await supabase.from('finance_months').update({ income_amount: amount }).eq('id', monthId)
  return { success: true }
}

// ─── Expenses ────────────────────────────────────────────────────────────────
export async function addExpense(formData: FormData) {
  const user = await assertVaultUser()
  const raw = formData.get('quick_input') as string
  const description = formData.get('description') as string | null
  const monthId = formData.get('month_id') as string

  if (!raw) return { error: 'Input is empty' }
  const parts = raw.split(',').map(s => s.trim())
  if (parts.length < 2) return { error: 'Format: amount, Category' }

  const amount = parseFloat(parts[0])
  if (isNaN(amount) || amount <= 0) return { error: 'Invalid amount' }
  const category = parts[1]

  const supabase = await createClient()
  const { error } = await supabase.from('finance_expenses').insert({
    user_id: user.id,
    month_id: monthId,
    amount,
    category,
    description: description || null,
    spent_at: new Date().toISOString(),
  })
  if (error) return { error: 'Failed to save expense' }
  return { success: true }
}

export async function deleteExpense(id: string) {
  await assertVaultUser()
  const supabase = await createClient()
  await supabase.from('finance_expenses').delete().eq('id', id)
  return { success: true }
}

export async function getMonthExpenses(monthId: string) {
  await assertVaultUser()
  const supabase = await createClient()
  const { data } = await supabase
    .from('finance_expenses')
    .select('*')
    .eq('month_id', monthId)
    .order('spent_at', { ascending: false })
  return data ?? []
}

// ─── Debt Ledger ─────────────────────────────────────────────────────────────
export async function addDebt(formData: FormData) {
  const user = await assertVaultUser()
  const supabase = await createClient()
  const { error } = await supabase.from('finance_debts').insert({
    user_id: user.id,
    person_name: formData.get('person_name') as string,
    amount: parseFloat(formData.get('amount') as string),
    purpose: formData.get('purpose') as string,
    type: formData.get('type') as string,
    transacted_at: new Date().toISOString(),
  })
  if (error) return { error: 'Failed to save' }
  return { success: true }
}

export async function toggleDebtSettled(id: string, settled: boolean) {
  await assertVaultUser()
  const supabase = await createClient()
  await supabase.from('finance_debts').update({ is_settled: settled }).eq('id', id)
  return { success: true }
}

export async function deleteDebt(id: string) {
  await assertVaultUser()
  const supabase = await createClient()
  await supabase.from('finance_debts').delete().eq('id', id)
  return { success: true }
}

export async function getDebts() {
  const user = await assertVaultUser()
  const supabase = await createClient()
  const { data } = await supabase
    .from('finance_debts')
    .select('*')
    .eq('user_id', user.id)
    .order('transacted_at', { ascending: false })
  return data ?? []
}

// ─── Share Tokens ─────────────────────────────────────────────────────────────
export async function generateShareToken(personName: string) {
  const user = await assertVaultUser()
  const supabase = await createClient()

  // Delete existing token for this person
  await supabase.from('debt_share_tokens')
    .delete()
    .eq('user_id', user.id)
    .eq('person_name', personName)

  const { data } = await supabase.from('debt_share_tokens').insert({
    user_id: user.id,
    person_name: personName,
  }).select('token').single()

  return { token: data?.token }
}
