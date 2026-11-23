<template>
  <div class="wp-wrap">
    <div class="wp-grid">
      <!-- Left: Copy + Interactive Feature Tabs -->
      <div class="wp-copy">
        <span class="wp-badge">
          <span class="wp-badge-dot" aria-hidden="true"></span>
          Portal Wali Santri Online
        </span>
        <h3 class="wp-title">
          Pantau Mengaji Ananda Langsung dari HP, Tanpa Instal Aplikasi
        </h3>
        <p class="wp-lead">
          Cukup masuk dengan nomor WhatsApp terdaftar. Orang tua bisa melihat
          kehadiran harian, halaman bacaan terakhir, hingga mengajukan izin
          sakit dalam sekali ketuk.
        </p>

        <div class="wp-tabs" role="tablist" aria-label="Fitur Portal Wali Santri">
          <button
            v-for="(tab, idx) in TABS"
            :key="tab.id"
            :id="`wp-tab-${tab.id}`"
            type="button"
            role="tab"
            class="wp-tab"
            :aria-selected="activeTab === idx"
            :aria-controls="`wp-panel-${tab.id}`"
            @click="activeTab = idx"
          >
            <span class="wp-tab-ico" aria-hidden="true">
              <svg v-if="tab.id === 'progres'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <svg v-else-if="tab.id === 'izin'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </span>
            <span class="wp-tab-text">
              <strong>{{ tab.title }}</strong>
              <small>{{ tab.desc }}</small>
            </span>
          </button>
        </div>

        <div class="wp-cta-row">
          <router-link to="/wali" class="lp-btn-gold wp-cta-btn">
            <span>Buka Portal Wali Santri</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </router-link>
          <span class="wp-cta-note">Khusus wali santri &amp; pendaftar TPQ Amanah</span>
        </div>
      </div>

      <!-- Right: Realistic Mini Phone Preview (reflects actual Wali Portal UI) -->
      <div class="wp-stage">
        <div class="wp-phone">
          <div class="wp-phone-bar">
            <span class="wp-phone-brand">TPQ Amanah · Portal Wali</span>
            <span class="wp-phone-pill">Live</span>
          </div>

          <div
            :id="`wp-panel-${TABS[activeTab].id}`"
            role="tabpanel"
            :aria-labelledby="`wp-tab-${TABS[activeTab].id}`"
            class="wp-phone-screen"
          >
            <!-- Tab 0: Progres & Kehadiran -->
            <div v-if="activeTab === 0" key="progres" class="wp-pane">
              <div class="wp-child-head">
                <div>
                  <strong>Ahmad Rayhan</strong>
                  <span>Jilid 4 · Sesi Sore</span>
                </div>
                <span class="wp-chip is-ok">Hadir hari ini</span>
              </div>

              <div class="wp-material-box">
                <span class="wp-mat-label">Materi terakhir · Sen, 23 Nov</span>
                <strong>Buku At-Tartil Jilid 4 Hal. 18</strong>
                <small>Hafalan: Surat Al-Ma'un ayat 1–7</small>
              </div>

              <div class="wp-kpi-row">
                <div class="wp-kpi">
                  <strong class="is-ok">18</strong>
                  <span>Hadir</span>
                </div>
                <div class="wp-kpi">
                  <strong class="is-info">1</strong>
                  <span>Izin</span>
                </div>
                <div class="wp-kpi">
                  <strong class="is-warn">0</strong>
                  <span>Sakit</span>
                </div>
                <div class="wp-kpi">
                  <strong class="is-muted">0</strong>
                  <span>Alfa</span>
                </div>
              </div>

              <div class="wp-log-row">
                <span><strong>Senin, 23 Nov</strong> · Sesi Sore</span>
                <span class="wp-chip is-ok">● Hadir</span>
              </div>
            </div>

            <!-- Tab 1: Izin & Sakit Online -->
            <div v-else-if="activeTab === 1" key="izin" class="wp-pane">
              <div class="wp-child-head">
                <div>
                  <strong>Izin / Sakit Ananda</strong>
                  <span>Langsung tercatat tanpa menunggu</span>
                </div>
              </div>

              <div class="wp-izin-card">
                <div class="wp-izin-top">
                  <strong>Ahmad Rayhan</strong>
                  <span class="wp-chip is-warn">Sakit</span>
                </div>
                <span class="wp-izin-date">Selasa, 24 Nov · Sesi Sore (1 hari)</span>
                <p class="wp-izin-reason">"Demam ringan, istirahat di rumah"</p>
              </div>

              <div class="wp-confirm-box">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Sudah tercatat di Absen Santri &amp; guru Jilid 4 langsung menerima kabar via WhatsApp.</span>
              </div>
            </div>

            <!-- Tab 2: Notifikasi WhatsApp Otomatis -->
            <div v-else key="wa" class="wp-pane">
              <div class="wp-wa-head">
                <span class="wp-wa-avatar" aria-hidden="true">TA</span>
                <div>
                  <strong>Bot Resmi TPQ Amanah</strong>
                  <span>WhatsApp Terverifikasi</span>
                </div>
              </div>

              <div class="wp-wa-bubble">
                <p class="wp-wa-title">Assalamu'alaikum, Bapak/Ibu Wali</p>
                <p>
                  Kabar dari <strong>TPQ Amanah Sawotratap</strong>: ananda
                  <strong>Ahmad Rayhan</strong> hari ini telah menyelesaikan
                  bacaan <em>At-Tartil Jilid 4 Hal. 18</em> dengan lancar.
                </p>
                <p class="wp-wa-foot">
                  Lihat detail progres &amp; E-Kitab di Portal Wali.
                </p>
                <span class="wp-wa-time">17:02 WIB ✓✓</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const TABS = [
  {
    id: 'progres',
    title: 'Progres & Kehadiran Harian',
    desc: 'Pantau status hadir, halaman At-Tartil terakhir, dan hafalan ananda setiap hari.',
  },
  {
    id: 'izin',
    title: 'Izin / Sakit Online 1 Ketuk',
    desc: 'Berhalangan hadir? Kabari guru dari HP; langsung masuk Absen Santri & dikunci aman.',
  },
  {
    id: 'wa',
    title: 'Notifikasi WhatsApp Otomatis',
    desc: 'Kabar kehadiran, pengumuman TPQ, hingga status pendaftaran dikirim langsung ke WA wali.',
  },
]

