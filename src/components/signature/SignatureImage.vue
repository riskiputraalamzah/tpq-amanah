<template>
  <!-- A stored signature (signatures/{uid}: an SVG path), drawn crisp at any size -->
  <svg
    v-if="sig && sig.d"
    class="sig-img"
    :viewBox="`0 0 ${sig.w || 300} ${sig.h || 150}`"
    :width="width"
    :height="height"
    preserveAspectRatio="xMidYMid meet"
    role="img"
    :aria-label="label || 'Tanda tangan'"
  >
    <path :d="sig.d" fill="none" :stroke="color" :stroke-width="stroke" stroke-linecap="round" stroke-linejoin="round" />
  </svg>
</template>

<script setup>
defineProps({
  sig: { type: Object, default: null }, // { d, w, h }
  width: { type: [Number, String], default: 72 },
  height: { type: [Number, String], default: 36 },
  color: { type: String, default: '#1f3b8f' },
  stroke: { type: Number, default: 3 },
  label: { type: String, default: '' },
})
</script>

<style scoped>
.sig-img {
  display: block;
  flex: none;
}
</style>
