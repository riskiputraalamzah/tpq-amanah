// One dialog in the app's own design (replaces the browser's confirm() / prompt()). The host is DialogHost.vue, mounted once in App.vue.
//
//   const { ask } = useDialog()
//   if (await ask({ title: 'Lepas tautan?', message: '...', tone: 'danger', confirmText: 'Lepas' })) { ... }   // true / false
//   const reason = await ask({ title: 'Tolak?', input: { label: 'Alasan', required: true } })                  // text / null
import { reactive } from 'vue'

export const dialogState = reactive({
  open: false,
  title: '',
  message: '',
  tone: 'default', // default | danger
  confirmText: 'Ya, lanjutkan',
  cancelText: 'Batal',
  input: null, // { label, placeholder, value, required, maxlength } when a text is asked for
  resolve: null,
})

export function useDialog() {
  const ask = (options = {}) =>
    new Promise((resolve) => {
      // a dialog still open is cancelled rather than left hanging
      if (dialogState.resolve) dialogState.resolve(dialogState.input ? null : false)
      dialogState.title = options.title || 'Konfirmasi'
      dialogState.message = options.message || ''
      dialogState.tone = options.tone === 'danger' ? 'danger' : 'default'
      dialogState.confirmText = options.confirmText || (options.input ? 'Simpan' : 'Ya, lanjutkan')
      dialogState.cancelText = options.cancelText || 'Batal'
      dialogState.input = options.input
        ? { label: '', placeholder: '', value: '', required: false, maxlength: 200, ...options.input }
        : null
      dialogState.resolve = resolve
      dialogState.open = true
    })

  // answer: true / false for a confirmation, the (trimmed) text or null when an input was asked for
  const close = (confirmed) => {
    const resolve = dialogState.resolve
    const result = dialogState.input ? (confirmed ? String(dialogState.input.value || '').trim() : null) : !!confirmed
    dialogState.open = false
    dialogState.resolve = null
    dialogState.input = null
    if (resolve) resolve(result)
  }

  return { ask, close, dialogState }
}
