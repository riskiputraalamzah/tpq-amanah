<template>
  <div class="wa-ed" :class="{ 'is-disabled': disabled }">
    <div class="wa-ed-bar" role="toolbar" aria-label="Format pesan WhatsApp">
      <button type="button" class="wa-tb" title="Tebal (*teks*) · Ctrl+B" aria-label="Tebal" :disabled="disabled" @click="fmt('bold')">
        <strong>B</strong>
      </button>
      <button type="button" class="wa-tb" title="Miring (_teks_) · Ctrl+I" aria-label="Miring" :disabled="disabled" @click="fmt('italic')">
        <em>I</em>
      </button>
      <button type="button" class="wa-tb" title="Coret (~teks~)" aria-label="Coret" :disabled="disabled" @click="fmt('strike')">
        <s>S</s>
      </button>
      <button type="button" class="wa-tb wa-tb-mono" title="Monospace (```teks```)" aria-label="Monospace" :disabled="disabled" @click="fmt('mono')">
        &lt;/&gt;
      </button>
      <span class="wa-tb-sep" aria-hidden="true"></span>
      <button type="button" class="wa-tb" title="Daftar poin (- )" aria-label="Daftar poin" :disabled="disabled" @click="fmt('bullet')">
        • List
      </button>
      <button type="button" class="wa-tb" title="Daftar bernomor (1. )" aria-label="Daftar bernomor" :disabled="disabled" @click="fmt('number')">
        1. List
      </button>
      <button type="button" class="wa-tb" title="Kutipan (> )" aria-label="Kutipan" :disabled="disabled" @click="fmt('quote')">
        ❝ Kutip
      </button>
      <button
        type="button"
        class="wa-tb"
        :class="{ 'is-on': showEmoji }"
        title="Sisipkan emoji"
        aria-label="Sisipkan emoji"
        :aria-expanded="showEmoji"
        :disabled="disabled"
        @click="showEmoji = !showEmoji"
      >
        😊
      </button>
    </div>

    <div v-if="showEmoji" class="wa-emoji-tray" role="group" aria-label="Pilih emoji">
      <button
        v-for="e in EMOJIS"
        :key="e"
        type="button"
        class="wa-emoji-btn"
        :disabled="disabled"
        @click="insertEmoji(e)"
      >
        {{ e }}
      </button>
    </div>

    <textarea
      ref="taRef"
      :id="inputId"
      class="wa-ed-input"
      :value="modelValue"
      :maxlength="maxlength"
      :placeholder="placeholder"
      :disabled="disabled"
      rows="6"
      @input="$emit('update:modelValue', $event.target.value)"
      @keydown="onKeydown"
    ></textarea>

    <div class="wa-ed-foot">
      <span class="wa-ed-hint">Format otomatis kompatibel WhatsApp: <code>*tebal*</code>, <code>_miring_</code>, <code>~coret~</code>, <code>- poin</code></span>
      <span class="wa-ed-count" :class="{ 'is-near': charCount > maxlength - 150 }">{{ charCount }} / {{ maxlength }}</span>
    </div>

    <div v-if="showPreview" class="wa-preview-box">
      <button type="button" class="wa-preview-toggle" :aria-expanded="previewOpen" @click="previewOpen = !previewOpen">
        <span>Pratinjau Tampilan WhatsApp</span>
        <span class="wa-preview-chev">{{ previewOpen ? 'Sembunyikan' : 'Tampilkan' }}</span>
      </button>
      <div v-if="previewOpen" class="wa-preview-stage">
        <p v-if="previewCaption" class="wa-preview-cap">{{ previewCaption }}</p>
        <div class="wa-bubble">
          <div class="wa-bubble-body wa-rich" v-html="previewHtml"></div>
          <span class="wa-bubble-meta" aria-hidden="true">{{ previewClock }} ✓✓</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { applyWaFormat, renderWaMarkdownHtml } from '@/utils/waFormat'

const props = defineProps({
  modelValue: { type: String, default: '' },
  inputId: { type: String, default: 'wa-rich-input' },
  maxlength: { type: Number, default: 2000 },
  placeholder: { type: String, default: 'Tulis informasi penting untuk wali santri…' },
  previewText: { type: String, default: '' },
  previewCaption: { type: String, default: '' },
  showPreview: { type: Boolean, default: true },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])

const EMOJIS = ['📌', '📅', '⏰', '📍', '📝', '✅', '⚠️', '🤲', '🕌', '📖', '🎒', '💳']

const taRef = ref(null)
const showEmoji = ref(false)
const previewOpen = ref(true)

const charCount = computed(() => String(props.modelValue || '').length)
const previewHtml = computed(() => renderWaMarkdownHtml(props.previewText || props.modelValue || ''))
const previewClock = computed(() => {
  const wib = new Date(Date.now() + 7 * 3600 * 1000)
  return `${String(wib.getUTCHours()).padStart(2, '0')}.${String(wib.getUTCMinutes()).padStart(2, '0')}`
})

async function fmt(kind, extra = '') {
  const el = taRef.value
  const current = String(props.modelValue || '')
  const start = el ? el.selectionStart : current.length
  const end = el ? el.selectionEnd : current.length
  const res = applyWaFormat(current, start, end, kind, extra)
  const clipped = res.text.slice(0, props.maxlength)
  emit('update:modelValue', clipped)
  await nextTick()
  if (el) {
    el.focus()
    el.setSelectionRange(
      Math.min(res.selectionStart, clipped.length),
      Math.min(res.selectionEnd, clipped.length),
    )
  }
}

