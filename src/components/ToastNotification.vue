<template>
  <Teleport to="body">
    <Transition name="toast-slide">
      <div v-if="visible" class="toast-container" :class="type">
        <div class="toast-content">
          <div class="toast-icon">
            <span v-if="type === 'success'">✅</span>
            <span v-else-if="type === 'error'">❌</span>
            <span v-else-if="type === 'warning'">⚠️</span>
            <span v-else>ℹ️</span>
          </div>
          <div class="toast-message">
            <strong v-if="title" class="toast-title">{{ title }}</strong>
            <p class="toast-text">{{ message }}</p>
          </div>
          <button class="toast-close" @click="close">×</button>
        </div>
        <div class="toast-progress" :style="{ animationDuration: duration + 'ms' }"></div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'

const props = defineProps({
  message: { type: String, default: '' },
  title: { type: String, default: '' },
  type: { type: String, default: 'info' }, // success, error, warning, info
  duration: { type: Number, default: 3000 },
  modelValue: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue'])
const visible = ref(false)
let timer = null

watch(() => props.modelValue, (val) => {
  visible.value = val
  if (val && props.duration > 0) {
    clearTimeout(timer)
    timer = setTimeout(() => close(), props.duration)
  }
}, { immediate: true })

const close = () => {
  visible.value = false
  emit('update:modelValue', false)
}

onMounted(() => {
  if (props.modelValue && props.duration > 0) {
    timer = setTimeout(() => close(), props.duration)
  }
})
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 24px;
  right: 24px;
  z-index: 9999;
  min-width: 320px;
  max-width: 420px;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  backdrop-filter: blur(10px);
}

.toast-container.success { background: linear-gradient(135deg, rgba(76, 175, 80, 0.95), rgba(56, 142, 60, 0.95)); }
.toast-container.error { background: linear-gradient(135deg, rgba(244, 67, 54, 0.95), rgba(211, 47, 47, 0.95)); }
.toast-container.warning { background: linear-gradient(135deg, rgba(255, 152, 0, 0.95), rgba(245, 124, 0, 0.95)); }
.toast-container.info { background: linear-gradient(135deg, rgba(33, 150, 243, 0.95), rgba(25, 118, 210, 0.95)); }

.toast-content {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px 20px;
  color: white;
}

.toast-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
  line-height: 1;
}

.toast-message {
  flex: 1;
}

.toast-title {
  display: block;
  font-weight: 600;
  margin-bottom: 4px;
  font-size: 0.95rem;
}

.toast-text {
  margin: 0;
  font-size: 0.875rem;
  opacity: 0.95;
  line-height: 1.4;
}

.toast-close {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  font-size: 1.2rem;
  line-height: 1;
  flex-shrink: 0;
  transition: background 0.2s;
}

.toast-close:hover {
  background: rgba(255, 255, 255, 0.3);
}

.toast-progress {
  height: 4px;
  background: rgba(255, 255, 255, 0.3);
  animation: progress linear forwards;
}

@keyframes progress {
  from { width: 100%; }
  to { width: 0%; }
}

/* Transitions */
.toast-slide-enter-active {
  animation: slideIn 0.3s ease-out;
}

.toast-slide-leave-active {
  animation: slideOut 0.3s ease-in;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideOut {
  from {
    opacity: 1;
    transform: translateX(0);
  }
  to {
    opacity: 0;
    transform: translateX(100%);
  }
}
</style>
