<template>
  <Teleport to="body">
    <div class="toast-wrapper" aria-live="polite" aria-atomic="true">
      <TransitionGroup name="toast-list">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="toast-item"
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
            <button class="toast-close" @click="remove(toast.id)" aria-label="Tutup notifikasi">×</button>
          </div>
          <div class="toast-progress" :style="{ animationDuration: toast.duration + 'ms' }"></div>
        </div>
      </TransitionGroup>
    </div>

    <!-- Confirm Dialog (Always dead-center in viewport) -->
    <Transition name="confirm-fade">
      <div v-if="confirmState.visible" class="confirm-overlay" @click.self="handleCancel">
        <div class="confirm-dialog" :class="confirmState.type">
          <div class="confirm-header">
            <div class="confirm-icon-circle">
              <span v-if="confirmState.type === 'danger'">🗑️</span>
              <span v-else-if="confirmState.type === 'warning'">⚠️</span>
              <span v-else>❓</span>
            </div>
            <h3>{{ confirmState.title }}</h3>
          </div>
          <p class="confirm-message">{{ confirmState.message }}</p>
          <div class="confirm-actions">
            <button type="button" class="btn btn-secondary btn-cancel-confirm" @click="handleCancel">
              {{ confirmState.cancelText }}
            </button>
            <button
              type="button"
              class="btn"
              :class="confirmState.type === 'danger' ? 'btn-danger' : 'btn-primary'"
              @click="handleConfirm"
            >
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
/* Toast Wrapper fixed to top-right */
.toast-wrapper {
  position: fixed;
  top: 24px;
  right: 24px;
  z-index: 999999;
  display: flex;
  flex-direction: column;
  gap: 12px;
  pointer-events: none;
  max-width: 440px;
  width: calc(100% - 48px);
}

@media (max-width: 640px) {
  .toast-wrapper {
    top: 16px;
    right: 16px;
    left: 16px;
    width: auto;
    max-width: 100%;
  }
}

.toast-item {
  pointer-events: auto;
  border-radius: 16px;
  box-shadow: 0 16px 36px -8px rgba(0, 0, 0, 0.35), 0 4px 12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.toast-item.success {
  background: linear-gradient(135deg, #15803d, #166534);
  border: 1px solid rgba(74, 222, 128, 0.4);
}
.toast-item.error {
  background: linear-gradient(135deg, #dc2626, #991b1b);
  border: 1px solid rgba(248, 113, 113, 0.4);
}
.toast-item.warning {
  background: linear-gradient(135deg, #d97706, #b45309);
  border: 1px solid rgba(251, 191, 36, 0.4);
}
.toast-item.info {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  border: 1px solid rgba(96, 165, 250, 0.4);
}

.toast-content {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 16px 20px;
  color: white;
}

.toast-icon {
  font-size: 1.6rem;
  flex-shrink: 0;
  line-height: 1;
}

.toast-message {
  flex: 1;
}

.toast-title {
  display: block;
  font-weight: 700;
  margin-bottom: 3px;
  font-size: 0.95rem;
  letter-spacing: -0.01em;
}

.toast-text {
  margin: 0;
  font-size: 0.9rem;
  opacity: 0.95;
  line-height: 1.45;
}

.toast-close {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  font-size: 1.25rem;
  line-height: 1;
  flex-shrink: 0;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.toast-close:hover {
  background: rgba(255, 255, 255, 0.35);
  transform: scale(1.08);
}

.toast-progress {
  height: 4px;
  background: rgba(255, 255, 255, 0.35);
  animation: progress linear forwards;
}

@keyframes progress {
  from { width: 100%; }
  to { width: 0%; }
}

/* Transitions */
.toast-list-enter-active {
  animation: toastSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.toast-list-leave-active {
  animation: toastSlideOut 0.25s ease-in forwards;
}
.toast-list-move {
  transition: transform 0.3s ease;
}

@keyframes toastSlideIn {
  from {
    opacity: 0;
    transform: translateY(-16px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes toastSlideOut {
  from {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
  to {
    opacity: 0;
    transform: translateX(40px) scale(0.95);
  }
}

/* Confirm Dialog (Fixed Center Viewport) */
.confirm-overlay {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(15, 23, 42, 0.65);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000000;
  padding: 20px;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.confirm-dialog {
  background: white;
  border-radius: 24px;
  padding: 32px 28px;
  max-width: 440px;
  width: 100%;
  box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.4);
  text-align: center;
  animation: confirmScaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.confirm-header {
  margin-bottom: 16px;
}

.confirm-icon-circle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  font-size: 2.5rem;
  margin-bottom: 12px;
  background: #f1f5f9;
}

.confirm-dialog.danger .confirm-icon-circle {
  background: #fee2e2;
}

.confirm-dialog.warning .confirm-icon-circle {
  background: #fef3c7;
}

.confirm-header h3 {
  color: #1e293b;
  font-size: 1.3rem;
  font-weight: 700;
  margin: 0;
}

.confirm-dialog.danger .confirm-header h3 {
  color: #b91c1c;
}

.confirm-message {
  color: #475569;
  font-size: 0.95rem;
  line-height: 1.6;
  margin: 0 0 24px 0;
}

.confirm-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.confirm-actions .btn {
  min-width: 120px;
  padding: 12px 24px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-cancel-confirm {
  background: #e2e8f0;
  color: #334155;
}
.btn-cancel-confirm:hover {
  background: #cbd5e1;
}

.btn-danger {
  background: #dc2626;
  color: white;
}
.btn-danger:hover {
  background: #b91c1c;
}

.btn-primary {
  background: #16a34a;
  color: white;
}
.btn-primary:hover {
  background: #15803d;
}

/* Confirm Fade Transition */
.confirm-fade-enter-active {
  animation: confirmFadeIn 0.2s ease-out;
}
.confirm-fade-leave-active {
  animation: confirmFadeOut 0.2s ease-in;
}

@keyframes confirmFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes confirmFadeOut {
  from { opacity: 1; }
  to { opacity: 0; }
}

@keyframes confirmScaleIn {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(12px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
</style>