const activeTab = ref(0)
</script>

<style scoped>
.wp-wrap {
  margin-top: 2.5rem;
  padding: 1.5rem;
  border-radius: 1.75rem;
  border: 1px solid rgba(252, 211, 77, 0.28);
  background: linear-gradient(155deg, rgba(255, 255, 255, 0.065), rgba(2, 44, 30, 0.42));
}

@media (min-width: 640px) {
  .wp-wrap {
    padding: 2rem;
  }
}

@media (min-width: 1024px) {
  .wp-wrap {
    padding: 2.5rem;
  }
}

.wp-grid {
  display: grid;
  gap: 2rem;
  align-items: center;
}

@media (min-width: 1024px) {
  .wp-grid {
    grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr);
    gap: 2.5rem;
  }
}

.wp-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 5px 12px;
  border-radius: 999px;
  border: 1px solid rgba(252, 211, 77, 0.35);
  background: rgba(252, 211, 77, 0.12);
  color: #fde68a;
  font-size: 0.76rem;
  font-weight: 700;
}

.wp-badge-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #34d399;
}

.wp-title {
  margin: 0.9rem 0 0.5rem;
  font-size: clamp(1.35rem, 1.1rem + 1vw, 1.8rem);
  font-weight: 800;
  line-height: 1.22;
  color: #fff;
  text-wrap: balance;
}

.wp-lead {
  margin: 0 0 1.25rem;
  font-size: 0.92rem;
  line-height: 1.6;
  color: rgba(236, 253, 245, 0.84);
}

.wp-tabs {
  display: grid;
  gap: 8px;
}

.wp-tab {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  width: 100%;
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px solid rgba(252, 211, 77, 0.16);
  background: rgba(255, 255, 255, 0.04);
  color: #ecfdf5;
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease;
}

.wp-tab:hover {
  background: rgba(255, 255, 255, 0.08);
}

.wp-tab[aria-selected="true"] {
  background: rgba(252, 211, 77, 0.14);
  border-color: rgba(252, 211, 77, 0.65);
}

.wp-tab-ico {
  flex: none;
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  background: rgba(252, 211, 77, 0.14);
  color: #fcd34d;
}

.wp-tab-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.wp-tab-text strong {
  font-size: 0.92rem;
  font-weight: 700;
  color: #fff;
}

.wp-tab-text small {
  font-size: 0.79rem;
  line-height: 1.45;
  color: rgba(236, 253, 245, 0.78);
}

.wp-cta-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px 14px;
  margin-top: 1.35rem;
}

.wp-cta-btn {
  padding: 0 1.35rem;
}

.wp-cta-note {
  font-size: 0.78rem;
  color: rgba(236, 253, 245, 0.72);
}

/* Right: Realistic Phone Preview */
.wp-stage {
  display: flex;
  justify-content: center;
}

