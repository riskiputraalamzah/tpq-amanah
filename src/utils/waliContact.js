// "Hubungi Wali": the opening line a teacher's WhatsApp starts with, and the page's search.

const HONORIFIC = /^(bapak|bpk|pak|ibu|bu|bunda|ayah|abi|umi|ummi|mama|papa|mamah|papah)\b/i

// "Assalamu'alaikum Ibu Siti. Saya Ustadz Riski dari TPQ Amanah, izin menyampaikan perihal ananda Ahmad (Jilid 6)."
// The teacher types the rest in WhatsApp (and may change anything before sending).
export function buildWaliGreeting({ relation = '', waliName = '', santriName = '', jilidLabel = '', senderName = '', senderIsAdmin = false } = {}) {
  const name = String(waliName || '').trim()
  const title = relation === 'ibu' ? 'Ibu' : relation === 'ayah' ? 'Bapak' : 'Bapak/Ibu'
  let addressee
  if (name && HONORIFIC.test(name)) addressee = name // "Bunda Aisyah": already polite
  else if (name) addressee = `${title} ${name}`
  else addressee = relation === 'ibu' || relation === 'ayah' ? title : 'Bapak/Ibu wali santri'

  const sender = String(senderName || '').trim() || (senderIsAdmin ? 'admin' : 'pengajar')
  const child = String(santriName || '').trim()
  const about = child ? `perihal ananda ${child}${jilidLabel ? ` (${jilidLabel})` : ''}` : 'perihal ananda'
  return `Assalamu'alaikum ${addressee}.\n\nSaya ${sender} dari TPQ Amanah, izin menyampaikan ${about}.\n\n`
}

// matches the santri's name, a parent's name or a number (typed as 08…, 628… or +62 …)
export function matchesContactQuery(santri, rawQuery) {
  const q = String(rawQuery || '').trim().toLowerCase()
  if (!q) return true
  if (String(santri?.name || '').toLowerCase().includes(q)) return true
  if (String(santri?.nomorInduk || '').toLowerCase().includes(q)) return true
  const contacts = santri?.contacts || []
  if (contacts.some((c) => String(c.name || '').toLowerCase().includes(q))) return true
  let digits = q.replace(/\D/g, '')
  if (digits.length < 3) return false
  if (digits.startsWith('0')) digits = `62${digits.slice(1)}`
  return contacts.some((c) => String(c.phone || '').includes(digits))
}
