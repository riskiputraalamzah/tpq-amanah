import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import {
  isChunkLoadError,
  recoverFromChunkError,
  stripRecoveryParam
} from './utils/chunkRecovery'
import './style.css'

// Vite emits vite:preloadError when a hashed JS/CSS chunk is gone after a new deploy
window.addEventListener('vite:preloadError', (event) => {
  const path = `${window.location.pathname}${window.location.search}${window.location.hash}`
  if (recoverFromChunkError(path)) {
    event.preventDefault()
  }
})

const app = createApp(App)

app.use(createPinia())
app.use(router)

let mounted = false
function mountApp() {
  if (mounted) return
  mounted = true
  window.__TPQ_BOOTED__ = true
  stripRecoveryParam()
  app.mount('#app')
}

router
  .isReady()
  .then(mountApp)
  .catch((error) => {
    const path = `${window.location.pathname}${window.location.search}${window.location.hash}`
    if (isChunkLoadError(error) && recoverFromChunkError(path)) {
      return
    }
    console.error('Router initialization error:', error)
    mountApp()
  })
