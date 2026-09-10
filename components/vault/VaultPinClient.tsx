'use client'

import { useState, useRef, useEffect } from 'react'
import { setupPin, verifyPin } from '@/app/admin/vault/actions'
import { useRouter } from 'next/navigation'
import styles from './VaultPinClient.module.css'

interface Props {
  pinSet: boolean
}

export default function VaultPinClient({ pinSet }: Props) {
  const [pin, setPin] = useState(['', '', '', ''])
  const [confirm, setConfirm] = useState(['', '', '', ''])
  const [step, setStep] = useState<'enter' | 'confirm'>('enter')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const confirmRefs = useRef<(HTMLInputElement | null)[]>([])
  const router = useRouter()

  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  function handleInput(idx: number, val: string, arr: string[], setArr: (a: string[]) => void, refs: React.MutableRefObject<(HTMLInputElement | null)[]>) {
    if (!/^\d?$/.test(val)) return
    const next = [...arr]
    next[idx] = val
    setArr(next)
    if (val && idx < 3) refs.current[idx + 1]?.focus()
  }

  function handleKeyDown(idx: number, e: React.KeyboardEvent, arr: string[], refs: React.MutableRefObject<(HTMLInputElement | null)[]>) {
    if (e.key === 'Backspace' && !arr[idx] && idx > 0) {
      refs.current[idx - 1]?.focus()
    }
  }

  async function handleSubmit() {
    const pinStr = pin.join('')
    if (pinStr.length < 4) { setError('Enter all 4 digits'); return }
    setError('')
    setLoading(true)

    if (!pinSet) {
      // New PIN setup
      if (step === 'enter') {
        setStep('confirm')
        setLoading(false)
        setTimeout(() => confirmRefs.current[0]?.focus(), 50)
        return
      }
      // Confirm step
      const confirmStr = confirm.join('')
      if (pinStr !== confirmStr) {
        setError('PINs do not match')
        setPin(['', '', '', ''])
        setConfirm(['', '', '', ''])
        setStep('enter')
        setTimeout(() => inputRefs.current[0]?.focus(), 50)
        setLoading(false)
        return
      }
      const res = await setupPin(pinStr)
      if (res?.error) { setError(res.error); setLoading(false); return }
    } else {
      const res = await verifyPin(pinStr)
      if (res?.error) {
        setError(res.error)
        setPin(['', '', '', ''])
        setTimeout(() => inputRefs.current[0]?.focus(), 50)
        setLoading(false)
        return
      }
    }

    router.refresh()
  }

  const isConfirmStep = !pinSet && step === 'confirm'
  const activeArr = isConfirmStep ? confirm : pin
  const setActiveArr = isConfirmStep ? setConfirm : setPin
  const activeRefs = isConfirmStep ? confirmRefs : inputRefs

  return (
    <div className={styles.lockScreen}>
      <div className={styles.lockCard}>
        <div className={styles.icon}>🔒</div>
        <h1 className={styles.title}>
          {!pinSet
            ? isConfirmStep ? 'Confirm your PIN' : 'Set up your Vault PIN'
            : 'Enter your Vault PIN'}
        </h1>
        <p className={styles.subtitle}>
          {!pinSet
            ? isConfirmStep ? 'Re-enter your 4-digit PIN to confirm' : 'Choose a 4-digit PIN to protect your vault'
            : 'This vault is private and password-protected'}
        </p>

        <div className={styles.pinRow}>
          {[0, 1, 2, 3].map(i => (
            <input
              key={i}
              ref={el => { activeRefs.current[i] = el }}
              type="password"
              inputMode="numeric"
              maxLength={1}
              value={activeArr[i]}
              onChange={e => handleInput(i, e.target.value, activeArr, setActiveArr, activeRefs)}
              onKeyDown={e => handleKeyDown(i, e, activeArr, activeRefs)}
              className={styles.pinInput}
              autoComplete="off"
            />
          ))}
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <button
          className={styles.unlockBtn}
          onClick={handleSubmit}
          disabled={loading || activeArr.join('').length < 4}
        >
          {loading ? 'Verifying…' : !pinSet ? (isConfirmStep ? 'Confirm PIN' : 'Next') : 'Unlock Vault'}
        </button>
      </div>
    </div>
  )
}
