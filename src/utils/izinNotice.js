// The teachers' WhatsApp of an izin (backend wali_izin_service.js): the "Izin dari wali" message waits 2 minutes
// (undo window, `notice.sendAfter`) before the bot sends it. Cancelling before then takes it back unseen; after
// that, the teachers who received it get "Ralat: izin dibatalkan" with an apology (and the canceller's note).
//
// notice (from the izin list): { state: 'waiting' | 'sent' | 'none' | 'unknown', reached, waiting, sendAfter } | null

const clock = (iso) =>
  new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' })

const waitingNow = (notice, now) =>
  notice?.state === 'waiting' && (!notice.sendAfter || new Date(notice.sendAfter).getTime() > now.getTime())

// What a cancel will do: 'retract' (nobody got it yet), 'apologize' (it went, or may just have gone), 'plain'
export function cancelPlan(notice, now = new Date()) {
  if (!notice || notice.state === 'none') return 'plain'
  if (waitingNow(notice, now)) return 'retract'
  return 'apologize'
}

// A short line under an izin card, or '' when there is nothing to say
export function noticeLine(notice, now = new Date()) {
  if (!notice) return ''
  if (waitingNow(notice, now)) {
    return notice.sendAfter
      ? `WA ke guru dikirim pukul ${clock(notice.sendAfter)} · batalkan sebelum itu bila keliru, guru tidak akan menerimanya`
      : 'WA ke guru menunggu dikirim'
  }
  if (notice.state === 'waiting') return 'WA ke guru sedang dikirim'
  if (notice.state === 'sent') return `WA terkirim ke ${notice.reached || 1} guru`
  return ''
}

// The toast after a cancel, from the server's answer { teachersNotified, noticeWithdrawn }
export function cancelResultText(label, data = {}) {
  if (data.teachersNotified > 0) return `${label} dibatalkan. Ralat & permintaan maaf dikirim ke ${data.teachersNotified} guru.`
  if (data.noticeWithdrawn > 0) return `${label} dibatalkan. Pesan WA ke guru ditarik sebelum terkirim.`
  return `${label} dibatalkan`
}

export const NOTE_INPUT = {
  label: 'Keterangan untuk guru (opsional)',
  placeholder: 'mis. salah input santri',
  maxlength: 200,
  multiline: true,
}
