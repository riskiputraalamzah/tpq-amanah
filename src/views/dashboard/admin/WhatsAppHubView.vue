<template>
  <div class="wa-hub">
    <header class="wa-head">
      <h1>Pusat WhatsApp</h1>
      <p>Status bot, pesan yang terkirim hari ini, dan antrean, diperbarui otomatis tanpa muat ulang.</p>
    </header>

    <WaHubNav />

    <PageSkeleton v-if="!live.state.ready && !live.state.error" :rows="5" label="Memuat Pusat WhatsApp" />
    <template v-else>
      <!-- today in four numbers -->
      <section class="wa-stats" aria-label="Hari ini">
        <router-link to="/dashboard/wa-log" class="wa-stat is-sent">
          <strong>{{ today.sent }}</strong><span>terkirim hari ini</span>
        </router-link>
        <router-link to="/dashboard/wa-log" class="wa-stat is-failed" :class="{ 'is-zero': !today.failed }">
          <strong>{{ today.failed }}</strong><span>gagal</span>
        </router-link>
        <router-link to="/dashboard/wa-log?tab=antrean" class="wa-stat is-queue">
          <strong>{{ queue?.summary.now || 0 }}</strong><span>antrean, segera dikirim</span>
        </router-link>
        <router-link to="/dashboard/wa-log?tab=antrean" class="wa-stat is-held">
          <strong>{{ queue?.summary.morning || 0 }}</strong><span>ditahan sampai {{ queue?.quietHours?.until || '06:30' }}</span>
        </router-link>
      </section>

      <div class="wa-grid">
        <!-- what went out, newest first -->
        <section class="wa-card" aria-labelledby="wa-feed-title">
          <div class="wa-card-head">
            <h2 id="wa-feed-title">Baru terkirim</h2>
            <span class="wa-live" :title="updatedText">
              <span class="wa-live-dot" aria-hidden="true"></span> Langsung
            </span>
          </div>
          <p v-if="categories.length" class="wa-cats">
            <span v-for="c in categories" :key="c.key">{{ c.label }} <strong>{{ c.n }}</strong></span>
          </p>
          <p v-if="!feed.length" class="wa-empty">Belum ada pesan hari ini.</p>
          <ul v-else class="wa-feed">
            <li v-for="r in feed" :key="r.id" class="wa-row" :class="{ 'is-new': fresh.has(r.id), 'is-failed': r.status === 'failed' }">
              <span class="wa-time">{{ timeOf(r.at) }}</span>
              <span class="wa-main">
                <strong>{{ r.name || displayPhone(r.number) }}</strong>
                <span class="wa-what">{{ WA_CATEGORY[r.category] || r.category }}<template v-if="r.label && r.label !== WA_CATEGORY[r.category]"> · {{ r.label }}</template></span>
              </span>
              <span class="wa-state" :class="r.status === 'sent' ? 'is-sent' : 'is-failed'">{{ r.status === 'sent' ? 'Terkirim' : 'Gagal' }}</span>
            </li>
          </ul>
          <router-link to="/dashboard/wa-log" class="wa-more">Lihat semua riwayat →</router-link>
        </section>

        <div class="wa-side">
          <!-- the bot -->
          <section class="wa-card status-card" aria-labelledby="wa-bot-title">
            <div class="wa-card-head">
              <h2 id="wa-bot-title">Status bot</h2>
              <span class="pill" :class="status.tone">{{ status.label }}</span>
            </div>
            <p class="wa-text">{{ status.text }}<template v-if="status.seen"> · kabar terakhir {{ status.seen }}</template></p>
            <p v-if="live.state.bot?.botVersion" class="wa-muted">Versi bot: {{ live.state.bot.botVersion }}</p>
            <p v-if="live.state.bot?.scheduleSource === 'file'" class="wa-note is-warn">
              Bot masih memakai jadwal lama dari <code>contacts.json</code>. Setelah Pengingat Guru benar dan pesan tes berhasil,
              ubah <code>WA_SCHEDULE_SOURCE=backend</code> di VM lalu restart bot.
            </p>
            <ul v-if="runs.length" class="wa-runs" aria-label="Pengingat guru terakhir">
              <li v-for="run in runs" :key="run.type"><span>{{ run.label }}</span><span>{{ run.value }}</span></li>
            </ul>
          </section>

          <!-- what still waits -->
          <section class="wa-card" aria-labelledby="wa-q-title">
            <div class="wa-card-head">
              <h2 id="wa-q-title">Antrean</h2>
              <span class="wa-muted">{{ queue?.summary.total || 0 }} pesan</span>
            </div>
            <p v-if="!queue?.items.length" class="wa-empty">Tidak ada antrean. Semua pesan sudah terkirim.</p>
            <ul v-else class="wa-queue">
              <li v-for="q in queue.items.slice(0, 6)" :key="`${q.source}:${q.id}`">
                <span class="wa-main">
                  <strong>{{ q.name || displayPhone(q.phone) }}</strong>
                  <span class="wa-what">{{ q.label || q.kind }}</span>
                </span>
                <span class="wa-when" :class="q.sendAt === 'now' ? 'is-now' : 'is-held'">{{ whenText(q) }}</span>
              </li>
            </ul>
            <router-link v-if="queue?.items.length" to="/dashboard/wa-log?tab=antrean" class="wa-more">
              {{ queue.items.length > 6 ? `Lihat ${queue.items.length - 6} lainnya →` : 'Kelola antrean →' }}
            </router-link>
          </section>
        </div>
      </div>
      <p class="wa-foot">{{ updatedText }}. Halaman ini memperbarui dirinya sendiri setiap beberapa detik selama dibuka.</p>
    </template>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import WaHubNav from '@/components/WaHubNav.vue'
