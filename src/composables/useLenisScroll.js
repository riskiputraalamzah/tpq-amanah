// Reusable Lenis smooth scroll composable matching HomeView's exact feel (with reduced-motion guard).
import { onMounted, onUnmounted } from 'vue'
import Lenis from 'lenis'

export function useLenisScroll() {
  let lenis = null
  let rafId = null

  function start() {
    lenis?.start?.()
  }

  function stop() {
    lenis?.stop?.()
  }

  function resize() {
    lenis?.resize?.()
  }

  function scrollTo(target, options = {}) {
    if (lenis) {
      lenis.resize?.()
      lenis.scrollTo(target, options)
      return
    }
    if (typeof window === 'undefined') return
    if (typeof target === 'number') {
      window.scrollTo({ top: target, behavior: options.immediate ? 'instant' : 'smooth' })
    } else if (target instanceof Element) {
      const top = target.getBoundingClientRect().top + window.scrollY + (options.offset || 0)
      window.scrollTo({ top: Math.max(0, top), behavior: options.immediate ? 'instant' : 'smooth' })
    }
  }

  onMounted(() => {
    if (typeof window === 'undefined') return
    const prefersReducedMotion =
      window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) return

    lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    })

    const raf = (time) => {
      if (!lenis) return
      lenis.raf(time)
      rafId = requestAnimationFrame(raf)
    }
    rafId = requestAnimationFrame(raf)
  })

  onUnmounted(() => {
    if (rafId) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
    if (lenis) {
      lenis.destroy()
      lenis = null
    }
  })

  return { scrollTo, stop, start, resize }
}
