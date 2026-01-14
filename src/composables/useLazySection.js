import { ref, onMounted, onUnmounted } from 'vue'

/**
 * Composable for lazy loading sections using Intersection Observer
 * Useful for deferring heavy content like iframes, images, or complex components
 * 
 * @param {Object} options - Intersection Observer options
 * @param {string} options.rootMargin - Margin around the root (default: '100px')
 * @param {number} options.threshold - Visibility threshold (default: 0)
 * @returns {Object} - { targetRef, isVisible }
 */
export function useLazySection(options = {}) {
    const targetRef = ref(null)
    const isVisible = ref(false)
    let observer = null

    const defaultOptions = {
        rootMargin: '100px',
        threshold: 0,
        ...options
    }

    onMounted(() => {
        if (!targetRef.value) return

        observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    isVisible.value = true
                    // Once visible, stop observing (one-time trigger)
                    observer?.disconnect()
                }
            })
        }, defaultOptions)

        observer.observe(targetRef.value)
    })

    onUnmounted(() => {
        observer?.disconnect()
    })

    return {
        targetRef,
        isVisible
    }
}
