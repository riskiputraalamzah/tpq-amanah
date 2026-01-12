<template>
  <div class="skeleton-wrapper" :style="wrapperStyle">
    <div v-if="type === 'text'" class="skeleton skeleton-text" :style="textStyle"></div>
    <div v-else-if="type === 'title'" class="skeleton skeleton-title"></div>
    <div v-else-if="type === 'avatar'" class="skeleton skeleton-avatar" :style="avatarStyle"></div>
    <div v-else-if="type === 'card'" class="skeleton skeleton-card" :style="cardStyle"></div>
    <div v-else-if="type === 'paragraph'" class="skeleton-paragraph">
      <div class="skeleton skeleton-text" style="width: 100%"></div>
      <div class="skeleton skeleton-text" style="width: 90%"></div>
      <div class="skeleton skeleton-text" style="width: 75%"></div>
    </div>
    <div v-else class="skeleton" :style="customStyle"></div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  type: {
    type: String,
    default: 'text',
    validator: (v) => ['text', 'title', 'avatar', 'card', 'paragraph', 'custom'].includes(v)
  },
  width: {
    type: String,
    default: '100%'
  },
  height: {
    type: String,
    default: null
  },
  size: {
    type: String,
    default: '80px'
  },
  count: {
    type: Number,
    default: 1
  }
})

const wrapperStyle = computed(() => ({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem'
}))

const textStyle = computed(() => ({
  width: props.width,
  height: props.height || '1rem'
}))

const avatarStyle = computed(() => ({
  width: props.size,
  height: props.size
}))

const cardStyle = computed(() => ({
  width: props.width,
  height: props.height || '200px'
}))

const customStyle = computed(() => ({
  width: props.width,
  height: props.height || '1rem'
}))
</script>

<style scoped>
/* Skeleton base styles */
.skeleton {
  background: linear-gradient(
    90deg,
    #e0e0e0 25%,
    #f0f0f0 50%,
    #e0e0e0 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: var(--radius-md, 8px);
}

/* Shimmer animation */
@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* Text skeleton */
.skeleton-text {
  height: 1rem;
}

/* Title skeleton */
.skeleton-title {
  height: 1.5rem;
  width: 60%;
  margin-bottom: 0.5rem;
}

/* Avatar skeleton */
.skeleton-avatar {
  border-radius: 50%;
}

/* Card skeleton */
.skeleton-card {
  border-radius: var(--radius-lg, 12px);
}

/* Paragraph skeleton container */
.skeleton-paragraph {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
</style>
