// Money in Rupiah for the inputs (MoneyInput.vue) and their help line. Pure, so it is tested in Node.
//
// What is typed is shown with thousand dots (1.033.223) while the value kept by the page is a plain integer
// (1033223) - what the server always received. Rupiah has no cents here: anything after a comma is dropped
// ("1.033.223,00" pasted from a bank app is 1033223).

export const MONEY_MAX = 999_999_999_999 // a typo guard: nothing at the TPQ is near this

// "Rp 1.033.223" -> 1033223; "" / no digits -> null
export function parseMoney(text) {
  const beforeComma = String(text ?? '').split(',')[0]
  const digits = beforeComma.replace(/\D/g, '').replace(/^0+(?=\d)/, '')
  if (!digits) return null
  return Number(digits)
}

// 1033223 -> "1.033.223" (no "Rp": the input shows it beside the number)
export function formatThousands(value) {
  if (value === null || value === undefined || value === '') return ''
  const n = Math.trunc(Math.abs(Number(value)))
  if (!Number.isFinite(n)) return ''
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

export const formatRupiah = (value) => `Rp${formatThousands(value || 0) || '0'}`

// Where the caret goes after re-formatting: after the same number of digits as before it was typed
export function caretAfterFormat(typed, caret, formatted) {
  const digitsBefore = String(typed).slice(0, caret).split(',')[0].replace(/\D/g, '').replace(/^0+(?=\d)/, '').length
  if (digitsBefore === 0) return 0
  let seen = 0
  for (let i = 0; i < formatted.length; i += 1) {
    if (/\d/.test(formatted[i])) seen += 1
    if (seen === digitsBefore) return i + 1
  }
  return formatted.length
}

// The input's text -> what to show and what to keep. Digits beyond max are not taken (a stuck key stays harmless).
export function moneyInputState(typed, { max = MONEY_MAX } = {}) {
  let value = parseMoney(typed)
  if (value !== null && value > max) {
    let s = String(value)
    while (s.length && Number(s) > max) s = s.slice(0, -1)
    value = s ? Number(s) : null
  }
  return { value, text: formatThousands(value) }
}

// Backspace right after a dot (or Delete right before one) only removed the dot, which the formatting puts back:
// the key would seem stuck. Then the digit next to it goes instead. Returns the text to format and the caret, or
// null when the key already removed a digit.
export function deleteAcrossSeparator(previous, typed, caret, direction) {
  const digitsOf = (s) => String(s).split(',')[0].replace(/\D/g, '')
  const before = digitsOf(previous)
  if (!before || digitsOf(typed) !== before) return null
  const at = String(typed).slice(0, caret).replace(/\D/g, '').length // digits before the caret
  const index = direction === 'backward' ? at - 1 : at
  if (index < 0 || index >= before.length) return null
  const next = before.slice(0, index) + before.slice(index + 1)
  return { typed: next, caret: index }
}

const ONES = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas']

function below1000(n) {
  if (n < 12) return ONES[n]
  if (n < 20) return `${ONES[n - 10]} belas`
  if (n < 100) return `${ONES[Math.floor(n / 10)]} puluh${n % 10 ? ` ${ONES[n % 10]}` : ''}`
  const head = n < 200 ? 'seratus' : `${ONES[Math.floor(n / 100)]} ratus`
  return n % 100 ? `${head} ${below1000(n % 100)}` : head
}

// 1033223 -> "satu juta tiga puluh tiga ribu dua ratus dua puluh tiga rupiah"
export function terbilang(value) {
  const n = Math.trunc(Number(value))
  if (!Number.isFinite(n) || n < 0) return ''
  if (n === 0) return 'nol rupiah'
  const scales = [
    [1e12, 'triliun'],
    [1e9, 'miliar'],
    [1e6, 'juta'],
    [1e3, 'ribu'],
  ]
  const parts = []
  let rest = n
  for (const [size, name] of scales) {
    const count = Math.floor(rest / size)
    if (count) {
      parts.push(size === 1e3 && count === 1 ? 'seribu' : `${below1000(count)} ${name}`)
      rest -= count * size
    }
  }
  if (rest) parts.push(below1000(rest))
  return `${parts.join(' ')} rupiah`
}
