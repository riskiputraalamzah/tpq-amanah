// A side column that stays in view with only the page's own scroll (no scrollbar of its own).
//
// position: sticky with a `top` that depends on the column's height:
//   shorter than the screen -> top = gap: it sticks at the top
//   taller than the screen  -> top = screen - height - gap (negative): it scrolls with the page until its bottom is
//                              in view, then sticks there - nothing is ever out of reach, nothing scrolls on its own
// Re-measured when the column's content or the window changes. The "screen" is the nearest scrolling ancestor
// (the dashboard's main area) or the window.
import { ref, watch, onBeforeUnmount } from 'vue'

export function useStickySide(el, { gap = 16 } = {}) {
  const top = ref(gap)
  let observer = null
  let scroller = null

  const findScroller = (node) => {
    for (let p = node?.parentElement; p; p = p.parentElement) {
      const oy = getComputedStyle(p).overflowY
      if (oy === 'auto' || oy === 'scroll') return p
    }
    return null
  }
  const update = () => {
    const node = el.value
    if (!node) return
    const view = scroller ? scroller.clientHeight : window.innerHeight
    top.value = Math.min(gap, Math.round(view - node.offsetHeight - gap))
  }
  const stop = () => {
    observer?.disconnect()
    observer = null
    window.removeEventListener('resize', update)
  }

  // the column appears once the data is loaded
  watch(
    el,
    (node) => {
      stop()
      if (!node) return
      scroller = findScroller(node)
      if (typeof ResizeObserver !== 'undefined') {
        observer = new ResizeObserver(update)
        observer.observe(node)
        if (scroller) observer.observe(scroller)
      }
      window.addEventListener('resize', update)
      update()
    },
    { flush: 'post' },
  )
  onBeforeUnmount(stop)

  return top
}