.wp-phone {
  width: 100%;
  max-width: 360px;
  border-radius: 24px;
  background: #fbf9f3;
  color: #0b3b2a;
  border: 2px solid rgba(252, 211, 77, 0.45);
  box-shadow: 0 26px 48px -24px rgba(0, 0, 0, 0.6);
  overflow: hidden;
}

.wp-phone-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #03291d;
  color: #fff;
}

.wp-phone-brand {
  font-size: 0.8rem;
  font-weight: 800;
  color: #fef3c7;
}

.wp-phone-pill {
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(52, 211, 153, 0.2);
  color: #6ee7b7;
  font-size: 0.68rem;
  font-weight: 800;
}

.wp-phone-screen {
  padding: 16px;
  min-height: 274px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.wp-pane {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.wp-child-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.wp-child-head strong {
  display: block;
  font-size: 0.98rem;
  font-weight: 800;
  color: #0b3b2a;
}

.wp-child-head span {
  font-size: 0.76rem;
  color: #5b6b62;
}

.wp-chip {
  display: inline-flex;
  align-items: center;
  padding: 3px 9px;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 700;
  white-space: nowrap;
}

.wp-chip.is-ok { background: #dcfce7; color: #166534; }
.wp-chip.is-warn { background: #fef3c7; color: #92400e; }

.wp-material-box {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 11px 13px;
  border-radius: 14px;
  background: #fef9e7;
  border: 1px solid #f3d58b;
}

.wp-mat-label {
  font-size: 0.7rem;
  font-weight: 700;
  color: #7c3a0d;
}

.wp-material-box strong {
  font-size: 0.88rem;
  font-weight: 800;
  color: #0b3b2a;
}

.wp-material-box small {
  font-size: 0.74rem;
  color: #475a50;
}

.wp-kpi-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 6px;
}

.wp-kpi {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 4px;
  border-radius: 12px;
  background: #fff;
  border: 1px solid rgba(11, 59, 42, 0.1);
}

.wp-kpi strong {
  font-size: 1.05rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
}

.wp-kpi strong.is-ok { color: #0a5c40; }
.wp-kpi strong.is-info { color: #0369a1; }
.wp-kpi strong.is-warn { color: #b45309; }
.wp-kpi strong.is-muted { color: #64748b; }

.wp-kpi span {
  font-size: 0.68rem;
  font-weight: 600;
  color: #5b6b62;
  margin-top: 2px;
}

.wp-log-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 9px 12px;
  border-radius: 12px;
  background: #fff;
  border: 1px solid rgba(11, 59, 42, 0.1);
  font-size: 0.76rem;
  color: #475a50;
}

.wp-log-row strong {
  color: #0b3b2a;
}

.wp-izin-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 13px;
  border-radius: 14px;
  background: #fff;
  border: 1px solid rgba(11, 59, 42, 0.12);
}

.wp-izin-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.wp-izin-top strong {
  font-size: 0.9rem;
  color: #0b3b2a;
}

.wp-izin-date {
  font-size: 0.74rem;
  font-weight: 600;
  color: #5b6b62;
}

.wp-izin-reason {
  margin: 4px 0 0;
  font-size: 0.82rem;
  color: #0b3b2a;
}

.wp-confirm-box {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 12px;
  background: #e9f5ef;
  border: 1px solid rgba(10, 92, 64, 0.25);
  color: #0a5c40;
  font-size: 0.76rem;
  font-weight: 600;
  line-height: 1.45;
}

.wp-confirm-box svg {
  flex: none;
  margin-top: 2px;
}

.wp-wa-head {
  display: flex;
  align-items: center;
  gap: 10px;
}

.wp-wa-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: #0a5c40;
  color: #fcd34d;
  font-size: 0.76rem;
  font-weight: 800;
  flex: none;
}

.wp-wa-head strong {
  display: block;
  font-size: 0.84rem;
  color: #0b3b2a;
}

.wp-wa-head span {
  font-size: 0.7rem;
  color: #0a5c40;
  font-weight: 600;
}

.wp-wa-bubble {
  padding: 12px 13px;
  border-radius: 4px 14px 14px 14px;
  background: #e7f6ec;
  border: 1px solid rgba(10, 92, 64, 0.16);
  font-size: 0.78rem;
  line-height: 1.5;
  color: #103224;
}

.wp-wa-bubble p {
  margin: 0 0 6px;
}

.wp-wa-title {
  font-weight: 800;
  color: #0b3b2a;
}

.wp-wa-foot {
  margin-bottom: 4px !important;
  color: #2f5c48;
  font-weight: 600;
}

.wp-wa-time {
  display: block;
  text-align: right;
  font-size: 0.68rem;
  font-weight: 700;
  color: #0a5c40;
}

.wp-tab:focus-visible {
  outline: 2.5px solid #fcd34d;
  outline-offset: 2px;
}
</style>
