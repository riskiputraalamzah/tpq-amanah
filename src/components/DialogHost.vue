<template>
  <Teleport to="body">
    <div v-if="dialogState.open" class="dlg-overlay" @click.self="close(false)" @keydown.esc.stop="close(false)">
      <section ref="box" class="dlg" :class="`is-${dialogState.tone}`" role="alertdialog" aria-modal="true"
        aria-labelledby="dlg-title" :aria-describedby="dialogState.message ? 'dlg-message' : undefined">
        <div class="dlg-icon" aria-hidden="true">
          <LineIcon :name="dialogState.tone === 'danger' ? 'x' : 'info'" :size="22" :stroke="2.4" />
        </div>
        <h3 id="dlg-title" class="dlg-title">{{ dialogState.title }}</h3>
        <p v-if="dialogState.message" id="dlg-message" class="dlg-message">{{ dialogState.message }}</p>

        <div v-if="dialogState.input" class="dlg-field">
          <label for="dlg-input" class="dlg-label">{{ dialogState.input.label }}</label>
          <input id="dlg-input" ref="field" v-model="dialogState.input.value" class="dlg-input" :placeholder="dialogState.input.placeholder"
            :maxlength="dialogState.input.maxlength" autocomplete="off" @keydown.enter.prevent="confirm" />
        </div>

        <div class="dlg-actions">
          <button ref="cancelBtn" type="button" class="dlg-btn dlg-btn-ghost" @click="close(false)">{{ dialogState.cancelText }}</button>
          <button type="button" class="dlg-btn" :class="dialogState.tone === 'danger' ? 'dlg-btn-danger' : 'dlg-btn-primary'" :disabled="!canConfirm" @click="confirm">
            {{ dialogState.confirmText }}
          </button>
        </div>
      </section>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import LineIcon from '@/components/LineIcon.vue'
import { useDialog } from '@/composables/useDialog'

const { dialogState, close } = useDialog()
const field = ref(null)
const cancelBtn = ref(null)

const canConfirm = computed(() => !dialogState.input?.required || String(dialogState.input.value || '').trim().length > 0)
const confirm = () => {
  if (canConfirm.value) close(true)
}

// the text field when one is asked for; otherwise Cancel (never the destructive button, so Enter cannot delete by accident)
watch(() => dialogState.open, async (open) => {
  if (!open) return
  await nextTick()
  const el = field.value || cancelBtn.value
  el?.focus()
  field.value?.select?.()
})
</script>

<style scoped>
.dlg-overlay {
  position: fixed;
  inset: 0;
  z-index: 100000; /* above every sheet in the app (they go up to 9990), below the toasts */
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 0;
  background: rgba(3, 29, 20, 0.6);
}

@media (min-width: 640px) {
  .dlg-overlay {
    align-items: center;
    padding: 16px;
  }
}

.dlg {
  width: 100%;
  max-width: 440px;
  padding: 22px 20px calc(20px + env(safe-area-inset-bottom));
  border-radius: 22px 22px 0 0;
  background: #fbf9f3;
  box-shadow: 0 -12px 40px rgba(0, 0, 0, 0.3);
  color: #0b3b2a;
  text-align: center;
}

@media (min-width: 640px) {
  .dlg {
    border-radius: 22px;
    padding-bottom: 20px;
  }
}

.dlg-icon {
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  margin: 0 auto 10px;
  border-radius: 50%;
  background: #e3f1ea;
  color: #0a5c40;
  box-shadow: 0 0 0 6px #f0f7f3;
}

.is-danger .dlg-icon {
  background: #fdecea;
  color: #b42318;
  box-shadow: 0 0 0 6px #fef5f4;
}

.dlg-title {
  margin: 0 0 6px;
  font-size: 1.2rem;
  font-weight: 800;
  line-height: 1.25;
  text-wrap: balance;
}

.dlg-message {
  margin: 0 0 16px;
  font-size: 0.95rem;
  line-height: 1.55;
  color: #475a50;
  overflow-wrap: anywhere;
}

.dlg-field {
  display: grid;
  gap: 6px;
  margin-bottom: 16px;
  text-align: left;
}

.dlg-label {
  font-size: 0.88rem;
  font-weight: 700;
}

.dlg-input {
  width: 100%;
  min-height: 48px;
  padding: 0 14px;
  border-radius: 12px;
  border: 1.5px solid rgba(11, 59, 42, 0.25);
  background: #fff;
  font: inherit;
  color: #0b3b2a;
  box-sizing: border-box;
}

.dlg-input:focus {
  border-color: #0a5c40;
  outline: none;
  box-shadow: 0 0 0 3px rgba(10, 92, 64, 0.16);
}

.dlg-actions {
  display: flex;
  gap: 10px;
}

.dlg-btn {
  flex: 1 1 0;
  min-height: 50px;
  padding: 0 14px;
  border-radius: 14px;
  border: 1.5px solid transparent;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}

.dlg-btn-ghost {
  background: #fff;
  border-color: rgba(11, 59, 42, 0.22);
  color: #0b3b2a;
}

.dlg-btn-primary {
  background: linear-gradient(135deg, #0a5c40, #053d2c);
  color: #fff;
}

.dlg-btn-danger {
  background: #b42318;
  color: #fff;
}

.dlg-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.dlg-btn:focus-visible {
  outline: 3px solid #b45309;
  outline-offset: 2px;
}
</style>
