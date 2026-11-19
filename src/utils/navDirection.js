// Which way a page change should slide, and which pages are "inner" pages. Pure (no router, no DOM): the layouts feed it
// paths and the browser's history position, and the tests exercise every rule.
//
//   back    the new page comes in from the left   (up to a parent, the browser's Back, a tab further left)
//   forward the new page comes in from the right  (into a page, the browser's Forward, a tab further right)
//
// Rules, in order:
//   1. the browser moved in its history (Back / Forward button, router.back()): that direction
//   2. a new navigation to a deeper page = forward, to a shallower one (a parent) = back
//   3. between two bottom-bar tabs: the tab order (left to right)
//   4. anything else (a page from the Menu, a link): forward

// Inner pages of the dashboard: [pattern, title for the top bar, the page "Back" goes to when there is no history]
export const DEEP_PAGES = [
  [/^\/dashboard\/kbm\/daily-workspace$/, 'Isi KBM', () => '/dashboard/kbm'],
  [/^\/dashboard\/kbm\/[^/]+\/jurnal$/, 'Jurnal KBM', () => '/dashboard/kbm'],
  [/^\/dashboard\/kbm\/[^/]+\/absensi$/, 'Absen Santri KBM', () => '/dashboard/kbm'],
  [/^\/dashboard\/lpj\/[^/]+\/sptjm$/, 'SPTJM', (p) => p.replace(/\/sptjm$/, '')],
  [/^\/dashboard\/lpj\/[^/]+$/, 'Detail LPJ', (p, role) => (role === 'admin' ? '/dashboard/admin-lpj' : '/dashboard/lpj')],
  [/^\/dashboard\/grading\/[^/]+$/, 'Penilaian', () => '/dashboard/grading'],
  [/^\/dashboard\/admin-grading\/[^/]+$/, 'Penilaian', () => '/dashboard/admin-grading'],
  [/^\/dashboard\/savings\/[^/]+$/, 'Buku Tabungan', (p, role) => (role === 'admin' ? '/dashboard/admin-savings' : '/dashboard/savings')],
  [/^\/dashboard\/kegiatan\/[^/]+$/, 'Detail Kegiatan', () => '/dashboard/kegiatan'],
  [/^\/dashboard\/pendaftaran\/langsung$/, 'Daftarkan Langsung', () => '/dashboard/pendaftaran'],
]

export function deepPageFor(path, role = 'guru') {
  const hit = DEEP_PAGES.find(([re]) => re.test(path))
  return hit ? { title: hit[1], back: hit[2](path, role) } : null
}

// The bottom-bar tabs, left to right (the "Menu" tab is not a page)
export const TAB_ORDER = {
  admin: ['/dashboard', '/dashboard/santri', '/dashboard/pendaftaran', '/dashboard/kbm-monitor'],
  guru: ['/dashboard', '/dashboard/kbm', '/dashboard/attendance', '/dashboard/absen-santri'],
  wali: ['/wali', '/wali/izin', '/wali/pengumuman', '/wali/akun'],
}

// 1 = a main page (a tab, or a page from the Menu), 2+ = inner pages
export function pageDepth(path, role = 'guru') {
  const p = String(path || '').split('?')[0]
  if (role === 'wali') {
    if (/^\/wali\/santri\/[^/]+\/[^/]+$/.test(p)) return 3
    if (/^\/wali\/(santri\/[^/]+|daftar\/[^/]+|tautkan|masukan)$/.test(p)) return 2
    return 1
  }
  return deepPageFor(p, role) ? 2 : 1
}

// The tab a path belongs to (the tab of its parent page for inner pages), or null
export function tabRank(path, role = 'guru') {
  const p = String(path || '').split('?')[0]
  const order = TAB_ORDER[role] || []
  const home = order[0]
  let best = null
  order.forEach((t, i) => {
    if (t === home ? p === home : p === t || p.startsWith(`${t}/`)) best = i
  })
  return best
}

// posNow / posPrev: the browser history position (history.state.position) of the page being opened and of the page
// being left. When they differ the browser moved through its history (a push goes one further, but a push is still
// told apart: callers read posNow BEFORE the navigation commits, when a push has not changed it yet).
export function directionFor({ to, from, role = 'guru', posNow = null, posPrev = null } = {}) {
  if (typeof posNow === 'number' && typeof posPrev === 'number' && posNow !== posPrev) return posNow < posPrev ? 'back' : 'forward'
  const dTo = pageDepth(to, role)
  const dFrom = pageDepth(from, role)
  if (dTo !== dFrom) return dTo > dFrom ? 'forward' : 'back'
  const rTo = tabRank(to, role)
  const rFrom = tabRank(from, role)
  if (rTo !== null && rFrom !== null && rTo !== rFrom) return rTo > rFrom ? 'forward' : 'back'
  return 'forward'
}
