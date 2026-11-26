// How long a live page (Pusat WhatsApp) waits before asking the server again. Every ask is a billed backend call, so a
// page left open on a screen nobody is looking at slows right down; it speeds up again at the next tap or key.
//   busy (something changed in the last 2 min) 5 s · calm 15 s · window not focused 60 s · nobody touched it for 10 min 2 min

export const FAST_MS = 5000
export const SLOW_MS = 15000
export const UNFOCUSED_MS = 60 * 1000
export const IDLE_MS = 2 * 60 * 1000
export const CALM_AFTER_MS = 2 * 60 * 1000
export const IDLE_AFTER_MS = 10 * 60 * 1000

export function nextPollDelay({ now, lastChange, lastActivity, focused }) {
  if (now - lastActivity > IDLE_AFTER_MS) return IDLE_MS
  if (!focused) return UNFOCUSED_MS
  return now - lastChange < CALM_AFTER_MS ? FAST_MS : SLOW_MS
}
