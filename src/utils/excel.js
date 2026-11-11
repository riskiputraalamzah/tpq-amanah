// Excel (.xlsx) helpers. exceljs is large, so it is only downloaded when someone clicks an export button.
// The builders in excelExports.js take the library as an argument, which also lets the tests run in Node.

let excelLib = null

export function loadExcelLib() {
  if (!excelLib) {
    excelLib = import('exceljs')
      .then((mod) => mod.default || mod)
      .catch((error) => {
        excelLib = null
        throw error
      })
  }
  return excelLib
}

export const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

export const COLORS = {
  header: 'FF1B5E20',
  headerText: 'FFFFFFFF',
  title: 'FF1B5E20',
  subtle: 'FF616161',
  border: 'FFD9D9D9',
  zebra: 'FFF6F8F6',
  ok: 'FFC8E6C9',
  warn: 'FFFFF3C4',
  alert: 'FFFFDCC7',
  info: 'FFBBDEFB',
  danger: 'FFFFCDD2',
  muted: 'FFEEEEEE',
  off: 'FFE0E0E0',
}

// Date as YYYY-MM-DD in Western Indonesia time, for file names and "diekspor pada" lines.
export function dateStamp(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date)
}

export function timeStamp(date = new Date()) {
  return new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'long', timeStyle: 'short' }).format(date)
}

// Sheet names: at most 31 characters and none of \ / * ? : [ ]
export function safeSheetName(name) {
  return String(name || 'Sheet').replace(/[\\/*?:[\]]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 31) || 'Sheet'
}

export function safeFileName(name) {
  return String(name).replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, '-')
}

const thinBorder = { style: 'thin', color: { argb: COLORS.border } }
const allBorders = { top: thinBorder, left: thinBorder, bottom: thinBorder, right: thinBorder }

const isSpec = (value) => value && typeof value === 'object' && !(value instanceof Date) && 'v' in value

/**
 * Adds a sheet with an optional title block, a styled header row, data rows and (optionally) a filter.
 *
 * columns: [{ header, width?, align?, numFmt?, text? }]   text: true writes the value as text (e.g. nomor induk)
 * rows:    arrays of values; a value can also be { v, fill?, bold?, color?, align? } for a coloured cell
 * Returns { sheet, headerRow, firstDataRow, lastDataRow } so callers can append notes below the table.
 */
export function addTableSheet(workbook, name, { title, lines = [], columns, rows, freezeColumns = 0, filter = true, zebra = true, landscape = true }) {
  const sheet = workbook.addWorksheet(safeSheetName(name), { views: [{ showGridLines: true }] })
  let row = 1

  if (title) {
    sheet.getCell(row, 1).value = title
    sheet.getCell(row, 1).font = { bold: true, size: 14, color: { argb: COLORS.title } }
    row += 1
    for (const line of lines) {
      sheet.getCell(row, 1).value = line
      sheet.getCell(row, 1).font = { size: 10, color: { argb: COLORS.subtle } }
      row += 1
    }
    row += 1
  }

  const headerRow = row
  columns.forEach((column, index) => {
    const cell = sheet.getCell(headerRow, index + 1)
    cell.value = column.header
    cell.font = { bold: true, color: { argb: COLORS.headerText } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.header } }
    cell.alignment = { vertical: 'middle', horizontal: column.align === 'left' ? 'left' : 'center', wrapText: true }
    cell.border = allBorders
  })
  sheet.getRow(headerRow).height = 24

  rows.forEach((values, rowIndex) => {
    const excelRow = headerRow + 1 + rowIndex
    columns.forEach((column, index) => {
      const cell = sheet.getCell(excelRow, index + 1)
      const raw = values[index]
      const spec = isSpec(raw) ? raw : { v: raw }
      let value = spec.v
      if (column.text) {
        value = value === null || value === undefined ? '' : String(value)
        cell.numFmt = '@'
      } else if (column.numFmt) {
        cell.numFmt = column.numFmt
      }
      cell.value = value === undefined ? null : value
      cell.alignment = { vertical: 'middle', horizontal: spec.align || column.align || 'left', wrapText: !!column.wrap }
      cell.border = allBorders
      if (spec.fill) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: spec.fill } }
      else if (zebra && rowIndex % 2 === 1) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.zebra } }
      if (spec.bold || spec.color) cell.font = { bold: !!spec.bold, color: spec.color ? { argb: spec.color } : undefined }
    })
  })

  columns.forEach((column, index) => {
    const lengths = [String(column.header).length, ...rows.map((values) => {
      const raw = values[index]
      const value = isSpec(raw) ? raw.v : raw
      return value instanceof Date ? 12 : String(value ?? '').length
    })]
    sheet.getColumn(index + 1).width = column.width || Math.min(Math.max(...lengths) + 3, 60)
  })

  const lastDataRow = headerRow + Math.max(rows.length, 0)
  sheet.views = [{ state: 'frozen', xSplit: freezeColumns, ySplit: headerRow, showGridLines: true }]
  if (filter && rows.length > 0) {
    sheet.autoFilter = { from: { row: headerRow, column: 1 }, to: { row: lastDataRow, column: columns.length } }
  }
  sheet.pageSetup = { orientation: landscape ? 'landscape' : 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 0, paperSize: 9 }

  return { sheet, headerRow, firstDataRow: headerRow + 1, lastDataRow }
}

export function createWorkbook(ExcelJS, { subject, createdAt = new Date() } = {}) {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'TPQ AMANAH'
  workbook.title = subject || 'TPQ AMANAH'
  workbook.created = createdAt
  return workbook
}

export async function downloadWorkbook(workbook, filename) {
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: XLSX_MIME })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10000)
}
