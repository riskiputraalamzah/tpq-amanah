// The colour of the browser's own bars (status bar, address bar, the installed app's title bar) follows the page, so
// it is the same green as the app's top bar instead of a different one. Pure + one tiny DOM helper.
//
//   dashboard (admin, guru)  #03291d  = the dashboard's top bar (MobileChrome.vue) and sidebar
//   wali portal              #043325  = its dark-green header (a gradient from #053d2c to #03291d, here its middle)
//   everything else          #166534  = the website's brand green (the landing page)
export const THEME = {
  dashboard: '#03291d',
  wali: '#043325',
  site: '#166534',
}

export function themeColorFor(path = '') {
  const p = String(path).split('?')[0]
  if (p === '/dashboard' || p.startsWith('/dashboard/')) return THEME.dashboard
  if (p === '/wali' || p.startsWith('/wali/')) return THEME.wali
  return THEME.site
}

export function applyThemeColor(path) {
  if (typeof document === 'undefined') return
  const color = themeColorFor(path)
  let meta = document.querySelector('meta[name="theme-color"]')
  if (!meta) {
    meta = document.createElement('meta')
    meta.setAttribute('name', 'theme-color')
    document.head.appendChild(meta)
  }
  if (meta.getAttribute('content') !== color) meta.setAttribute('content', color)
}
