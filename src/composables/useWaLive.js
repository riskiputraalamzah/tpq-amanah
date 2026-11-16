// The live view of WhatsApp for the admin (Pusat WhatsApp, Riwayat & Antrean): the bot's status, today's messages
// and the queue, kept fresh without reloading. One shared poller for every page that uses it.
//
//   const live = useWaLive()   // in setup(); starts polling while at least one page uses it
//   live.state.bot / .today / .feed / .queue / .lastRows (what arrived in the last tick) / .tick
//
// Cost-aware: each poll asks only for what arrived since the last one (GET /wa-log/live, X-Wa-Since), the queue every
// third poll (or right after something was sent), every 5 s while something is happening and every 15 s when calm,
// and nothing while the tab is hidden. The bot reports what it sent every 5 s, so a message shows within ~10 s.
import { reactive, onMounted, onBeforeUnmount } from 'vue'
import api from '@/services/api'

export const FAST_MS = 5000
export const SLOW_MS = 15000
const CALM_AFTER_MS = 2 * 60 * 1000
const OVERLAP_MS = 10000 // a batch still being written when we looked is caught next time (duplicates are dropped)
const FEED_MAX = 300

const wibDay = (d = new Date()) => new Date(d.getTime() + 7 * 3600 * 1000).toISOString().slice(0, 10)
const emptyToday = () => ({ day: wibDay(), total: 0, sent: 0, failed: 0, byCategory: {} })

const state = reactive({
  ready: false,
  bot: null,
  today: emptyToday(),
  feed: [], // today's messages, newest first
  queue: null,
  lastRows: [], // what the last poll brought (pages merge these)
  tick: 0, // goes up after every poll that changed something
  updatedAt: null,
  error: '',
})

let users = 0
let timer = null
let stopTimer = null
let since = null
let busy = false
let polls = 0
let queueDirty = true
let lastChange = 0
let botKey = ''
const seen = new Set()

function count(row) {
  if (row.day && row.day !== state.today.day) return
  state.today.total += 1
  state.today[row.status === 'sent' ? 'sent' : 'failed'] += 1
  state.today.byCategory[row.category] = (state.today.byCategory[row.category] || 0) + 1
}

async function poll() {
  if (busy) return
  busy = true
  clearTimeout(timer)
  let changed = false
  try {
    // a new day: start over from today's list
    if (since && wibDay() !== state.today.day) since = null
    const wantQueue = !since || queueDirty || polls % 3 === 0
    // the same URL and the same headers every time: the browser's CORS check (OPTIONS) is done once, not per poll
    const headers = { 'X-Wa-Since': since || '', 'X-Wa-Queue': wantQueue ? '1' : '0' }
    const { data } = await api.get('/wa-log/live', { headers, cache: false })
    if (!since) {
      seen.clear()
      state.today = { day: data.day, total: data.summary.total, sent: data.summary.sent, failed: data.summary.failed, byCategory: { ...data.summary.byCategory } }
      state.feed = data.rows || []
      state.feed.forEach((r) => seen.add(r.id))
      state.lastRows = []
      changed = true
    } else {
      const fresh = (data.rows || []).filter((r) => !seen.has(r.id))
      fresh.forEach((r) => { seen.add(r.id); count(r) })
      state.lastRows = fresh
      if (fresh.length) {
        state.feed = [...fresh, ...state.feed].sort((a, b) => String(b.at).localeCompare(String(a.at))).slice(0, FEED_MAX)
        queueDirty = true // something was sent: the queue moved
        changed = true
      }
    }
    if (seen.size > 4 * FEED_MAX) {
      seen.clear()
      state.feed.forEach((r) => seen.add(r.id))
    }
    const key = `${data.bot?.waState}|${data.bot?.lastSyncAt?._seconds ?? data.bot?.lastSyncAt}`
    if (key !== botKey) { botKey = key; changed = true }
    state.bot = data.bot || {}
    if (wantQueue && data.queue) {
      if (JSON.stringify(data.queue.items) !== JSON.stringify(state.queue?.items)) changed = true
      state.queue = data.queue
      queueDirty = false
    }
    since = new Date(new Date(data.now).getTime() - OVERLAP_MS).toISOString()
    state.ready = true
    state.error = ''
    state.updatedAt = new Date()
    if (changed) {
      lastChange = Date.now()
      state.tick += 1
    }
  } catch (err) {
    state.error = err.response?.data?.error || 'Koneksi ke server terputus. Mencoba lagi…'
  } finally {
    busy = false
    polls += 1
    schedule()
  }
}

function schedule() {
  clearTimeout(timer)
  if (!users || document.visibilityState !== 'visible') return
  timer = setTimeout(poll, Date.now() - lastChange < CALM_AFTER_MS ? FAST_MS : SLOW_MS)
}

const onVisible = () => {
  if (document.visibilityState === 'visible' && users) poll()
}

function start() {
  clearTimeout(stopTimer)
  lastChange = Date.now() // just opened: look often
  document.addEventListener('visibilitychange', onVisible)
  poll()
}

function stop() {
  clearTimeout(timer)
  document.removeEventListener('visibilitychange', onVisible)
  since = null // next time: start over (we did not watch meanwhile)
  queueDirty = true
}

// Now, with the queue (after the admin sent or cancelled something, or pressed refresh)
export function refreshWaLive() {
  queueDirty = true
  lastChange = Date.now()
  return poll()
}

// After the admin changed the queue: show the server's answer at once
export function setWaQueue(queue) {
  state.queue = queue
  state.tick += 1
}

export function useWaLive() {
  onMounted(() => {
    users += 1
    if (users === 1) {
      // moving between the WhatsApp pages keeps the poller (the next page mounts before this timer fires)
      if (stopTimer) {
        clearTimeout(stopTimer)
        stopTimer = null
        schedule()
      } else start()
    }
  })
  onBeforeUnmount(() => {
    users = Math.max(0, users - 1)
    if (!users) {
      clearTimeout(timer)
      stopTimer = setTimeout(() => {
        stopTimer = null
        if (!users) stop()
      }, 3000)
    }
  })
  return { state, refresh: refreshWaLive, setQueue: setWaQueue }
}
