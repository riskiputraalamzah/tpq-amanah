import { ref, reactive } from 'vue'
import { useDialog } from '@/composables/useDialog'

// Global toast state
const toasts = reactive([])
let toastId = 0

export function useToast() {
    const show = (message, options = {}) => {
        const id = ++toastId
        const toast = {
            id,
            message,
            title: options.title || '',
            type: options.type || 'info',
            duration: options.duration ?? 3000
        }
        toasts.push(toast)

        if (toast.duration > 0) {
            setTimeout(() => {
                remove(id)
            }, toast.duration)
        }

        return id
    }

    const success = (message, options = {}) => show(message, { ...options, type: 'success' })
    const error = (message, options = {}) => show(message, { ...options, type: 'error' })
    const warning = (message, options = {}) => show(message, { ...options, type: 'warning' })
    const info = (message, options = {}) => show(message, { ...options, type: 'info' })

    const remove = (id) => {
        const index = toasts.findIndex(t => t.id === id)
        if (index > -1) toasts.splice(index, 1)
    }

    const clear = () => {
        toasts.splice(0, toasts.length)
    }

    return {
        toasts,
        show,
        success,
        error,
        warning,
        info,
        remove,
        clear
    }
}

// Confirm dialog state
const confirmState = reactive({
    visible: false,
    title: '',
    message: '',
    type: 'warning',
    confirmText: 'Ya, Lanjutkan',
    cancelText: 'Batal',
    resolve: null
})

// The older confirm() of the app: it now opens the app's one dialog (DialogHost.vue), so every page looks the same.
// confirmState and its handlers stay for anything still reading them.
export function useConfirm() {
    const { ask } = useDialog()
    const confirm = (message, options = {}) =>
        ask({
            title: options.title || 'Konfirmasi',
            message,
            tone: options.type === 'danger' ? 'danger' : 'default',
            confirmText: options.confirmText || 'Ya, Lanjutkan',
            cancelText: options.cancelText || 'Batal',
        })

    const handleConfirm = () => {
        confirmState.visible = false
        if (confirmState.resolve) confirmState.resolve(true)
    }

    const handleCancel = () => {
        confirmState.visible = false
        if (confirmState.resolve) confirmState.resolve(false)
    }

    return {
        confirmState,
        confirm,
        handleConfirm,
        handleCancel
    }
}
