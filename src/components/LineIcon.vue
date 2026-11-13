<template>
  <!-- One drawn icon set (24px grid, round 2px stroke) instead of emoji, so every icon shares a weight and a colour -->
  <svg :width="size" :height="size" viewBox="0 0 24 24" fill="none" stroke="currentColor" :stroke-width="stroke"
    stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
    <template v-if="name === 'check'"><polyline points="20 6 9 17 4 12" /></template>
    <template v-else-if="name === 'x'"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></template>
    <template v-else-if="name === 'pencil'"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></template>
    <template v-else-if="name === 'book'"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" /></template>
    <template v-else-if="name === 'plus'"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></template>
    <template v-else-if="name === 'arrow-right'"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></template>
    <template v-else-if="name === 'info'"><circle cx="12" cy="12" r="9" /><line x1="12" y1="16" x2="12" y2="11" /><line x1="12" y1="8" x2="12.01" y2="8" /></template>
    <template v-else-if="name === 'calendar'"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></template>
    <template v-else-if="name === 'sun'"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></template>
    <template v-else-if="name === 'star'"><path d="M12 2.5 14.6 9H21l-5.2 4 2 6.5L12 15.6 6.2 19.5l2-6.5L3 9h6.4Z" /></template>
    <template v-else-if="name === 'coin'"><rect x="2.5" y="6" width="19" height="12" rx="2" /><circle cx="12" cy="12" r="2.5" /><path d="M6 12h.01M18 12h.01" /></template>
    <template v-else-if="name === 'clock'"><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15 14" /></template>
    <template v-else-if="name === 'file'"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><polyline points="14 2 14 8 20 8" /></template>
    <template v-else-if="name === 'table'"><rect x="3" y="4" width="18" height="16" rx="2" /><line x1="3" y1="10" x2="21" y2="10" /><line x1="9" y1="10" x2="9" y2="20" /></template>
    <template v-else-if="name === 'link'"><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" /><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" /></template>
    <template v-else-if="name === 'refresh'"><polyline points="23 4 23 10 17 10" /><path d="M20.5 15a9 9 0 1 1-2.1-9.4L23 10" /></template>
    <template v-else-if="name === 'chevron-down'"><polyline points="6 9 12 15 18 9" /></template>
    <template v-else-if="name === 'bolt'"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></template>
    <template v-else-if="name === 'users'"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.9" /><path d="M16 3.1a4 4 0 0 1 0 7.8" /></template>
  </svg>
</template>

<script setup>
defineProps({
  name: { type: String, required: true },
  size: { type: [Number, String], default: 18 },
  stroke: { type: [Number, String], default: 2 },
})
</script>
