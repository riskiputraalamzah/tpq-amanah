// Kartu Prestasi on Absen Santri ("Tes mengaji"): the tests of the sesi on screen and the children's positions.
//
// Light for the teacher (user decision 2026-11-28): one tap = Lanjut / Ulang, saved at once. The row shows the new
// state immediately (optimistic); the request goes in the background, one at a time. A dropped connection keeps the
// tap and sends it again (4 / 10 / 25 s, and when the phone is online again); a refusal of the server (not hadir, no
// access) undoes it and says why. Each tap carries its own day and sesi, so switching the date never mixes them.
import { ref, computed } from 'vue'
import api from '@/services/api'
import { mainKind, suggestPlace, nextPosition } from '@/utils/kps'

const RETRY_MS = [4000, 10000, 25000]
const retriable = (err) => {
  const s = err?.response?.status
  return !s || s >= 500 || s === 408 || s === 429
}

export function useKpsDay({ onRefused = () => {} } = {}) {
  const day = ref(null) // { date, slot, canEdit, reason, lateEdit, tests, positions }
  const loading = ref(false)
  const error = ref('')
  const pending = new Map() // `${date}|${slot}|${santriId}|${kind}` -> op
  const pendingCount = ref(0)
  const state = ref('idle') // idle | saving | saved | error
  let sending = false
  let retryTimer = null
  let attempt = 0
  let loadSeq = 0
  const touch = () => { pendingCount.value = pending.size }

  async function load({ date, slot, ids = [], silent = false } = {}) {
    const mine = ++loadSeq
    if (!silent) {
      loading.value = true
      error.value = ''
    }
    try {
      const { data } = await api.get('/kps/day', { params: { date, slot, ids: ids.join(',') }, cache: false })
      if (mine !== loadSeq) return
      if (silent && (pending.size || sending)) return
      day.value = { ...data, tests: data.tests || {}, positions: data.positions || {} }
    } catch (err) {
      if (mine === loadSeq && !silent) error.value = err?.response?.data?.error || 'Data tes belum bisa dimuat.'
    } finally {
      if (mine === loadSeq) loading.value = false
    }
  }

  const testOf = (santriId, kind) => day.value?.tests?.[santriId]?.[kind] || null
  const positionOf = (santriId, kind) => day.value?.positions?.[santriId]?.[kind] || null
  // the place a tap would use now: today's test of that kind, else the suggestion from the position
  const placeFor = (santri, kind = mainKind(santri.classId)) => {
    const t = testOf(santri.id, kind)
    if (t) return kind === 'jilid' ? { jilid: t.jilid, page: t.page } : { surah: t.surah, surahName: t.surahName, ayatFrom: t.ayatFrom, ayatTo: t.ayatTo }
    return suggestPlace(kind, positionOf(santri.id, kind), santri.classId)
  }

  function setLocal(santriId, kind, test, position) {
    if (!day.value) return
    const tests = { ...day.value.tests }
    const mine = { ...(tests[santriId] || {}) }
    if (test) mine[kind] = test
    else delete mine[kind]
    tests[santriId] = mine
    const positions = { ...day.value.positions }
    if (position !== undefined) positions[santriId] = position || {}
    day.value = { ...day.value, tests, positions }
  }

  // One tap on Lanjut / Ulang. Returns 'need-place' when the child has no page yet (the caller opens the sheet).
  function quick(santri, result) {
    if (!day.value?.canEdit) return 'closed'
    const kind = mainKind(santri.classId)
    const current = testOf(santri.id, kind)
    const { date, slot } = day.value
    if (current && current.result === result) {
      // the same choice again takes the test back (like Absen Santri)
      const before = { test: current, position: day.value.positions[santri.id] }
      setLocal(santri.id, kind, null)
      queue({ key: `${date}|${slot}|${santri.id}|${kind}`, method: 'delete', body: { date, slot, santriId: santri.id, kind }, santriId: santri.id, kind, before })
      return 'removed'
    }
    const place = placeFor(santri, kind)
    if (!place || place.done) return 'need-place'
    const optimistic = { ...(current || {}), id: `${date}__${slot}__${santri.id}__${kind}`, santriId: santri.id, date, slot, kind, ...place, result, pending: true }
    const before = { test: current, position: day.value.positions[santri.id] }
    setLocal(santri.id, kind, optimistic, { ...(day.value.positions[santri.id] || {}), [kind]: nextPosition(optimistic) })
    queue({ key: `${date}|${slot}|${santri.id}|${kind}`, method: 'post', body: { date, slot, santriId: santri.id, kind, result, ...place }, santriId: santri.id, kind, before })
    return 'saved'
  }

  function queue(op) {
    pending.set(op.key, op)
    touch()
    state.value = 'saving'
    flush()
  }

  async function flush() {
    if (sending) return
    sending = true
    clearTimeout(retryTimer)
    try {
      while (pending.size) {
        const [key, op] = pending.entries().next().value
        try {
          const { data } = op.method === 'delete' ? await api.delete('/kps/tests', { data: op.body }) : await api.post('/kps/tests', op.body)
          if (pending.get(key) === op) pending.delete(key)
          attempt = 0
          if (day.value && day.value.date === op.body.date && day.value.slot === op.body.slot) {
            if (op.method === 'delete') setLocal(op.santriId, op.kind, pending.has(key) ? testOf(op.santriId, op.kind) : null, data.position || undefined)
            else if (!pending.has(key)) setLocal(op.santriId, op.kind, data.test, data.position)
          }
        } catch (err) {
          if (retriable(err)) {
            state.value = 'error'
            touch()
            retryTimer = setTimeout(flush, RETRY_MS[Math.min(attempt, RETRY_MS.length - 1)])
            attempt += 1
            return
          }
          // refused: undo on screen, say why
          if (pending.get(key) === op) pending.delete(key)
          if (day.value && day.value.date === op.body.date && day.value.slot === op.body.slot) setLocal(op.santriId, op.kind, op.before.test, op.before.position)
          onRefused(err?.response?.data?.error || 'Tes belum bisa disimpan.', err?.response?.data?.code || '')
        }
        touch()
      }
      state.value = 'saved'
    } finally {
      sending = false
      touch()
    }
  }
  const retryNow = () => {
    attempt = 0
    flush()
  }

  // The sheet: a full save (place, score, notes), waited for. Throws the server's message.
  async function saveDetail(body) {
    const { data } = await api.post('/kps/tests', body)
    if (day.value?.date === body.date && day.value?.slot === body.slot) setLocal(body.santriId, data.test.kind, data.test, data.position)
    return data
  }
  async function removeDetail(body) {
    const { data } = await api.delete('/kps/tests', { data: body })
    if (day.value?.date === body.date && day.value?.slot === body.slot) setLocal(body.santriId, body.kind, null, data.position || undefined)
    return data
  }
  async function setPosition(body) {
    const { data } = await api.put('/kps/position', body)
    if (day.value?.date === body.date && day.value?.slot === body.slot) setLocal(body.santriId, body.kind, testOf(body.santriId, body.kind), data.position)
    return data
  }

  const testedCount = computed(() => Object.values(day.value?.tests || {}).filter((m) => Object.keys(m).length).length)
  const stop = () => clearTimeout(retryTimer)

  return { day, loading, error, state, pendingCount, load, quick, flush, retryNow, saveDetail, removeDetail, setPosition, testOf, positionOf, placeFor, testedCount, stop }
}
