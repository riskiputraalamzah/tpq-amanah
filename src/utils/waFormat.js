// WhatsApp-compatible formatting, XSS-safe preview renderer, and Kegiatan message builder.
// Kept strictly aligned with backend/src/utils/activity_info_text.js so preview and copy-paste match WA Bot output.

const VALID_PHONE = /^62\d{8,13}$/
const DAYS_ID = ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
const MONTHS_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]
const SHORT_MONTHS_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

export function normalizeWaPhone(raw) {
  let digits = String(raw ?? '').replace(/\D/g, '')
  if (!digits) return ''
  if (digits.startsWith('0')) digits = `62${digits.slice(1)}`
  else if (digits.startsWith('8')) digits = `62${digits}`
  return VALID_PHONE.test(digits) ? digits : ''
}

export function formatLocalPhone(phone62) {
  const digits = normalizeWaPhone(phone62)
  if (!digits) return ''
  const local = `0${digits.slice(2)}`
  if (local.length >= 10 && local.length <= 13) {
    return `${local.slice(0, 4)}-${local.slice(4, 8)}-${local.slice(8)}`
  }
  return local
}

export function formatActivityDate(iso) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(iso || ''))) return ''
  const d = new Date(`${iso}T12:00:00Z`)
  if (Number.isNaN(d.getTime())) return ''
  return `${DAYS_ID[d.getUTCDay()]}, ${d.getUTCDate()} ${MONTHS_ID[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

export function formatWibDateTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const wib = new Date(d.getTime() + 7 * 3600 * 1000)
  const day = wib.getUTCDate()
  const month = SHORT_MONTHS_ID[wib.getUTCMonth()]
  const year = wib.getUTCFullYear()
  const hh = String(wib.getUTCHours()).padStart(2, '0')
  const mm = String(wib.getUTCMinutes()).padStart(2, '0')
  return `${day} ${month} ${year}, ${hh}.${mm} WIB`
}

export function joinNames(names = []) {
  const clean = names.filter(Boolean)
  if (clean.length <= 1) return clean[0] || 'ananda'
  if (clean.length === 2) return `${clean[0]} dan ${clean[1]}`
  return `${clean.slice(0, -1).join(', ')}, dan ${clean[clean.length - 1]}`
}

function contactBlock({ contactName = '', contactPhone = '' } = {}) {
  const phone = normalizeWaPhone(contactPhone)
  if (!phone) return []
  const label = contactName ? `*${contactName}*` : 'pengurus kegiatan'
  return [
    '',
    `Bila ada hal yang kurang jelas, silakan hubungi langsung ${label} melalui WhatsApp:`,
    `${formatLocalPhone(phone)} (https://wa.me/${phone})`,
  ]
}

export function buildActivityWaText({
  activityTitle = '',
  activityDate = '',
  children = [],
  body = '',
  contactName = '',
  contactPhone = '',
  senderName = '',
  isCopy = false,
} = {}) {
  const dateText = formatActivityDate(activityDate)
  const titlePart = dateText ? `*${activityTitle}* (${dateText})` : `*${activityTitle}*`
  const cleanBody = String(body || '').replace(/\r\n/g, '\n').trim()
  const intro = isCopy && !children.length
    ? [
        "Assalamu'alaikum warahmatullahi wabarakatuh.",
        `Bapak/Ibu wali santri peserta ${titlePart}.`,
        '',
        'Berikut informasi terkini terkait kegiatan tersebut:',
      ]
    : [
        "Assalamu'alaikum warahmatullahi wabarakatuh.",
        `Bapak/Ibu wali dari *${joinNames(children)}*.`,
        '',
        `Ananda terdaftar dalam kegiatan ${titlePart}. Berikut informasi terkini terkait kegiatan tersebut:`,
      ]

  const signOffName = contactName || senderName
  const footer = isCopy
    ? `_Informasi kegiatan TPQ Amanah${signOffName ? ` · ${signOffName}` : ''}._`
    : `_Pesan ini dikirim otomatis oleh Asisten Pengingat TPQ Amanah${signOffName ? ` atas nama ${signOffName}` : ''}._`

  return [
    ...intro,
    '',
    cleanBody || '(Isi informasi akan tampil di sini…)',
    ...contactBlock({ contactName: signOffName, contactPhone }),
    '',
    'Jazakumullahu khairan.',
    "Wassalamu'alaikum warahmatullahi wabarakatuh.",
    footer,
  ].join('\n')
}