function insertEmoji(e) {
  fmt('emoji', e)
}

function onKeydown(event) {
  if (!(event.ctrlKey || event.metaKey) || event.altKey || event.shiftKey) return
  const key = String(event.key || '').toLowerCase()
  if (key === 'b') {
    event.preventDefault()
    fmt('bold')
  } else if (key === 'i') {
    event.preventDefault()
    fmt('italic')
  }
}
</script>

<style scoped>
.wa-ed {
  display: grid;
  gap: 8px;
}

.wa-ed-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  border: 1px solid rgba(11, 59, 42, 0.2);
  border-bottom: 0;
  border-radius: 12px 12px 0 0;
  background: #f4f8f5;
}

.wa-tb {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 34px;
  min-height: 34px;
  padding: 0 9px;
  border: 1px solid rgba(11, 59, 42, 0.16);
  border-radius: 8px;
  background: #fff;
  color: #0b3b2a;
  font: inherit;
  font-size: 0.84rem;
  font-weight: 700;
  cursor: pointer;
}

.wa-tb:hover:not(:disabled) {
  background: #e3f1ea;
  border-color: rgba(10, 92, 64, 0.45);
}

.wa-tb.is-on {
  background: #0a5c40;
  border-color: #0a5c40;
  color: #fff;
}

.wa-tb-mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.8rem;
}

.wa-tb-sep {
  width: 1px;
  height: 20px;
  background: rgba(11, 59, 42, 0.16);
  margin: 0 2px;
}

.wa-emoji-tray {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: -8px;
  padding: 6px 8px;
  border: 1px solid rgba(11, 59, 42, 0.2);
  border-bottom: 0;
  background: #fbfdfb;
}

.wa-emoji-btn {
  width: 34px;
  height: 34px;
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  font-size: 1.1rem;
  cursor: pointer;
}

.wa-emoji-btn:hover:not(:disabled) {
  background: #e3f1ea;
}

.wa-ed-input {
  width: 100%;
  min-height: 132px;
  margin-top: -8px;
  padding: 12px;
  border: 1px solid rgba(11, 59, 42, 0.22);
  border-radius: 0 0 12px 12px;
  background: #fff;
  color: #0b3b2a;
  font: inherit;
  font-size: 0.95rem;
  line-height: 1.55;
  resize: vertical;
  box-sizing: border-box;
}

.wa-ed-input:focus-visible {
  outline: 3px solid #b45309;
  outline-offset: 1px;
}

.wa-ed-foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 6px 12px;
  font-size: 0.8rem;
  color: #5b6b62;
}

.wa-ed-hint code {
  padding: 1px 4px;
  border-radius: 4px;
  background: #eef4f0;
  color: #0b3b2a;
  font-size: 0.78rem;
}

.wa-ed-count {
  font-variant-numeric: tabular-nums;
  font-weight: 700;
}

.wa-ed-count.is-near {
  color: #b45309;
}

.wa-preview-box {
  border: 1px solid rgba(11, 59, 42, 0.14);
  border-radius: 14px;
  overflow: hidden;
  background: #efeae2;
}

.wa-preview-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-height: 40px;
  padding: 8px 12px;
  border: 0;
  border-bottom: 1px solid rgba(11, 59, 42, 0.1);
  background: #e7f1eb;
  color: #0b3b2a;
  font: inherit;
  font-size: 0.84rem;
  font-weight: 700;
  cursor: pointer;
}

.wa-preview-chev {
  color: #0a5c40;
  font-weight: 700;
}

.wa-preview-stage {
  padding: 12px;
  background: radial-gradient(circle at 12px 12px, rgba(11, 59, 42, 0.04) 1px, transparent 0), #efeae2;
  background-size: 20px 20px;
}

.wa-preview-cap {
  margin: 0 0 8px;
  font-size: 0.78rem;
  color: #5b6b62;
}

.wa-bubble {
  max-width: 540px;
  padding: 10px 12px 8px;
  border-radius: 12px 12px 12px 4px;
  background: #d9fdd3;
  color: #111b21;
  box-shadow: 0 1px 2px rgba(17, 27, 33, 0.14);
  font-size: 0.9rem;
  line-height: 1.5;
  overflow-wrap: anywhere;
}

.wa-bubble-meta {
  display: block;
  margin-top: 6px;
  text-align: right;
  font-size: 0.72rem;
  color: #556b5e;
}

.wa-rich :deep(.wa-line) {
  min-height: 1.2em;
}

.wa-rich :deep(.wa-gap) {
  height: 8px;
}

.wa-rich :deep(.wa-quote) {
  margin: 4px 0;
  padding: 4px 10px;
  border-left: 3px solid #0a5c40;
  border-radius: 4px;
  background: rgba(10, 92, 64, 0.08);
  color: #1c3a2d;
}

.wa-rich :deep(.wa-li) {
  display: flex;
  align-items: flex-start;
  gap: 6px;
}

.wa-rich :deep(.wa-li-mark) {
  flex: none;
  font-weight: 700;
}

.wa-rich :deep(.wa-mono) {
  padding: 1px 5px;
  border-radius: 5px;
  background: rgba(17, 27, 33, 0.08);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.84em;
}

.wa-rich :deep(.wa-link) {
  color: #027eb5;
  text-decoration: underline;
}
</style>