import PageSkeleton from '@/components/PageSkeleton.vue'
import { useWaLive } from '@/composables/useWaLive'
import { botStatusOf, lastRunItems, WA_CATEGORY } from '@/utils/waBotStatus'
import { displayPhone } from '@/utils/santriProfile'

const live = useWaLive()
const today = computed(() => live.state.today)
const queue = computed(() => live.state.queue)
const feed = computed(() => live.state.feed.slice(0, 20))
const runs = computed(() => lastRunItems(live.state.bot?.lastRuns))
const categories = computed(() =>
  Object.entries(today.value.byCategory || {})
    .filter(([, n]) => n)
    .sort((a, b) => b[1] - a[1])
    .map(([key, n]) => ({ key, n, label: WA_CATEGORY[key] || key })),
)

const nowMs = ref(Date.now())
let clock = null
onMounted(() => { clock = setInterval(() => { nowMs.value = Date.now() }, 20000) })
onBeforeUnmount(() => clearInterval(clock))
const status = computed(() => botStatusOf(live.state.bot, Math.max(nowMs.value, live.state.updatedAt?.getTime() || 0)))

const clockOf = (d) => new Date(d.getTime() + 7 * 3600 * 1000).toISOString().slice(11, 19)
const timeOf = (iso) => (iso ? clockOf(new Date(iso)).slice(0, 5) : '')
const updatedText = computed(() => (live.state.updatedAt ? `Diperbarui ${clockOf(live.state.updatedAt)} WIB` : 'Memuat…'))
const whenText = (q) => (q.sendAt === 'now' ? (q.status === 'sending' ? 'Sedang dikirim' : 'Segera') : q.sendAt === 'morning_tomorrow' ? 'Besok 06:30' : 'Hari ini 06:30')

// a message that just arrived glows for a moment
const fresh = ref(new Set())
watch(() => live.state.tick, () => {
  const ids = live.state.lastRows.map((r) => r.id)
  if (!ids.length) return
  fresh.value = new Set([...fresh.value, ...ids])
  setTimeout(() => {
    const next = new Set(fresh.value)
    ids.forEach((id) => next.delete(id))
    fresh.value = next
  }, 4000)
})
</script>

<style scoped>
.wa-hub {
  color: #0b3b2a;
}

.wa-head h1 {
  margin: 0 0 4px;
  font-size: 1.6rem;
  font-weight: 800;
}

.wa-head p {
  margin: 0 0 14px;
  color: #475a50;
  line-height: 1.5;
}

.wa-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 14px;
}

.wa-stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 14px 16px;
  border-radius: 16px;
  background: #fff;
  border: 1px solid rgba(11, 59, 42, 0.12);
  color: #475a50;
  font-size: 0.85rem;
  text-decoration: none;
}

.wa-stat strong {
  font-size: 1.7rem;
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
  color: #0b3b2a;
}

