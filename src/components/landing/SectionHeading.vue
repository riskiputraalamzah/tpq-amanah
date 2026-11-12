<script setup>
import OrnamentRule from "./OrnamentRule.vue";

// Section heading: ornament rule, the heading itself, then the lede (default slot) and anything after it.
defineProps({
  title: { type: String, required: true },
  headingId: { type: String, default: undefined },
  dark: { type: Boolean, default: false },
});
</script>

<template>
  <header class="max-w-3xl mx-auto mb-14 text-center sm:mb-16" :class="{ 'lp-on-dark': dark }">
    <OrnamentRule />
    <h2 :id="headingId" class="lp-title">{{ title }}</h2>
    <p v-if="$slots.default" class="lp-lede"><slot /></p>
    <slot name="after" />
  </header>
</template>
