<template>
  <span class="ljp-status-badge" :class="badgeClass">
    <span class="badge-dot"></span>
    {{ label }}
  </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  status: {
    type: String,
    default: 'draft'
  },
  reopenedAt: {
    type: [Object, String, Date],
    default: null
  }
})

const effectiveStatus = computed(() => {
  const s = props.status?.toLowerCase()
  if (s === 'draft' && props.reopenedAt) return 'reopen'
  return s
})

const badgeClass = computed(() => {
  switch (effectiveStatus.value) {
    case 'approved':
      return 'badge-approved'
    case 'submitted':
      return 'badge-submitted'
    case 'reopen':
    case 'reopened':
      return 'badge-reopen'
    case 'draft':
    default:
      return 'badge-draft'
  }
})

const label = computed(() => {
  switch (effectiveStatus.value) {
    case 'approved':
      return 'Disetujui'
    case 'submitted':
      return 'Menunggu Review'
    case 'reopen':
    case 'reopened':
      return 'Perlu Revisi'
    case 'draft':
    default:
      return 'Draf'
  }
})
</script>

<style scoped>
.ljp-status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.025em;
  white-space: nowrap;
}

.badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.badge-draft {
  background: #f1f5f9;
  color: #475569;
  border: 1px solid #cbd5e1;
}
.badge-draft .badge-dot {
  background: #64748b;
}

.badge-submitted {
  background: #eff6ff;
  color: #1d4ed8;
  border: 1px solid #bfdbfe;
}
.badge-submitted .badge-dot {
  background: #2563eb;
}

.badge-approved {
  background: #f0fdf4;
  color: #15803d;
  border: 1px solid #bbf7d0;
}
.badge-approved .badge-dot {
  background: #16a34a;
}

.badge-reopen {
  background: #fef2f2;
  color: #b91c1c;
  border: 1px solid #fecaca;
}
.badge-reopen .badge-dot {
  background: #dc2626;
}
</style>

