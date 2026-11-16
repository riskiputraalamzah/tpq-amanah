// Page changes slide: a page you go INTO comes in from the right, one you go BACK to comes in from the left, and the
// page being left slides out the other way at the same time (see utils/navDirection.js for the direction rules).
//
//   const { name, onBeforeLeave } = usePageTransition({ role: () => 'admin' })
//   <transition :name="name" @before-leave="onBeforeLeave"> <component :is :key="route.path" /> </transition>
//
// Both pages exist for a moment. The old one is lifted out of the flow right where it is on screen (position: fixed
// at its current rectangle), so the new page can start at the top (the router resets the scroll) without the old one
// jumping. It is hidden from assistive technology and inert while it leaves.
import { ref, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { directionFor } from '@/utils/navDirection'
import '@/styles/page-transition.css'

const NAMES = { forward: 'page-forward', back: 'page-back', none: 'page-none' }

export function usePageTransition({ role = () => 'guru' } = {}) {
  const router = useRouter()
  const name = ref(NAMES.none)
  const reduced = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null
  const positionNow = () => {
    const p = typeof window !== 'undefined' ? window.history.state?.position : null
    return typeof p === 'number' ? p : null
  }
  // history.state.position of the page on screen. A browser Back/Forward has already moved it by the time the
  // navigation guards run; a router.push has not (it moves it when the navigation commits).
  let shownAt = positionNow()

  const stopBefore = router.beforeEach((to, from) => {
    if (reduced?.matches || !from?.matched?.length) {
      name.value = NAMES.none
      return
    }
    name.value = NAMES[directionFor({ to: to.path, from: from.path, role: role(), posNow: positionNow(), posPrev: shownAt })]
  })
  const stopAfter = router.afterEach(() => {
    shownAt = positionNow()
  })
  onBeforeUnmount(() => {
    stopBefore()
    stopAfter()
  })

  // The leaving page: keep it exactly where it is on screen while it slides away
  function onBeforeLeave(el) {
    if (!el || el.nodeType !== 1 || name.value === NAMES.none) return
    // a page that was still sliding in (quick taps): settle it first so its rectangle is the real one
    ;[...el.classList].filter((c) => /^page-(forward|back|none)-enter/.test(c)).forEach((c) => el.classList.remove(c))
    const r = el.getBoundingClientRect()
    el.classList.add('page-leaving')
    // hidden (a skeleton was showing while the new page's code downloaded): nothing to slide away, and a zero-width
    // fixed box would show as a sliver of wrapped text
    if (!r.width || !r.height) {
      el.style.display = 'none'
      return
    }
    el.setAttribute('aria-hidden', 'true')
    el.setAttribute('inert', '')
    Object.assign(el.style, {
      position: 'fixed',
      top: `${r.top}px`,
      left: `${r.left}px`,
      width: `${r.width}px`,
      margin: '0',
      boxSizing: 'border-box',
      pointerEvents: 'none',
    })
  }

  return { name, onBeforeLeave }
}
