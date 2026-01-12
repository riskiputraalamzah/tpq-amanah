import { ref, reactive } from 'vue'

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

export function useConfirm() {
    const confirm = (message, options = {}) => {
        return new Promise((resolve) => {
            confirmState.visible = true
            confirmState.message = message
            confirmState.title = options.title || 'Konfirmasi'
            confirmState.type = options.type || 'warning'
            confirmState.confirmText = options.confirmText || 'Ya, Lanjutkan'
            confirmState.cancelText = options.cancelText || 'Batal'
            confirmState.resolve = resolve
        })
    }

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
