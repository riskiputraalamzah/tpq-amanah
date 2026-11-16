// The WhatsApp bot's state as the admin reads it (Pusat WhatsApp). The bot reports its WhatsApp state the moment it
// changes, and checks in every minute; no word for 10 minutes means the bot itself is down.

// whatsapp-web.js states plus "ready"
export const WA_STATES = {
  ready: { tone: 'ok', label: 'Online', text: 'WhatsApp terhubung' },
  CONNECTED: { tone: 'ok', label: 'Online', text: 'WhatsApp terhubung' },
  QR_RECEIVED: { tone: 'warn', label: 'Perlu scan QR', text: 'WhatsApp menunggu scan QR di halaman /scan bot' },
  AUTHENTICATED: { tone: 'warn', label: 'Menyambung...', text: 'WhatsApp sedang menyambung' },
  INITIALIZING: { tone: 'warn', label: 'Menyambung...', text: 'Bot sedang menyalakan WhatsApp' },
  OPENING: { tone: 'warn', label: 'Menyambung...', text: 'WhatsApp sedang menyambung' },
  PAIRING: { tone: 'warn', label: 'Menyambung...', text: 'WhatsApp sedang menyambung' },
  NOT_STARTED: { tone: 'warn', label: 'Menyambung...', text: 'Bot sedang menyalakan WhatsApp' },
  RECONNECTING: { tone: 'warn', label: 'Menyambung ulang...', text: 'WhatsApp terputus, bot sedang menyambung ulang otomatis' },
}

export const SILENT_AFTER_MIN = 10

export const toDate = (value) => {
  if (!value) return null
  if (value._seconds !== undefined) return new Date(value._seconds * 1000)
  if (value.seconds !== undefined) return new Date(value.seconds * 1000)
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function relativeTime(date, nowMs = Date.now()) {
  const minutes = Math.round((nowMs - date.getTime()) / 60000)
  if (minutes < 1) return 'baru saja'
  if (minutes < 60) return `${minutes} menit lalu`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} jam lalu`
  return date.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
}

// { tone: ok | warn | danger | neutral, label, text, seen } from the bot's last report
export function botStatusOf(bot, nowMs = Date.now()) {
  const last = toDate(bot?.lastSyncAt)
  if (!bot) return { tone: 'neutral', label: 'Memeriksa…', text: 'Mengambil status bot', seen: '' }
  if (!last) {
    return { tone: 'neutral', label: 'Belum terhubung', text: 'Bot belum pernah melapor. Pastikan bot versi terbaru sudah berjalan di VM.', seen: '' }
  }
  const seen = relativeTime(last, nowMs)
  if ((nowMs - last.getTime()) / 60000 > SILENT_AFTER_MIN) {
    return { tone: 'danger', label: 'Bot tidak aktif', text: `Tidak ada kabar dari bot sejak ${seen}. Cek bot di VM.`, seen }
  }
  const wa = WA_STATES[bot.waState] || { tone: 'danger', label: 'WA terputus', text: 'WhatsApp terputus' }
  return { tone: wa.tone, label: wa.label, text: wa.text, seen }
}

// what a message was for (wa_message_log category)
export const WA_CATEGORY = {
  guru: 'Guru',
  pengumuman: 'Pengumuman',
  broadcast: 'Broadcast',
  wali_kode: 'Kode masuk wali',
  wali_alfa: 'Kabar alfa',
  pendaftaran: 'Pendaftaran',
  wali_info: 'Info wali',
  tes: 'Tes',
  lainnya: 'Lainnya',
}

export const RUN_LABELS = { start: 'Pesan awal sesi', end: 'Cek akhir sesi', recap: 'Rekap belum absen', coverage: 'Jaga sesi tidak kosong guru' }

// the teachers' reminders the bot ran last ("Pesan awal sesi: Sen 16 Nov 15:00 · 5 terkirim")
export function lastRunItems(lastRuns) {
  return Object.entries(lastRuns || {})
    .filter(([type]) => RUN_LABELS[type])
    .map(([type, run]) => {
      const at = toDate(run.at)
      const when = at ? at.toLocaleString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-'
      const parts = [`${run.sent || 0} terkirim`]
      if (run.failed) parts.push(`${run.failed} gagal`)
      if (run.skipped) parts.push(`${run.skipped} tidak perlu`)
      return { type, label: RUN_LABELS[type], value: `${when} · ${parts.join(', ')}` }
    })
}