.wa-stat.is-sent strong { color: #0f6b4a; }
.wa-stat.is-failed strong { color: #c62828; }
.wa-stat.is-failed.is-zero strong { color: #9aa8a0; }
.wa-stat.is-held strong { color: #b45309; }

.wa-stat:focus-visible,
.wa-more:focus-visible {
  outline: 3px solid #b45309;
  outline-offset: 2px;
}

.wa-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
  gap: 14px;
  align-items: start;
}

.wa-side {
  display: grid;
  gap: 14px;
}

.wa-card {
  padding: 16px;
  border-radius: 16px;
  background: #fff;
  border: 1px solid rgba(11, 59, 42, 0.12);
}

.wa-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 8px;
}

.wa-card h2 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 800;
}

.wa-live {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.78rem;
  font-weight: 700;
  color: #0f6b4a;
}

.wa-live-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #16a34a;
  animation: wa-blink 2s ease-in-out infinite;
}

@keyframes wa-blink {
  50% { opacity: 0.35; }
}

.wa-cats {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 12px;
  margin: 0 0 8px;
  font-size: 0.8rem;
  color: #5b6b62;
}

.wa-cats strong {
  color: #0b3b2a;
}

.wa-feed,
.wa-queue,
.wa-runs {
  list-style: none;
  margin: 0;
  padding: 0;
}

.wa-row {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  padding: 9px 6px;
  border-top: 1px solid rgba(11, 59, 42, 0.08);
  border-radius: 8px;
  transition: background-color 0.6s ease;
}

.wa-row.is-new {
  background: #e7f6ee;
}

.wa-time {
  font-size: 0.8rem;
  color: #5b6b62;
  font-variant-numeric: tabular-nums;
}

.wa-main {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.wa-main strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.92rem;
}

.wa-what {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.78rem;
  color: #5b6b62;
}

.wa-state {
  font-size: 0.78rem;
  font-weight: 700;
}

.wa-state.is-sent { color: #0f6b4a; }
.wa-state.is-failed { color: #c62828; }

.wa-queue li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 9px 0;
  border-top: 1px solid rgba(11, 59, 42, 0.08);
}

.wa-when {
  flex: none;
  font-size: 0.78rem;
  font-weight: 700;
}

.wa-when.is-now { color: #0f6b4a; }
.wa-when.is-held { color: #b45309; }

.wa-runs {
  display: grid;
  gap: 6px;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid rgba(11, 59, 42, 0.08);
  font-size: 0.82rem;
}

.wa-runs li {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 2px 10px;
}

.wa-runs li span:first-child {
  font-weight: 700;
}

.wa-runs li span:last-child {
  color: #5b6b62;
  font-variant-numeric: tabular-nums;
}

.wa-text {
  margin: 0;
  font-size: 0.9rem;
  color: #475a50;
}

.wa-muted {
  margin: 4px 0 0;
  font-size: 0.8rem;
  color: #5b6b62;
}

.wa-note {
  margin: 10px 0 0;
  padding: 10px 12px;
  border-radius: 10px;
  font-size: 0.85rem;
  line-height: 1.5;
}

.wa-note.is-warn {
  background: #fffbeb;
  color: #5b3a06;
  border: 1px solid #f3d58b;
}

.pill {
  flex: none;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 700;
}

.pill.ok { background: rgba(46, 125, 50, 0.12); color: #0f6b4a; }
.pill.warn { background: rgba(239, 108, 0, 0.12); color: #b45309; }
.pill.danger { background: rgba(211, 47, 47, 0.12); color: #c62828; }
.pill.neutral { background: #eef2ef; color: #475a50; }

.wa-empty {
  margin: 6px 0;
  font-size: 0.88rem;
  color: #5b6b62;
}

.wa-more {
  display: inline-block;
  margin-top: 10px;
  font-weight: 700;
  font-size: 0.88rem;
  color: #0a5c40;
  text-decoration: none;
}

.wa-foot {
  margin: 14px 0 0;
  text-align: center;
  font-size: 0.8rem;
  color: #5b6b62;
}

@media (max-width: 900px) {
  .wa-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 560px) {
  .wa-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (prefers-reduced-motion: reduce) {
  .wa-live-dot { animation: none; }
  .wa-row { transition: none; }
}
</style>
