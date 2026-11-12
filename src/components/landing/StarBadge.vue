<template>
  <span class="lp-star" :class="{ 'is-gold': gold }">
    <svg class="lp-star-frame" viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.1" aria-hidden="true">
      <path d="M34.00 20.00 L20.00 34.00 L6.00 20.00 L20.00 6.00 Z" fill="currentColor" fill-opacity="0.07" />
      <path d="M29.90 29.90 L10.10 29.90 L10.10 10.10 L29.90 10.10 Z" fill="currentColor" fill-opacity="0.07" />
    </svg>
    <span class="lp-star-body"><slot /></span>
  </span>
</template>

<script setup>
// Eight-point star frame (two overlapping squares) around an icon or a numeral.
defineProps({ gold: { type: Boolean, default: false } });
</script>
