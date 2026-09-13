"use client"

import { useEffect, useRef, useState } from "react"

/**
 * Animates a numeric display value toward `target` whenever it changes.
 * Respects prefers-reduced-motion by jumping immediately instead of easing.
 */
export function useAnimatedValue(target: number, durationMs = 700): number {
  const [value, setValue] = useState(target)
  const fromRef = useRef(target)

  useEffect(() => {
    const from = fromRef.current
    if (from === target) return

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches

    if (prefersReducedMotion) {
      const frame = requestAnimationFrame(() => {
        setValue(target)
        fromRef.current = target
      })
      return () => cancelAnimationFrame(frame)
    }

    const start = performance.now()
    let frame: number

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / durationMs)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(from + (target - from) * eased)
      if (progress < 1) {
        frame = requestAnimationFrame(tick)
      } else {
        fromRef.current = target
      }
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, durationMs])

  return value
}
