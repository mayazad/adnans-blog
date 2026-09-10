import { redirect } from 'next/navigation'
import { assertVaultUser, hasPinSet, isVaultUnlocked } from './actions'
import VaultPinClient from '@/components/vault/VaultPinClient'

export default async function VaultLayout({ children }: { children: React.ReactNode }) {
  const user = await assertVaultUser()
  const pinSet = await hasPinSet(user.id)
  const unlocked = await isVaultUnlocked()

  if (!pinSet || !unlocked) {
    // Show the PIN lock screen instead of children
    return <VaultPinClient pinSet={pinSet} />
  }

  return <>{children}</>
}
