<template>
  <div class="money-field">
    <div class="money-box">
      <span class="money-prefix" aria-hidden="true">Rp</span>
      <input
        :id="id"
        ref="el"
        :value="text"
        type="text"
        inputmode="numeric"
        autocomplete="off"
        :class="inputClass"
        :style="{ paddingLeft: '2.75rem' }"
        :placeholder="placeholder"
        :required="required"
        :disabled="disabled"
        :aria-label="ariaLabel || undefined"
        :aria-describedby="hint && words ? hintId : undefined"
        @input="onInput"
        @compositionend="onInput"
      />
    </div>
    <!-- spelled out, so a missing or extra zero is seen at once -->
    <p v-if="hint && words" :id="hintId" class="money-words">{{ words }}</p>
  </div>
</template>

<script setup>
// A Rupiah field: shows "1.033.223" while typing, keeps a plain number (1033223) in v-model ('' when empty), and
// spells the amount out below. Used for every money input (tabungan, biaya kegiatan, ...). Logic: utils/money.js.
import { ref, computed, watch } from 'vue'
import { moneyInputState, formatThousands, caretAfterFormat, parseMoney, terbilang, deleteAcrossSeparator, MONEY_MAX } from '@/utils/money'

const props = defineProps({
  modelValue: { type: [Number, String], default: '' },
  id: { type: String, default: undefined },
  inputClass: { type: [String, Array, Object], default: 'form-input' },
  placeholder: { type: String, default: '0' },
  required: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  ariaLabel: { type: String, default: '' },
  max: { type: Number, default: MONEY_MAX },
  hint: { type: Boolean, default: true },
})
const emit = defineEmits(['update:modelValue'])

const el = ref(null)
const toNumber = (v) => (v === '' || v === null || v === undefined ? null : parseMoney(String(v)))
const text = ref(formatThousands(toNumber(props.modelValue)))
const hintId = `money-words-${Math.random().toString(36).slice(2, 9)}`

const words = computed(() => {
  const n = parseMoney(text.value)
  return n ? terbilang(n) : ''
})

// the page changed the value (a reset after saving, an edit form filled in): show it
watch(
  () => props.modelValue,
  (v) => {
    const n = toNumber(v)
    if (n !== parseMoney(text.value)) text.value = formatThousands(n)
  },
)

function onInput(event) {
  const input = event.target
  let typed = input.value
  let caret = input.selectionStart ?? typed.length
  // Backspace / Delete next to a dot: remove the digit beside it (the dot alone would come straight back)
  const kind = event.inputType === 'deleteContentBackward' ? 'backward' : event.inputType === 'deleteContentForward' ? 'forward' : ''
  if (kind) {
    const fixed = deleteAcrossSeparator(text.value, typed, caret, kind)
    if (fixed) {
      typed = fixed.typed
      caret = fixed.caret
    }
  }
  const state = moneyInputState(typed, { max: props.max })
  text.value = state.text
  input.value = state.text // the DOM at once, so the caret can be placed on the formatted text
  const pos = caretAfterFormat(typed, caret, state.text)
  if (document.activeElement === input) input.setSelectionRange(pos, pos)
  emit('update:modelValue', state.value === null ? '' : state.value)
}

defineExpose({ focus: () => el.value?.focus() })
</script>

<style scoped>
.money-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
}

.money-box {
  position: relative;
  width: 100%;
}

.money-prefix {
  position: absolute;
  left: 0.9rem;
  top: 50%;
  transform: translateY(-50%);
  font-weight: 700;
  color: #0a5c40;
  pointer-events: none;
}

.money-box input {
  width: 100%;
  font-variant-numeric: tabular-nums;
}

.money-words {
  margin: 0;
  font-size: 0.78rem;
  font-style: italic;
  line-height: 1.4;
  color: #5b6b62;
  overflow-wrap: anywhere;
}

.money-words::first-letter {
  text-transform: uppercase;
}
</style>