const INLINE_WRAPPERS = {
  bold: { marker: '*', placeholder: 'teks tebal' },
  italic: { marker: '_', placeholder: 'teks miring' },
  strike: { marker: '~', placeholder: 'teks coret' },
  mono: { marker: '```', placeholder: 'teks' },
}

// Applies WhatsApp formatting around a selection (or current line for list/quote) and returns the new text + cursor range.
export function applyWaFormat(rawText, selStart = 0, selEnd = 0, kind = 'bold', extra = '') {
  const text = String(rawText ?? '')
  const start = Math.max(0, Math.min(text.length, Number(selStart) || 0))
  const end = Math.max(start, Math.min(text.length, Number(selEnd) || 0))

  if (kind === 'insert' || kind === 'emoji') {
    const ins = String(extra || '')
    const next = text.slice(0, start) + ins + text.slice(end)
    const pos = start + ins.length
    return { text: next, selectionStart: pos, selectionEnd: pos }
  }

  if (INLINE_WRAPPERS[kind]) {
    const { marker, placeholder } = INLINE_WRAPPERS[kind]
    const mLen = marker.length
    const selected = text.slice(start, end)
    if (!selected) {
      const wrapped = `${marker}${placeholder}${marker}`
      const next = text.slice(0, start) + wrapped + text.slice(end)
      return { text: next, selectionStart: start + mLen, selectionEnd: start + mLen + placeholder.length }
    }
    // Keep outer whitespace outside WhatsApp markers (*teks* works, * teks * does not)
    const leadMatch = selected.match(/^\s*/)
    const trailMatch = selected.match(/\s*$/)
    const lead = leadMatch ? leadMatch[0] : ''
    const trail = trailMatch ? trailMatch[0] : ''
    const core = selected.slice(lead.length, selected.length - trail.length)
    if (!core) {
      const wrapped = `${marker}${placeholder}${marker}`
      const next = text.slice(0, start) + lead + wrapped + trail + text.slice(end)
      const innerStart = start + lead.length + mLen
      return { text: next, selectionStart: innerStart, selectionEnd: innerStart + placeholder.length }
    }
    // Toggle off if already wrapped (either inside selection or immediately surrounding it)
    if (core.length > mLen * 2 && core.startsWith(marker) && core.endsWith(marker)) {
      const unwrapped = core.slice(mLen, -mLen)
      const next = text.slice(0, start) + lead + unwrapped + trail + text.slice(end)
      return { text: next, selectionStart: start + lead.length, selectionEnd: start + lead.length + unwrapped.length }
    }
    if (
      !lead &&
      !trail &&
      start >= mLen &&
      text.slice(start - mLen, start) === marker &&
      text.slice(end, end + mLen) === marker
    ) {
      const next = text.slice(0, start - mLen) + core + text.slice(end + mLen)
      return { text: next, selectionStart: start - mLen, selectionEnd: end - mLen }
    }
    const wrapped = `${marker}${core}${marker}`
    const next = text.slice(0, start) + lead + wrapped + trail + text.slice(end)
    return {
      text: next,
      selectionStart: start + lead.length + mLen,
      selectionEnd: start + lead.length + mLen + core.length,
    }
  }

  if (kind === 'bullet' || kind === 'number' || kind === 'quote') {
    const blockStart = text.lastIndexOf('\n', Math.max(0, start - 1)) + 1
    const nlAfter = text.indexOf('\n', end)
    const blockEnd = nlAfter === -1 ? text.length : nlAfter
    const block = text.slice(blockStart, blockEnd)
    const lines = block.split('\n')

    const prefixRe = kind === 'bullet' ? /^[-*•]\s+/ : kind === 'number' ? /^\d+\.\s+/ : /^>\s+/
    const nonEmpty = lines.filter((l) => l.trim().length > 0)
    const allHave = nonEmpty.length > 0 && nonEmpty.every((l) => prefixRe.test(l))

    let num = 1
    const updated = lines.map((line) => {
      if (allHave) return line.replace(prefixRe, '')
      const stripped = line.replace(/^([-*•]\s+|\d+\.\s+|>\s+)/, '')
      if (!stripped.trim() && lines.length > 1) return stripped
      if (kind === 'bullet') return `- ${stripped}`
      if (kind === 'quote') return `> ${stripped}`
      return `${num++}. ${stripped}`
    })

    const replaced = updated.join('\n')
    const next = text.slice(0, blockStart) + replaced + text.slice(blockEnd)
    return {
      text: next,
      selectionStart: blockStart,
      selectionEnd: blockStart + replaced.length,
    }
  }

  return { text, selectionStart: start, selectionEnd: end }
}

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// XSS-safe renderer converting WhatsApp markdown (*bold*, _italic_, ~strike~, ```mono```, lists, quotes, URLs) to HTML.
export function renderWaMarkdownHtml(rawText) {
  const normalized = String(rawText ?? '').replace(/\r\n/g, '\n').trim()
  if (!normalized) return ''

  let escaped = escapeHtml(normalized)
  const tokens = []
  const stash = (html) => {
    const key = `\u0000T${tokens.length}\u0000`
    tokens.push(html)
    return key
  }

  // 1. Protect ```monospace``` and `inline code` before inline emphasis parsing
  escaped = escaped.replace(/```([\s\S]+?)```/g, (_, inner) => stash(`<code class="wa-mono">${inner.replace(/\n/g, '<br>')}</code>`))
  escaped = escaped.replace(/`([^`\n]+)`/g, (_, inner) => stash(`<code class="wa-mono">${inner}</code>`))

  // 2. Protect URLs (so underscores inside URLs do not trigger italic parsing)
  escaped = escaped.replace(/(https?:\/\/[^\s<)]+)/g, (url) => {
    let clean = url
    let tail = ''
    while (/[.,;:!?]$/.test(clean)) {
      tail = clean.slice(-1) + tail
      clean = clean.slice(0, -1)
    }
    return stash(`<a href="${clean}" target="_blank" rel="noopener noreferrer" class="wa-link">${clean}</a>`) + tail
  })

  // 3. Process line-by-line for quotes, bullet lists, numbered lists, and inline WA emphasis
  const formatInline = (line) =>
    line
      .replace(/(^|[\s(>\[.,;:])\*([^\s*](?:[^*\n]*?[^\s*])?)\*(?=$|[\s)<\].,;:!?])/g, '$1<strong>$2</strong>')
      .replace(/(^|[\s(>\[.,;:])_([^\s_](?:[^_\n]*?[^\s_])?)_(?=$|[\s)<\].,;:!?])/g, '$1<em>$2</em>')
      .replace(/(^|[\s(>\[.,;:])~([^\s~](?:[^~\n]*?[^\s~])?)~(?=$|[\s)<\].,;:!?])/g, '$1<s>$2</s>')

  const renderedLines = escaped.split('\n').map((line) => {
    if (!line.trim()) return '<div class="wa-gap"></div>'
    const quoteMatch = line.match(/^&gt;\s?(.*)$/)
    if (quoteMatch) return `<div class="wa-quote">${formatInline(quoteMatch[1])}</div>`
    const bulletMatch = line.match(/^[-•]\s+(.*)$/)
    if (bulletMatch) return `<div class="wa-li"><span class="wa-li-mark">•</span><span>${formatInline(bulletMatch[1])}</span></div>`
    const numMatch = line.match(/^(\d+\.)\s+(.*)$/)
    if (numMatch) return `<div class="wa-li"><span class="wa-li-mark">${numMatch[1]}</span><span>${formatInline(numMatch[2])}</span></div>`
    return `<div class="wa-line">${formatInline(line)}</div>`
  })

  let out = renderedLines.join('')
  out = out.replace(/\u0000T(\d+)\u0000/g, (_, idx) => tokens[Number(idx)] || '')
  return out
}
