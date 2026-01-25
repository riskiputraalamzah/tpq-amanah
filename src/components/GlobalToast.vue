<template>
  <Teleport to="body">
    <TransitionGroup name="toast-list">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="toast-container"
        :class="toast.type"
      >
        <div class="toast-content">
          <div class="toast-icon">
            <span v-if="toast.type === 'success'">✅</span>
            <span v-else-if="toast.type === 'error'">❌</span>
            <span v-else-if="toast.type === 'warning'">⚠️</span>
            <span v-else>ℹ️</span>
          </div>
          <div class="toast-message">
            <strong v-if="toast.title" class="toast-title">{{ toast.title }}</strong>
            <p class="toast-text">{{ toast.message }}</p>
          </div>
          <button class="toast-close" @click="remove(toast.id)">×</button>
        </div>
        <div class="toast-progress" :style="{ animationDuration: toast.duration + 'ms' }"></div>
      </div>
    </TransitionGroup>

    <!-- Confirm Dialog -->
    <Transition name="confirm-fade">
      <div v-if="confirmState.visible" class="confirm-overlay" @click.self="handleCancel">
        <div class="confirm-dialog" :class="confirmState.type">
          <div class="confirm-header">
            <span class="confirm-icon">
              <span v-if="confirmState.type === 'danger'">🗑️</span>
              <span v-else-if="confirmState.type === 'warning'">⚠️</span>
              <span v-else>❓</span>
            </span>
            <h3>{{ confirmState.title }}</h3>
          </div>
          <p class="confirm-message">{{ confirmState.message }}</p>
          <div class="confirm-actions">
            <button class="btn btn-secondary" @click="handleCancel">{{ confirmState.cancelText }}</button>
            <button class="btn" :class="confirmState.type === 'danger' ? 'btn-danger' : 'btn-primary'" @click="handleConfirm">
              {{ confirmState.confirmText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { useToast, useConfirm } from '@/composables/useToast'

const { toasts, remove } = useToast()
const { confirmState, handleConfirm, handleCancel } = useConfirm()
</script>

<style scoped>
/* Toast Container */
.toast-container {
  position: fixed;
  top: 10px;
  right: 10px;
  z-index: 99999;
  min-width: 320px;
  max-width: 420px;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  backdrop-filter: blur(10px);
  margin-bottom: 12px;
}

/* .toast-container:nth-child(2) { top: calc(20px + 90px); }
.toast-container:nth-child(3) { top: calc(20px + 180px); } */

.toast-container.success { background: linear-gradient(135deg, rgba(76, 175, 80, 0.95), rgba(56, 142, 60, 0.95)); }
.toast-container.error { background: linear-gradient(135deg, rgba(244, 67, 54, 0.95), rgba(211, 47, 47, 0.95)); }
.toast-container.warning { background: linear-gradient(135deg, rgba(255, 152, 0, 0.95), rgba(245, 124, 0, 0.95)); }

@media (max-width: 480px) {
  .toast-container {
    min-width: auto;
    width: calc(100% - 20px);
    right: 10px;
    left: 10px;
  }
}
.toast-container.info { background: linear-gradient(135deg, rgba(33, 150, 243, 0.95), rgba(25, 118, 210, 0.95)); }

.toast-content {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px 20px;
  color: white;
}

.toast-icon { font-size: 1.5rem; flex-shrink: 0; line-height: 1; }
.toast-message { flex: 1; }
.toast-title { display: block; font-weight: 600; margin-bottom: 4px; font-size: 0.95rem; }
.toast-text { margin: 0; font-size: 0.875rem; opacity: 0.95; line-height: 1.4; }
.toast-close { background: rgba(255, 255, 255, 0.2); color: white; width: 28px; height: 28px; border-radius: 50%; font-size: 1.2rem; line-height: 1; flex-shrink: 0; transition: background 0.2s; }
.toast-close:hover { background: rgba(255, 255, 255, 0.3); }
.toast-progress { height: 4px; background: rgba(255, 255, 255, 0.3); animation: progress linear forwards; }

@keyframes progress { from { width: 100%; } to { width: 0%; } }

/* Toast List Transition */
.toast-list-enter-active { animation: slideIn 0.3s ease-out; }
.toast-list-leave-active { animation: slideOut 0.3s ease-in; }
.toast-list-move { transition: transform 0.3s ease; }

@keyframes slideIn { from { opacity: 0; transform: translateX(100%); } to { opacity: 1; transform: translateX(0); } }
@keyframes slideOut { from { opacity: 1; transform: translateX(0); } to { opacity: 0; transform: translateX(100%); } }

/* Confirm Dialog */
.confirm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 20px;
  backdrop-filter: blur(4px);
}

.confirm-dialog {
  background: white;
  border-radius: 20px;
  padding: 28px;
  max-width: 400px;
  width: 100%;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
  text-align: center;
}

.confirm-header {
  margin-bottom: 16px;
}

.confirm-icon {
  display: inline-block;
  font-size: 3rem;
  margin-bottom: 12px;
}

.confirm-header h3 {
  color: #1b5e20;
  font-size: 1.25rem;
  margin: 0;
}

.confirm-dialog.danger .confirm-header h3 { color: #d32f2f; }

.confirm-message {
  color: #616161;
  font-size: 0.95rem;
  line-height: 1.6;
  margin-bottom: 24px;
}

.confirm-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.confirm-actions .btn {
  min-width: 120px;
  padding: 12px 24px;
  border-radius: 50px;
  font-weight: 600;
}

.btn-danger { background: #f44336; color: white; }
.btn-danger:hover { background: #d32f2f; }

/* Confirm Fade Transition */
.confirm-fade-enter-active { animation: fadeIn 0.2s ease-out; }
.confirm-fade-leave-active { animation: fadeOut 0.2s ease-in; }

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }

.confirm-dialog { animation: scaleIn 0.2s ease-out; }
@keyframes scaleIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
</style>
