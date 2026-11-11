// Sorting for the santri table: Nama, No. Induk, and Jilid 1-6 followed by Marhalah.
// Santri with no level or no nomor induk always stay at the bottom, whichever direction is chosen.

export const levelRank = (classId) => {
  const value = String(classId ?? '').trim().toLowerCase()
  if (!value) return null
  if (value === 'marhalah') return 7
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

// Year then sequence, so 411235151939-27-001 comes after 411235151939-26-999 and -1000 after -999.
export const nomorIndukKey = (row) => {
  if (!row?.nomorInduk) return null
  const [, year = '', seq = ''] = String(row.nomorInduk).split('-')
  const tahun = Number(row.nomorIndukTahun ?? year)
  const urut = Number(row.nomorIndukUrut ?? seq)
  return Number.isFinite(tahun) && Number.isFinite(urut) ? tahun * 100000 + urut : null
}

const compareName = (a, b) =>
  String(a.name || '').localeCompare(String(b.name || ''), 'id', { sensitivity: 'base', numeric: true })

const KEYS = {
  nomorInduk: nomorIndukKey,
  level: (row) => levelRank(row.currentClassId),
}

export function sortSantri(rows, key = 'name', dir = 'asc') {
  const direction = dir === 'desc' ? -1 : 1
  const valueOf = KEYS[key]
  return [...rows].sort((a, b) => {
    if (!valueOf) return direction * compareName(a, b)
    const va = valueOf(a)
    const vb = valueOf(b)
    if (va === null || vb === null) {
      if (va === vb) return compareName(a, b)
      return va === null ? 1 : -1
    }
    // Same level: names stay A-Z so the list is easy to scan.
    return direction * (va - vb) || compareName(a, b)
  })
}
