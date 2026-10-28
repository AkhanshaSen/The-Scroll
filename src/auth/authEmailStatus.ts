import { useEffect, useState } from 'react'

/** Parse Supabase OTP cooldown: "…after 27 seconds." */
export function parseOtpCooldownSeconds(message: string): number | null {
  const match = message.match(/after\s+(\d+)\s+seconds?/i)
  if (!match) return null
  const n = Number(match[1])
  return Number.isFinite(n) && n > 0 ? n : null
}

export function formatOtpCooldownStatus(secondsLeft: number): string {
  const n = Math.max(0, Math.ceil(secondsLeft))
  if (n <= 0) return 'You can request another sign-in letter now.'
  return `Try again in ${n} second${n === 1 ? '' : 's'}…`
}

/**
 * When `rawStatus` contains an OTP cooldown, returns a ticking countdown message
 * and `secondsLeft` for disabling submit. Otherwise returns the raw status as-is.
 */
export function useOtpCooldownStatus(rawStatus: string): {
  displayStatus: string
  secondsLeft: number
  coolingDown: boolean
} {
  const initial = rawStatus ? parseOtpCooldownSeconds(rawStatus) : null
  const [secondsLeft, setSecondsLeft] = useState(0)

  useEffect(() => {
    const parsed = rawStatus ? parseOtpCooldownSeconds(rawStatus) : null
    if (parsed == null) {
      setSecondsLeft(0)
      return
    }
    setSecondsLeft(parsed)
    const id = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(id)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => window.clearInterval(id)
  }, [rawStatus])

  if (!rawStatus) {
    return { displayStatus: '', secondsLeft: 0, coolingDown: false }
  }

  if (initial != null || secondsLeft > 0) {
    const left = secondsLeft > 0 ? secondsLeft : 0
    const coolingDown = left > 0
    return {
      displayStatus: coolingDown
        ? formatOtpCooldownStatus(left)
        : 'You can request another sign-in letter now.',
      secondsLeft: left,
      coolingDown,
    }
  }

  return { displayStatus: rawStatus, secondsLeft: 0, coolingDown: false }
}
