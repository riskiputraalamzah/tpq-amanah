<template>
  <div class="wv" :class="{ 'is-guru': !isAdmin }">
    <header class="wv-head">
      <div>
        <h1>Data Wali Santri</h1>
        <p>Tautkan wali dengan santri lewat kode, lalu cek data yang mereka isi.</p>
      </div>
      <div class="wv-head-actions">
        <!-- the full data (NIK / KK in full): admin only -->
        <button v-if="isAdmin" type="button" class="wv-btn wv-btn-ghost" :disabled="exporting || !visibleRows.length" @click="exportExcel">
          <LineIcon name="table" :size="17" /> {{ exporting ? 'Menyiapkan…' : 'Export Excel' }}
        </button>
        <button v-if="slipClassOptions.length" type="button" class="wv-btn wv-btn-primary" @click="openSlips">
          <LineIcon name="file" :size="17" /> Cetak slip kode
        </button>
      </div>
    </header>

    <!-- a guru works with the jilid they look after; say which and where that comes from -->
    <p v-if="scope && !isAdmin && scope.source === 'none'" class="wv-note is-warn wv-scope" role="status">
      Jilid yang Antum ampu belum diatur admin dan belum ada riwayat KBM. Minta admin mengaturnya di menu Kelola Pengajar.
    </p>
    <p v-else-if="scope && !isAdmin && scope.source === 'feature'" class="wv-note wv-scope">
      Antum diberi akses ke <strong>semua jilid</strong> oleh admin. NIK, KK, dan verifikasi data hanya untuk jilid yang Antum ampu.
    </p>
    <p v-else-if="scope && !isAdmin" class="wv-note wv-scope">
      Jilid Antum: <strong>{{ scopeLabel }}</strong>.
      <template v-if="scope.source === 'kbm'"> Diambil dari riwayat KBM 60 hari terakhir, belum ditetapkan admin.</template>
    </p>

    <!-- summary (clickable quick-jumps) -->
    <section class="wv-summary" aria-label="Ringkasan">
      <button type="button" class="wv-stat" @click="jumpSummary('all')">
        <strong>{{ stats.linked }}/{{ rows.length }}</strong><span>santri tertaut wali</span>
      </button>
      <button type="button" class="wv-stat" @click="jumpSummary('verified')">
        <strong>{{ stats.verified }}</strong><span>data terverifikasi</span>
      </button>
      <button type="button" class="wv-stat" :class="{ 'is-attn': stats.toCheck }" @click="jumpSummary('tocheck')">
        <strong>{{ stats.toCheck }}</strong><span>menunggu dicek</span>
      </button>
      <button type="button" class="wv-stat" :class="{ 'is-attn': requests.length }" @click="tab = 'requests'">
        <strong>{{ requests.length }}</strong><span>pengajuan tautan</span>
      </button>
    </section>

    <div class="wv-tabs" role="tablist">
      <button type="button" role="tab" :aria-selected="tab === 'santri'" :class="{ active: tab === 'santri' }" @click="tab = 'santri'">Santri</button>
      <button type="button" role="tab" :aria-selected="tab === 'requests'" :class="{ active: tab === 'requests' }" @click="tab = 'requests'">
        Pengajuan <span v-if="requests.length" class="wv-count">{{ requests.length }}</span>
      </button>
      <button v-if="isAdmin" type="button" role="tab" :aria-selected="tab === 'alfa'" :class="{ active: tab === 'alfa' }" @click="openAlfa">Kabar alfa</button>
    </div>

    <PageSkeleton v-if="loading" :rows="6" label="Memuat data wali santri" />
    <p v-else-if="loadError" class="wv-note is-danger" role="alert">{{ loadError }}</p>

    <!-- santri -->
    <template v-else-if="tab === 'santri'">
      <div class="wv-toolbar">
        <div class="wv-search-row">
          <div class="wv-search-box">
            <svg class="wv-search-ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <label class="sr-only" for="wv-search">Cari nama</label>
            <input id="wv-search" v-model="search" type="search" class="wv-input wv-search-input" placeholder="Cari nama santri…" />
          </div>
          <button
            type="button"
            class="wv-filter-toggle"
            :aria-expanded="controlsOpen"
            :class="{ 'has-active': activeControlCount > 0 }"
            @click="controlsOpen = !controlsOpen"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" />
              <line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" />
              <line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" />
              <line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" />
            </svg>
            <span>Filter</span>
            <span v-if="activeControlCount" class="wv-filter-badge">{{ activeControlCount }}</span>
          </button>
        </div>

        <!-- Single-row horizontal-scroll status strip (replaces 3 wrapping rows of pills) -->
        <div class="wv-chips" role="group" aria-label="Saring status">
          <button
            v-for="f in STATUS_FILTERS"
            :key="f.value"
            type="button"
            class="wv-chip"
            :aria-pressed="statusFilter === f.value"
            @click="statusFilter = f.value"
          >
            {{ f.label }} <span>{{ countFor(f.value) }}</span>
          </button>
        </div>

        <!-- Compact dropdowns for Jilid, Urutkan, Kelompokkan (always inline on desktop; collapsible on mobile) -->
        <div class="wv-controls-panel" :class="{ 'is-open': controlsOpen }">
          <label v-if="classOptions.length > 1" class="wv-ctrl-field" for="wv-class">
            <span>Jilid</span>
            <select id="wv-class" v-model="classFilter" class="wv-select">
              <option value="">{{ isAdmin ? 'Semua jilid' : 'Semua jilid saya' }}</option>
              <option v-for="c in classOptions" :key="c.value" :value="c.value">{{ c.label }}</option>
            </select>
          </label>
          <label class="wv-ctrl-field" for="wv-sort">
            <span>Urutkan</span>
            <select id="wv-sort" v-model="sortBy" class="wv-select">
              <option v-for="s in SORTS" :key="s.value" :value="s.value">{{ s.label }}</option>
            </select>
          </label>
          <label class="wv-ctrl-field" for="wv-group">
            <span>Kelompokkan</span>
            <select id="wv-group" :value="groupBy" class="wv-select" @change="setGroupBy($event.target.value)">
              <option v-for="o in GROUPINGS" :key="o.value" :value="o.value">{{ o.label }}</option>
            </select>
          </label>
          <label v-if="groupBy === 'phone'" class="wv-check wv-groupby-only">
            <input v-model="onlyShared" type="checkbox" /> Hanya nomor dengan lebih dari 1 santri
          </label>
        </div>

        <!-- Active non-default filter summary pills on mobile when panel is collapsed -->
        <div v-if="!controlsOpen && activeControlCount" class="wv-active-tags">
          <button v-if="classFilter" type="button" class="wv-tag-clear" @click="classFilter = ''">
            {{ levelName(classFilter) }} ×
          </button>
          <button v-if="sortBy !== 'newest'" type="button" class="wv-tag-clear" @click="sortBy = 'newest'">
            Urut: {{ SORTS.find((s) => s.value === sortBy)?.label }} ×
          </button>
          <button v-if="groupBy !== 'none'" type="button" class="wv-tag-clear" @click="setGroupBy('none')">
            {{ GROUPINGS.find((g) => g.value === groupBy)?.label }} ×
          </button>
        </div>
      </div>

      <p v-if="statusFilter === 'remind' && visibleRows.length" class="wv-note">
        Wali sudah tertaut, tapi datanya belum diisi, belum selesai, atau perlu diperbaiki. Tekan <strong>Ingatkan</strong>: WA bot TPQ yang mengirim pengingat ke wali.
      </p>
      <p v-if="!groupedRows.length" class="wv-empty">{{ statusFilter === 'remind' ? 'Tidak ada wali yang perlu diingatkan.' : 'Tidak ada santri yang cocok.' }}</p>
      <section v-for="grp in groupedRows" v-else :key="grp.key" class="wv-block" :aria-label="grp.title || 'Daftar santri'">
      <h3 v-if="grp.title" class="wv-block-title">{{ grp.title }} <span>{{ grp.note }}</span></h3>
      <ul class="wv-list">
        <li v-for="r in grp.rows" :key="`${grp.key}-${r.santriId}`" class="wv-row">
          <div class="wv-row-main">
            <strong>{{ r.name }}</strong>
            <span class="wv-sub">
              {{ levelName(r.classId) }}<template v-if="r.nomorInduk"> · {{ r.nomorInduk }}</template>
              <template v-if="rowTime(r)"> · <time :title="fullDateTime(rowTime(r).at)">{{ rowTime(r).label }} {{ timeAgo(rowTime(r).at, now) }}</time></template>
            </span>
            <span v-if="r.guardians.length" class="wv-sub">
              Wali: <template v-for="(g, i) in r.guardians" :key="g.waliId">{{ i ? ', ' : '' }}{{ relationLabel(g.relation) }} {{ displayPhone(g.phone) }}</template>
            </span>
            <span v-else class="wv-sub is-muted">Belum ada wali tertaut</span>
            <span v-if="r.lastReminder" class="wv-sub wv-reminded">{{ reminderText(r.lastReminder) }}</span>
            <span v-if="routingText(r)" class="wv-sub wv-routing" :class="{ 'is-admin': r.routing.status === 'escalated' }">{{ routingText(r) }}</span>
          </div>
          <div class="wv-row-side">
            <span class="wv-pill" :class="`is-${(STATUS[r.profileStatus] || STATUS.empty).tone}`">
              {{ (STATUS[r.profileStatus] || STATUS.empty).label }}
            </span>
            <span v-if="r.hasPendingIdentity" class="wv-pill is-warn">Ubah identitas</span>
            <div class="wv-actions">
              <button v-if="canAct(r.classId) && r.guardians.length < 2" type="button" class="wv-btn wv-btn-ghost" @click="makeCode(r)">
                <LineIcon name="link" :size="16" /> Kode
              </button>
              <button v-if="canAct(r.classId) && needsReminder(r)" type="button" class="wv-btn wv-btn-ghost wv-btn-remind" @click="openRemind(r)">
                Ingatkan
              </button>
              <button v-if="r.profileStatus !== 'empty'" type="button" class="wv-btn wv-btn-primary" @click="openReview(r)">
                Tinjau
              </button>
            </div>
          </div>
        </li>
      </ul>
      </section>
    </template>

    <!-- kabar alfa: the bot tells the wali when their child was alfa (admin) -->
    <template v-else-if="tab === 'alfa'">
      <PageSkeleton v-if="!alfa" :rows="3" label="Memuat kabar alfa" />
      <template v-else>
        <section class="wv-card wv-alfa-switch" aria-labelledby="alfa-title">
          <div class="wv-alfa-head">
            <div>
              <h2 id="alfa-title">Kabar alfa ke wali</h2>
              <span class="wv-pill" :class="alfa.enabled ? 'is-ok' : 'is-idle'">{{ alfa.enabled ? 'Aktif' : 'Dijeda' }}</span>
            </div>
            <button type="button" class="wv-btn" :class="alfa.enabled ? 'wv-btn-ghost' : 'wv-btn-primary'" :disabled="alfaBusy" @click="toggleAlfa">
              {{ alfa.enabled ? 'Jeda pengiriman' : 'Aktifkan' }}
            </button>
          </div>
          <p class="wv-sub">
            Bot TPQ mengirim WhatsApp ke wali yang tertaut bila ananda tercatat <strong>alfa</strong> di KBM:
            {{ alfa.rules.graceMinutes }} menit setelah guru terakhir menyimpan KBM (koreksi status membatalkan),
            tidak di jam {{ alfa.rules.quietFrom }}–{{ alfa.rules.quietUntil }}, untuk KBM paling lama {{ alfa.rules.lookbackDays }} hari lalu,
            maksimal {{ alfa.today.cap }} pesan sehari.
          </p>
          <p class="wv-alfa-today"><strong>{{ alfa.today.used }}/{{ alfa.today.cap }}</strong> pesan hari ini</p>
          <!-- a sent kabar whose record is no longer alfa: the apology goes at once when it is changed; this is the sweep -->
          <button type="button" class="wv-btn wv-btn-ghost" :disabled="alfaBusy" @click="sendCorrections">Kirim permintaan maaf yang tertunda</button>
        </section>

        <h2 class="wv-section">7 hari terakhir</h2>
        <p v-if="!alfa.notices.length" class="wv-empty">Belum ada kabar alfa.</p>
        <ul v-else class="wv-list">
          <li v-for="n in alfa.notices" :key="n.id" class="wv-row wv-alfa-row">
            <div class="wv-row-main">
              <strong>{{ n.santriName }}</strong>
              <span class="wv-sub">KBM {{ dateText(`${n.sessionDate}T12:00:00`) }}<template v-if="n.classId"> · {{ levelName(n.classId) }}</template><template v-if="n.guruName"> · {{ n.guruName }}</template></span>
              <span class="wv-sub">
                <template v-for="(rc, i) in n.recipients" :key="rc.phone">{{ i ? ', ' : '' }}{{ relationLabel(rc.relation) }} {{ displayPhone(rc.phone) }}<template v-if="rc.status === 'failed'"> (gagal)</template></template>
              </span>
            </div>
            <div class="wv-row-side">
              <span class="wv-pill" :class="`is-${(ALFA_STATUS[n.status] || ALFA_STATUS.queued).tone}`">{{ (ALFA_STATUS[n.status] || ALFA_STATUS.queued).label }}</span>
              <span v-if="n.correctedAt" class="wv-sub">{{ n.correctedBy === 'report' ? 'Dibetulkan dari laporan wali' : `Dikoreksi${n.correctedTo ? ` jadi ${n.correctedTo}` : ' (dikosongkan)'}, permintaan maaf dikirim` }}</span>
              <!-- not sent by the bot: the admin can send the same message by hand -->
              <div v-if="['skipped_cap', 'failed', 'partial'].includes(n.status)" class="wv-actions">
                <a v-for="rc in n.recipients.filter((x) => x.status !== 'sent')" :key="rc.phone" class="wv-btn wv-btn-ghost"
                  :href="waTo(rc.phone, n.text)" target="_blank" rel="noopener">Kirim manual ke {{ relationLabel(rc.relation) }}</a>
              </div>
            </div>
          </li>
        </ul>
      </template>
    </template>

    <!-- link requests -->
    <template v-else>
      <p v-if="!requests.length" class="wv-empty">Tidak ada pengajuan tautan.</p>
      <article v-for="q in requests" :key="q.id" class="wv-card wv-request">
        <div class="wv-request-head">
          <strong>{{ q.childName }}</strong>
          <span class="wv-sub">{{ q.classId ? levelName(q.classId) : 'Jilid tidak diisi' }} · {{ relationLabel(q.relation) }} {{ q.waliName || '' }}</span>
          <span class="wv-sub">WA {{ displayPhone(q.phone) }} · <time :title="fullDateTime(q.createdAt)">{{ timeAgo(q.createdAt, now) }}</time></span>
          <p v-if="q.note" class="wv-quote">"{{ q.note }}"</p>
        </div>
        <label class="wv-label" :for="`req-${q.id}`">Santri yang dimaksud</label>
        <select :id="`req-${q.id}`" v-model="choice[q.id]" class="wv-input">
          <option value="">Pilih santri…</option>
          <option v-for="s in candidatesFor(q)" :key="s.santriId" :value="s.santriId">
            {{ s.name }} · {{ levelName(s.classId) }}{{ s.guardians.length >= 2 ? ' (sudah 2 wali)' : '' }}
          </option>
        </select>
        <div v-if="canAct(q.classId)" class="wv-request-actions">
          <button type="button" class="wv-btn wv-btn-ghost is-danger" :disabled="busy" @click="decide(q, false)">Tolak</button>
          <button type="button" class="wv-btn wv-btn-primary" :disabled="busy || !choice[q.id]" @click="decide(q, true)">Tautkan</button>
        </div>
        <p v-else class="wv-sub">Diproses oleh guru jilidnya atau admin.</p>
      </article>
    </template>

    <!-- the KK photo (private): shown here, never as a public link -->
    <Teleport to="body">
      <div v-if="kkView" class="wv-overlay wv-overlay-top" @click.self="kkView = null" @keydown.esc="kkView = null">
        <section class="wv-sheet wv-kk" role="dialog" aria-modal="true" aria-labelledby="kk-title">
          <header class="wv-sheet-head">
            <h3 id="kk-title">Foto KK · {{ kkView.name }}</h3>
            <button type="button" class="wv-close" aria-label="Tutup" @click="kkView = null"><LineIcon name="x" :size="18" /></button>
          </header>
          <div class="wv-sheet-body">
            <img :src="kkView.url" :alt="`Foto Kartu Keluarga ${kkView.name}`" class="wv-kk-img" />
            <a class="wv-btn wv-btn-ghost" :href="kkView.url" :download="`KK-${kkView.name}.jpg`">Unduh foto</a>
          </div>
        </section>
      </div>
    </Teleport>

    <!-- reminder to the linked wali, sent by the TPQ bot (POST /wali/admin/reminders/send) -->
    <Teleport to="body">
      <div v-if="remind" class="wv-overlay" @click.self="remind = null">
        <section class="wv-sheet" role="dialog" aria-modal="true" aria-labelledby="remind-title">
          <header class="wv-sheet-head">
            <div>
              <h3 id="remind-title">Ingatkan wali {{ remind.name }}</h3>
              <span class="wv-pill" :class="`is-${(STATUS[remind.profileStatus] || STATUS.empty).tone}`">{{ (STATUS[remind.profileStatus] || STATUS.empty).label }}</span>
            </div>
            <button type="button" class="wv-close" aria-label="Tutup" @click="remind = null"><LineIcon name="x" :size="18" /></button>
          </header>
          <div class="wv-sheet-body">
            <p v-if="remind.lastReminder" class="wv-note is-warn">{{ reminderText(remind.lastReminder) }}. Beri jeda beberapa hari sebelum mengingatkan lagi.</p>
            <p class="wv-label">Dikirim ke</p>
            <ul class="wv-remind-to">
              <li v-for="g in remind.guardians" :key="g.waliId">{{ relationLabel(g.relation) }} · {{ displayPhone(g.phone) }}</li>
            </ul>
            <p class="wv-label">Pesan</p>
            <p class="wv-message">{{ remindMessage }}</p>
            <p v-if="remindError" class="wv-note is-danger" role="alert">{{ remindError }}</p>
            <button type="button" class="wv-btn wv-btn-wa" :disabled="busy" @click="sendReminder(remind)">
              {{ busy ? 'Mengirim…' : 'Kirim lewat WA bot TPQ' }}
            </button>
            <p class="wv-sub wv-center">Dikirim otomatis oleh nomor WA TPQ. Malam hari (21.00–06.30) dikirim besok pagi. Cek di Pusat WhatsApp.</p>
          </div>
        </section>
      </div>
    </Teleport>

    <!-- code for one santri -->
    <Teleport to="body">
      <div v-if="codeSheet" class="wv-overlay" @click.self="codeSheet = null">
        <section class="wv-sheet" role="dialog" aria-modal="true" aria-labelledby="code-title">
          <header class="wv-sheet-head">
            <h3 id="code-title">Kode untuk {{ codeSheet.santriName }}</h3>
            <button type="button" class="wv-close" aria-label="Tutup" @click="codeSheet = null"><LineIcon name="x" :size="18" /></button>
          </header>
          <div class="wv-sheet-body">
            <p class="wv-code">{{ codeSheet.code }}</p>
            <p class="wv-sub wv-center">Berlaku sampai {{ dateTimeText(codeSheet.expiresAt) }}. Kode lama santri ini tidak berlaku lagi.</p>
            <!-- sent by the TPQ bot to the number typed here (POST /wali/admin/codes/send) -->
            <form class="wv-code-send" @submit.prevent="sendCode">
              <label for="code-phone" class="wv-label">Nomor WhatsApp wali</label>
              <div v-if="codeSheet.guardians?.length" class="wv-code-known">
                <button v-for="g in codeSheet.guardians" :key="g.waliId" type="button" class="wv-chip" :class="{ 'is-active': samePhone(codePhone, g.phone) }"
                  @click="codePhone = displayPhone(g.phone)">
                  {{ relationLabel(g.relation) }} · {{ displayPhone(g.phone) }}
                </button>
              </div>
              <input id="code-phone" v-model="codePhone" class="wv-input" type="tel" inputmode="tel" autocomplete="off" placeholder="Contoh: 0812 3456 7890" />
              <p v-if="codeError" class="wv-note is-danger" role="alert">{{ codeError }}</p>
              <p v-if="codeSentTo.length" class="wv-note is-ok" role="status">Masuk antrean WA bot: {{ codeSentTo.join(', ') }}</p>
              <button type="submit" class="wv-btn wv-btn-wa" :disabled="busy || !codePhone.trim()">
                {{ busy ? 'Mengirim…' : 'Kirim lewat WA bot TPQ' }}
              </button>
            </form>
            <p class="wv-sub wv-center">Dikirim japri oleh nomor WA TPQ. Malam hari (21.00–06.30) dikirim besok pagi.</p>
            <button type="button" class="wv-btn wv-btn-ghost" @click="copyMessage(codeSheet)">{{ copied ? 'Pesan tersalin ✓' : 'Salin pesan' }}</button>
          </div>
        </section>
      </div>
    </Teleport>

    <!-- slips for a jilid -->
    <Teleport to="body">
      <div v-if="slipOpen" class="wv-overlay" @click.self="slipOpen = false">
        <section class="wv-sheet" role="dialog" aria-modal="true" aria-labelledby="slip-title">
          <header class="wv-sheet-head">
            <h3 id="slip-title">Cetak slip kode</h3>
            <button type="button" class="wv-close" aria-label="Tutup" @click="slipOpen = false"><LineIcon name="x" :size="18" /></button>
          </header>
          <div class="wv-sheet-body">
            <label class="wv-label" for="slip-class">Jilid</label>
            <select id="slip-class" v-model="slipClass" class="wv-input" @change="loadSlipActive">
              <option v-for="c in slipClassOptions" :key="c.value" :value="c.value">{{ c.label }}</option>
            </select>
            <label class="wv-check"><input v-model="slipOnlyUnlinked" type="checkbox" /> Hanya santri yang belum tertaut wali</label>
            <!-- codes already made (maybe handed out): kept unless the person asks for new ones -->
            <div v-if="slipActive.length" class="wv-note is-warn wv-slip-active" role="status">
              <strong>{{ slipActive.length }} santri sudah punya kode yang masih berlaku:</strong>
              <ul>
                <li v-for="c in slipActive.slice(0, 6)" :key="c.santriId">{{ c.santriName }} · dibuat {{ c.createdByName || 'seseorang' }}, {{ timeAgo(c.createdAt, now) }}</li>
                <li v-if="slipActive.length > 6">dan {{ slipActive.length - 6 }} lainnya</li>
              </ul>
              <span>Mereka dilewati, jadi slip yang sudah dibagikan tetap berlaku.</span>
              <label class="wv-check"><input v-model="slipRegen" type="checkbox" /> Buat kode baru juga untuk mereka (kode lama tidak berlaku lagi)</label>
            </div>
            <!-- only when a code still valid is really replaced (by default those santri are skipped) -->
            <p v-if="slipRegen" class="wv-note is-warn">Slip berisi kode baru. Kode lama santri tersebut tidak berlaku lagi.</p>
            <p v-if="slipError" class="wv-note is-danger" role="alert">{{ slipError }}</p>
            <button type="button" class="wv-btn wv-btn-primary" :disabled="busy" @click="printSlips">
              {{ busy ? 'Membuat slip…' : 'Buat & unduh PDF' }}
            </button>
          </div>
        </section>
      </div>
    </Teleport>

    <!-- review one santri's data -->
    <Teleport to="body">
      <div v-if="review" class="wv-overlay" @click.self="review = null">
        <section class="wv-sheet wv-sheet-wide" role="dialog" aria-modal="true" aria-labelledby="review-title">
          <header class="wv-sheet-head">
            <div>
              <h3 id="review-title">{{ review.santri.name }}</h3>
              <span class="wv-pill" :class="`is-${(STATUS[review.profile.status] || STATUS.empty).tone}`">{{ (STATUS[review.profile.status] || STATUS.empty).label }}</span>
            </div>
            <button type="button" class="wv-close" aria-label="Tutup" @click="review = null"><LineIcon name="x" :size="18" /></button>
          </header>
          <div class="wv-sheet-body">
            <div v-if="review.profile.pendingIdentity" class="wv-note is-warn">
              <strong>Wali mengajukan perubahan identitas:</strong>
              <ul class="wv-diff">
                <li v-for="(v, path) in review.profile.pendingIdentity" :key="path">
                  {{ labelOf(path) }}: <s>{{ valueAt(review.profile.data, path) || '-' }}</s> → <strong>{{ v || '-' }}</strong>
                </li>
              </ul>
              <div v-if="review.canVerify" class="wv-request-actions">
                <button type="button" class="wv-btn wv-btn-ghost is-danger" :disabled="busy" @click="decideIdentity(false)">Tolak</button>
                <button type="button" class="wv-btn wv-btn-primary" :disabled="busy" @click="decideIdentity(true)">Setujui</button>
              </div>
            </div>

            <div v-for="s in STEPS" :key="s.key" class="wv-group">
              <strong>{{ s.title }}</strong>
              <dl>
                <div v-for="f in s.fields" :key="f.path" class="wv-dl-row">
                  <dt>{{ f.label }}</dt>
                  <dd>{{ shownValue(f, valueAt(review.profile.data, f.path)) }}</dd>
                </div>
              </dl>
            </div>

            <div class="wv-group">
              <strong>Wali tertaut</strong>
              <ul class="wv-plain">
                <li v-for="g in review.guardians" :key="g.waliId">
                  {{ relationLabel(g.relation) }} · WA {{ displayPhone(g.phone) }} · lewat {{ g.via === 'code' ? 'kode' : 'pengajuan' }}
                  <button v-if="isAdmin" type="button" class="wv-link is-danger" @click="unlink(g)">Lepas</button>
                </li>
              </ul>
              <button v-if="review.canVerify && review.profile.hasKkPhoto" type="button" class="wv-btn wv-btn-ghost" @click="openKk">Lihat foto KK</button>
              <p v-else-if="!review.profile.hasKkPhoto" class="wv-sub">Foto KK tidak diunggah.</p>
            </div>

            <template v-if="review.canVerify && ['submitted', 'needs_fix', 'verified'].includes(review.profile.status)">
              <div class="wv-group">
                <label v-if="nameDiffers" class="wv-check">
                  <input v-model="syncName" type="checkbox" /> Pakai nama "{{ valueAt(review.profile.data, 'santri.namaLengkap') }}" sebagai nama santri di sistem
                  (ikut berubah di absensi, nilai, dan tabungan)
                </label>
                <p class="wv-sub">
                  Saat diverifikasi, jenis kelamin, tempat dan tanggal lahir<template v-if="nameDiffers && syncName">, serta nama</template>
                  ikut tersimpan di data santri (Kelola Santri). NIK, KK, alamat, dan data orang tua tetap di sini, hanya admin dan guru jilidnya yang bisa melihat.
                </p>
                <label class="wv-label" for="fix-note">Catatan perbaikan untuk wali</label>
                <textarea id="fix-note" v-model="fixNote" class="wv-input" rows="2" placeholder="Contoh: NIK belum sesuai KK"></textarea>
              </div>
              <p v-if="reviewError" class="wv-note is-danger" role="alert">{{ reviewError }}</p>
              <div class="wv-request-actions">
                <button type="button" class="wv-btn wv-btn-ghost is-danger" :disabled="busy || !fixNote.trim()" @click="decideReview('needs_fix')">Minta perbaikan</button>
                <button type="button" class="wv-btn wv-btn-primary" :disabled="busy" @click="decideReview('verified')">Verifikasi</button>
              </div>
            </template>
            <p v-else-if="!review.canVerify" class="wv-sub">Data ini diproses oleh guru jilidnya atau admin.</p>
          </div>
        </section>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { useDialog } from '@/composables/useDialog'
import { useWaliBadge } from '@/composables/useWaliBadge'
import PageSkeleton from '@/components/PageSkeleton.vue'
import LineIcon from '@/components/LineIcon.vue'
import { STATUS, STEPS, RELATIONS, REMIND_STATUSES, getPath, displayPhone, linkCodeMessage, reminderMessage } from '@/utils/santriProfile'
import { timeAgo, dateTimeText, fullDateTime, timeOf } from '@/utils/timeAgo'
import { loadPdfLibs } from '@/utils/pdf'
import { renderSlips } from '@/utils/waliSlips'
import { loadExcelLib, downloadWorkbook } from '@/utils/excel'
import { buildSantriDataWorkbook, santriDataFilename } from '@/utils/excelExports'

const CLASS_OPTIONS = [...[1, 2, 3, 4, 5, 6].map((n) => ({ value: String(n), label: `Jilid ${n}` })), { value: '7', label: 'Marhalah' }]
const STATUS_FILTERS = [
  { value: 'all', label: 'Semua' },
  { value: 'unlinked', label: 'Belum tertaut' },
  { value: 'remind', label: 'Perlu diingatkan' },
  { value: 'tocheck', label: 'Menunggu dicek' },
  { value: 'needs_fix', label: 'Perlu diperbaiki' },
  { value: 'verified', label: 'Terverifikasi' },
]

const authStore = useAuthStore()
const { ask } = useDialog()
const route = useRoute()
const isAdmin = computed(() => authStore.user?.role === 'admin')
// the badge on this menu: what waits for this person's decision (refreshed after each decision here)
const { refresh: refreshWaliBadge } = useWaliBadge()
const { success: showSuccess, error: showError, warning: showWarning } = useToast()
const siteUrl = window.location.origin

const loading = ref(true)
const loadError = ref('')
const kkView = ref(null) // { url, name }: the KK photo being looked at
const rows = ref([])
const requests = ref([])
const tab = ref('santri')
const classFilter = ref('')
const search = ref('')
const statusFilter = ref('all')
const controlsOpen = ref(false)
function jumpSummary(status) {
  tab.value = 'santri'
  statusFilter.value = status
}
const busy = ref(false)
const choice = ref({})
const codeSheet = ref(null)
const copied = ref(false)
const slipOpen = ref(false)
const slipClass = ref('1')
const slipOnlyUnlinked = ref(true)
const slipError = ref('')
const review = ref(null)
const fixNote = ref('')
const syncName = ref(true)
const reviewError = ref('')
const scope = ref(null)
const remind = ref(null)
const alfa = ref(null)
const alfaBusy = ref(false)
const ALFA_STATUS = {
  queued: { label: 'Menunggu dikirim', tone: 'info' },
  sent: { label: 'Terkirim', tone: 'ok' },
  partial: { label: 'Sebagian gagal', tone: 'warn' },
  failed: { label: 'Gagal terkirim', tone: 'danger' },
  cancelled: { label: 'Dibatalkan (status dikoreksi)', tone: 'idle' },
  skipped_cap: { label: 'Melewati batas harian', tone: 'warn' },
}
const exporting = ref(false)

// Admin: every jilid. Guru: the jilid they look after (from the server, which enforces the same rule).
const classOptions = computed(() => {
  if (isAdmin.value || scope.value?.classIds === null) return CLASS_OPTIONS // admin, or a guru given "Semua jilid"
  if (!scope.value) return []
  return CLASS_OPTIONS.filter((c) => (scope.value.classIds || []).includes(c.value))
})
const scopeLabel = computed(() => classOptions.value.map((c) => c.label).join(', '))
// Where this person acts (codes, slips, reminders, link requests): the admin everywhere, a guru the jilid they teach.
// "Semua jilid" only shows more (the server says which: actClassIds).
const actIds = computed(() => (isAdmin.value ? null : scope.value?.actClassIds ?? scope.value?.classIds ?? []))
const canAct = (classId) => actIds.value === null || actIds.value.includes(String(classId || ''))
const slipClassOptions = computed(() => CLASS_OPTIONS.filter((c) => canAct(c.value)))
const slipActive = ref([])
const slipRegen = ref(false)
async function loadSlipActive() {
  slipActive.value = []
  slipRegen.value = false
  if (!slipClass.value) return
  try {
    const { data } = await api.get('/wali/admin/codes/active', { params: { classId: slipClass.value }, cache: false })
    slipActive.value = Array.isArray(data) ? data : []
  } catch {
    slipActive.value = []
  }
}
function openSlips() {
  if (!slipClassOptions.value.some((c) => c.value === slipClass.value)) slipClass.value = slipClassOptions.value[0]?.value || ''
  slipError.value = ''
  slipOpen.value = true
  loadSlipActive()
}

const levelName = (id) => (String(id) === '7' ? 'Marhalah' : id ? `Jilid ${id}` : 'Tanpa jilid')
const relationLabel = (r) => RELATIONS.find((x) => x.value === r)?.label || r
const dateText = (v) => {
  const d = v?._seconds ? new Date(v._seconds * 1000) : v ? new Date(v) : null
  return d && !Number.isNaN(d.getTime()) ? d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : ''
}
const valueAt = (data, path) => getPath(data || {}, path) ?? ''
const labelOf = (path) => STEPS.flatMap((s) => s.fields).find((f) => f.path === path)?.label || path
const shownValue = (f, v) => {
  if (!v) return '-'
  if (f.type === 'gender') return v === 'L' ? 'Laki-laki' : 'Perempuan'
  if (f.type === 'phone') return displayPhone(v)
  if (f.type === 'date') return new Date(`${v}T12:00:00`).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  return v
}

const matchStatus = (r, f) => {
  if (f === 'all') return true
  if (f === 'unlinked') return r.guardians.length === 0
  if (f === 'remind') return needsReminder(r)
  if (f === 'tocheck') return r.profileStatus === 'submitted' || r.hasPendingIdentity
  return r.profileStatus === f
}
const filteredByClass = computed(() => rows.value.filter((r) => !classFilter.value || r.classId === classFilter.value))

/* ---- when the row's data came in, newest first by default ("barusan", "2 menit lalu", then the date and hour) */
// the moment that matters for the row: the form sent, else last filled in, else the wali linked, else the santri added
function rowTime(r) {
  if (timeOf(r.submittedAt)) return { at: r.submittedAt, label: r.profileStatus === 'verified' ? 'Dikirim wali' : 'Dikirim' }
  if (timeOf(r.updatedAt)) return { at: r.updatedAt, label: 'Diisi wali' }
  if (timeOf(r.linkedAt)) return { at: r.linkedAt, label: 'Wali tertaut' }
  if (timeOf(r.createdAt)) return { at: r.createdAt, label: 'Santri ditambahkan' }
  return null
}
const SORTS = [
  { value: 'newest', label: 'Terbaru' },
  { value: 'oldest', label: 'Terlama' },
  { value: 'name', label: 'Nama A-Z' },
]
const sortBy = ref('newest')
const byName = (a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'id', { sensitivity: 'base', numeric: true })
function sortRows(list) {
  if (sortBy.value === 'name') return [...list].sort(byName)
  const dir = sortBy.value === 'oldest' ? 1 : -1
  return list
    .map((r) => ({ r, t: timeOf(rowTime(r)?.at) }))
    // no time known (old data): always at the end, A-Z
    .sort((a, b) => (!a.t || !b.t ? (a.t ? -1 : b.t ? 1 : byName(a.r, b.r)) : dir * (a.t - b.t) || byName(a.r, b.r)))
    .map((x) => x.r)
}
// "2 menit lalu" moves on by itself while the page is open
const now = ref(new Date())
let clockTimer = null
const visibleRows = computed(() => {
  const q = search.value.trim().toLowerCase()
  return sortRows(filteredByClass.value.filter((r) => matchStatus(r, statusFilter.value) && (!q || r.name.toLowerCase().includes(q))))
})

/* ---- laying out the list: one list, by jilid, or by the wali's number (a number linked to several children) */
const GROUPINGS = [
  { value: 'none', label: 'Tanpa' },
  { value: 'jilid', label: 'Per jilid' },
  { value: 'phone', label: 'Per nomor wali' },
]
const GROUP_KEY = 'wv-group-by'
const readGroupBy = () => {
  try {
    const v = localStorage.getItem(GROUP_KEY)
    return GROUPINGS.some((o) => o.value === v) ? v : 'none'
  } catch {
    return 'none'
  }
}
const groupBy = ref(readGroupBy())
const onlyShared = ref(false)
const activeControlCount = computed(() =>
  (classFilter.value ? 1 : 0) + (sortBy.value !== 'newest' ? 1 : 0) + (groupBy.value !== 'none' ? 1 : 0),
)
function setGroupBy(v) {
  groupBy.value = v
  try {
    localStorage.setItem(GROUP_KEY, v)
  } catch {
    /* private mode: for this visit only */
  }
}
const groupedRows = computed(() => {
  const list = visibleRows.value
  if (!list.length) return []
  if (groupBy.value === 'jilid') {
    const by = new Map()
    for (const r of list) {
      const k = r.classId || ''
      if (!by.has(k)) by.set(k, [])
      by.get(k).push(r)
    }
    return [...by.entries()]
      .sort(([a], [b]) => (a || '99').localeCompare(b || '99', undefined, { numeric: true }))
      .map(([k, rows]) => ({ key: `j${k}`, title: levelName(k), note: `${rows.length} santri`, rows }))
  }
  if (groupBy.value === 'phone') {
    // a child with two wali shows under both numbers; a child with none at the end
    const by = new Map()
    const none = []
    for (const r of list) {
      if (!r.guardians.length) none.push(r)
      for (const g of r.guardians) {
        if (!by.has(g.phone)) by.set(g.phone, { relation: g.relation, rows: [] })
        by.get(g.phone).rows.push(r)
      }
    }
    const groups = [...by.entries()]
      .filter(([, g]) => !onlyShared.value || g.rows.length > 1)
      .sort(([pa, a], [pb, b]) => b.rows.length - a.rows.length || pa.localeCompare(pb))
      .map(([phone, g]) => ({ key: `p${phone}`, title: `${relationLabel(g.relation)} · ${displayPhone(phone)}`, note: `${g.rows.length} santri`, rows: g.rows }))
    if (none.length && !onlyShared.value) groups.push({ key: 'pnone', title: 'Belum ada wali tertaut', note: `${none.length} santri`, rows: none })
    return groups
  }
  return [{ key: 'all', title: '', note: '', rows: list }]
})

// who was told that it waits: the jilid's teacher (until a time), or the admin already
const clock = (v) => {
  const d = v?._seconds ? new Date(v._seconds * 1000) : v ? new Date(v) : null
  return d && !Number.isNaN(d.getTime()) ? d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }) : ''
}
function routingText(r) {
  const w = r.routing
  if (!w || !(r.profileStatus === 'submitted' || r.hasPendingIdentity)) return ''
  if (w.status === 'waiting') return `Dikabarkan ke ${w.teacherNames || 'guru jilidnya'} · diteruskan ke admin pukul ${clock(w.dueAt)} bila belum diproses`
  if (w.reason === 'no-teacher') return 'Langsung ke admin: guru jilid ini belum mengaktifkan WA di Notifikasi WA'
  return `Belum diproses ${w.teacherNames || 'guru jilidnya'} dalam 30 menit, sudah diteruskan ke admin`
}
const countFor = (f) => filteredByClass.value.filter((r) => matchStatus(r, f)).length
const stats = computed(() => ({
  linked: rows.value.filter((r) => r.guardians.length).length,
  verified: rows.value.filter((r) => r.profileStatus === 'verified').length,
  toCheck: rows.value.filter((r) => r.profileStatus === 'submitted' || r.hasPendingIdentity).length,
}))
const nameDiffers = computed(() => {
  const formName = valueAt(review.value?.profile?.data, 'santri.namaLengkap')
  return !!formName && formName !== review.value?.santri?.name
})

// quiet: refresh after an action without the skeleton, so the list keeps its scroll position
async function load({ quiet = false } = {}) {
  if (!quiet) loading.value = true
  loadError.value = ''
  try {
    const [p, q, sc] = await Promise.all([
      api.get('/wali/admin/progress', { cache: false }),
      api.get('/wali/admin/link-requests', { cache: false }),
      api.get('/wali/admin/scope', { cache: false }),
    ])
    rows.value = p.data || []
    requests.value = q.data || []
    scope.value = sc.data || null
    refreshWaliBadge({ force: true })
  } catch (err) {
    loadError.value = err.response?.data?.error || 'Data belum bisa dimuat.'
  } finally {
    loading.value = false
  }
}

/* ---- Excel: the rows on screen (jilid, status and search applied), with everything the wali filled in */
async function exportExcel() {
  if (exporting.value || !visibleRows.value.length) return
  exporting.value = true
  try {
    const exportedAt = new Date()
    const [{ data }, ExcelJS] = await Promise.all([
      api.get('/wali/admin/export', { params: { classId: classFilter.value || undefined }, cache: false }),
      loadExcelLib(),
    ])
    const order = new Map(visibleRows.value.map((r, i) => [r.santriId, i]))
    const rows = (data || []).filter((r) => order.has(r.santriId)).sort((a, b) => order.get(a.santriId) - order.get(b.santriId))
    const parts = [
      classFilter.value && levelName(classFilter.value),
      statusFilter.value !== 'all' && STATUS_FILTERS.find((f) => f.value === statusFilter.value)?.label,
      search.value.trim() && `cari "${search.value.trim()}"`,
    ].filter(Boolean)
    const workbook = buildSantriDataWorkbook(ExcelJS, {
      rows, steps: STEPS, status: STATUS, relations: RELATIONS, exportedAt,
      filterLabel: parts.length ? `Filter: ${parts.join(', ')}` : 'Semua santri aktif',
    })
    const filename = santriDataFilename({ filtered: parts.length > 0, date: exportedAt })
    await downloadWorkbook(workbook, filename)
    showSuccess(`${rows.length} santri diekspor ke ${filename}`)
  } catch (err) {
    showError(err.response?.data?.error || 'Gagal mengekspor Excel. Coba lagi.')
  } finally {
    exporting.value = false
  }
}

/* ---- kabar alfa (admin) */
async function loadAlfa() {
  try {
    const { data } = await api.get('/wali/admin/alfa', { cache: false })
    alfa.value = data
  } catch (err) {
    showError(err.response?.data?.error || 'Kabar alfa belum bisa dimuat')
  }
}
function openAlfa() {
  tab.value = 'alfa'
  loadAlfa()
}
async function sendCorrections() {
  alfaBusy.value = true
  try {
    const { data } = await api.post('/wali/admin/alfa/corrections')
    showSuccess(data.queued ? `${data.queued} permintaan maaf masuk antrean WhatsApp bot` : 'Tidak ada permintaan maaf yang tertunda')
    await loadAlfa()
  } catch (err) {
    showError(err.response?.data?.error || 'Belum bisa dikirim')
  } finally {
    alfaBusy.value = false
  }
}
async function toggleAlfa() {
  alfaBusy.value = true
  try {
    const { data } = await api.put('/wali/admin/alfa', { enabled: !alfa.value.enabled })
    alfa.value = { ...alfa.value, enabled: data.enabled }
    showSuccess(data.enabled ? 'Kabar alfa aktif' : 'Kabar alfa dijeda')
  } catch (err) {
    showError(err.response?.data?.error || 'Belum bisa diubah')
  } finally {
    alfaBusy.value = false
  }
}

/* ---- reminders: the teacher japri's the wali from their own WhatsApp; the page only records that it happened */
function needsReminder(r) {
  return r.guardians.length > 0 && REMIND_STATUSES.includes(r.profileStatus)
}
function reminderText(rem) {
  const when = timeAgo(rem?.at, now.value)
  if (!when) return ''
  return `Diingatkan ${when}${rem.byName ? ` oleh ${rem.byName}` : ''}${rem.count > 1 ? ` (${rem.count}x)` : ''}`
}
const remindMessage = computed(() => remind.value
  ? reminderMessage({
    santriName: remind.value.name,
    status: remind.value.profileStatus,
    note: remind.value.adminNote,
    siteUrl,
    senderName: authStore.user?.displayName || '',
  })
  : '')
const waTo = (phone, text) => `https://wa.me/${String(phone || '').replace(/\D/g, '')}?text=${encodeURIComponent(text)}`
const remindError = ref('')
function openRemind(r) {
  remindError.value = ''
  remind.value = r
}
// the TPQ bot sends it (to every wali of this santri); the backend refuses a second one the same day
async function sendReminder(r) {
  busy.value = true
  remindError.value = ''
  try {
    const { data } = await api.post('/wali/admin/reminders/send', { santriId: r.santriId })
    const row = rows.value.find((x) => x.santriId === r.santriId)
    if (row) row.lastReminder = data.lastReminder
    remind.value = null
    showSuccess(`Pengingat masuk antrean WA bot (${data.queued} wali)`)
  } catch (err) {
    remindError.value = err.response?.data?.error || 'Pengingat belum terkirim. Coba lagi.'
  } finally {
    busy.value = false
  }
}

/* ---- codes */
// A code still valid (made by someone, maybe already handed out) is not replaced without asking
async function makeCode(r, { replace = false } = {}) {
  busy.value = true
  try {
    const { data } = await api.post('/wali/admin/codes', { santriId: r.santriId, replace })
    copied.value = false
    codePhone.value = ''
    codeError.value = ''
    codeSentTo.value = []
    codeSheet.value = { ...data, santriId: data.santriId || r.santriId, guardians: r.guardians || [] }
  } catch (err) {
    const active = err.response?.status === 409 ? err.response?.data?.activeCode : null
    if (!active) return showError(err.response?.data?.error || 'Kode belum bisa dibuat')
    busy.value = false
    const ok = await ask({
      title: `${r.name} sudah punya kode`,
      message: `Kode yang masih berlaku dibuat oleh ${active.createdByName || 'seseorang'} (${timeAgo(active.createdAt, now.value)}), mungkin sudah dibagikan ke wali. Bila dibuat kode baru, kode itu tidak berlaku lagi.`,
      tone: 'danger',
      confirmText: 'Buat kode baru',
      cancelText: 'Batal',
    })
    if (ok) await makeCode(r, { replace: true })
  } finally {
    busy.value = false
  }
}
const messageFor = (c) => linkCodeMessage({ santriName: c.santriName, code: c.code, expiresAt: c.expiresAt, siteUrl })
// wa.me without a number: the teacher picks the parent's chat (a private message, not the group)
const codePhone = ref('')
const codeError = ref('')
const codeSentTo = ref([])
const digits = (p) => String(p || '').replace(/\D/g, '').replace(/^0/, '62')
const samePhone = (a, b) => !!a && digits(a) === digits(b)
// the TPQ bot sends the code to the number typed (or tapped); the sheet stays open for the other parent
async function sendCode() {
  busy.value = true
  codeError.value = ''
  try {
    const { data } = await api.post('/wali/admin/codes/send', { santriId: codeSheet.value.santriId, code: codeSheet.value.code, phone: codePhone.value })
    const shown = displayPhone(data.phone)
    if (!codeSentTo.value.includes(shown)) codeSentTo.value.push(shown)
    codePhone.value = ''
    showSuccess(`Kode masuk antrean WA bot ke ${shown}`)
  } catch (err) {
    codeError.value = err.response?.data?.error || 'Kode belum terkirim. Coba lagi.'
  } finally {
    busy.value = false
  }
}
async function copyMessage(c) {
  try {
    await navigator.clipboard.writeText(messageFor(c))
    copied.value = true
  } catch {
    showError('Tidak bisa menyalin otomatis. Tekan lama pada kode untuk menyalin.')
  }
}

async function printSlips() {
  busy.value = true
  slipError.value = ''
  try {
    const { data } = await api.post('/wali/admin/codes/class', { classId: slipClass.value, onlyUnlinked: slipOnlyUnlinked.value, skipActive: !slipRegen.value })
    if (!data.length) {
      slipError.value = slipActive.value.length && !slipRegen.value
        ? 'Santri yang tersisa sudah punya kode yang masih berlaku. Centang "Buat kode baru juga" bila slipnya hilang.'
        : slipOnlyUnlinked.value ? 'Semua santri di jilid ini sudah tertaut wali.' : 'Tidak ada santri aktif di jilid ini.'
      return
    }
    const { jsPDF } = await loadPdfLibs()
    const doc = renderSlips({
      jsPDF,
      siteUrl,
      slips: data.map((c) => ({ santriName: c.santriName, classLabel: levelName(c.classId), code: c.code, expiresAt: c.expiresAt })),
    })
    doc.save(`Slip-Kode-Wali-${levelName(slipClass.value).replace(' ', '-')}.pdf`)
    showSuccess(`${data.length} slip kode dibuat`)
    slipOpen.value = false
  } catch (err) {
    slipError.value = err.response?.data?.error || 'Slip belum bisa dibuat.'
  } finally {
    busy.value = false
  }
}

/* ---- requests */
function candidatesFor(q) {
  const list = rows.value.filter((r) => !q.classId || r.classId === q.classId)
  const words = String(q.childName || '').toLowerCase().split(/\s+/).filter(Boolean)
  const score = (r) => words.filter((w) => r.name.toLowerCase().includes(w)).length
  return [...list].sort((a, b) => score(b) - score(a) || a.name.localeCompare(b.name))
}
async function decide(q, approve) {
  let reason = ''
  if (!approve) {
    reason = await ask({
      title: 'Tolak pengajuan?',
      message: `Pengajuan tautan untuk ${q.childName}. Alasan ini akan dilihat oleh wali.`,
      tone: 'danger',
      confirmText: 'Tolak pengajuan',
      input: { label: 'Alasan', value: 'Nama santri tidak ditemukan', required: true, maxlength: 300, multiline: true },
    })
    if (reason === null) return
  }
  busy.value = true
  try {
    await api.post(`/wali/admin/link-requests/${q.id}/decide`, { approve, santriId: choice.value[q.id], reason })
    showSuccess(approve ? 'Wali sudah ditautkan, dikabari lewat WA' : 'Pengajuan ditolak, wali dikabari lewat WA')
    await load({ quiet: true })
  } catch (err) {
    showError(err.response?.data?.error || 'Gagal memproses pengajuan')
  } finally {
    busy.value = false
  }
}

/* ---- review */
async function openReview(r) {
  reviewError.value = ''
  fixNote.value = ''
  syncName.value = true
  try {
    const { data } = await api.get(`/wali/admin/santri/${r.santriId}`, { cache: false })
    review.value = data
  } catch (err) {
    showError(err.response?.data?.error || 'Data belum bisa dibuka')
  }
}
async function decideReview(decision) {
  busy.value = true
  reviewError.value = ''
  try {
    const { data } = await api.post(`/wali/admin/santri/${review.value.santri.id}/review`, { decision, note: fixNote.value, syncName: nameDiffers.value && syncName.value })
    review.value = null
    showSuccess(decision === 'verified'
      ? (data?.sync?.name ? `Data terverifikasi, wali dikabari lewat WA. Nama santri sekarang "${data.sync.name}".` : 'Data terverifikasi, wali dikabari lewat WA')
      : 'Permintaan perbaikan dikirim ke WA wali')
    if (data?.sync?.nameSkipped) showWarning(data.sync.nameSkipped)
    load({ quiet: true })
  } catch (err) {
    reviewError.value = err.response?.data?.error || 'Gagal menyimpan'
  } finally {
    busy.value = false
  }
}
async function decideIdentity(approve) {
  busy.value = true
  try {
    const { data } = await api.post(`/wali/admin/santri/${review.value.santri.id}/identity`, { approve, syncName: approve })
    review.value = null
    showSuccess(approve ? 'Perubahan identitas disetujui, wali dikabari lewat WA' : 'Perubahan identitas ditolak, wali dikabari lewat WA')
    if (data?.sync?.nameSkipped) showWarning(data.sync.nameSkipped)
    load({ quiet: true })
  } catch (err) {
    showError(err.response?.data?.error || 'Gagal menyimpan')
  } finally {
    busy.value = false
  }
}
async function openKk() {
  try {
    const { data } = await api.get(`/wali/admin/santri/${review.value.santri.id}/kk`, { cache: false })
    kkView.value = { url: data.url, name: review.value.santri.name || 'santri' }
  } catch (err) {
    showError(err.response?.data?.error || 'Foto KK tidak bisa dibuka')
  }
}
async function unlink(g) {
  const ok = await ask({
    title: 'Lepas tautan wali?',
    message: `${relationLabel(g.relation)} (WA ${displayPhone(g.phone)}) tidak lagi terhubung dengan ${review.value.santri.name}. Wali bisa menautkan lagi dengan kode baru.`,
    tone: 'danger',
    confirmText: 'Lepas tautan',
  })
  if (!ok) return
  try {
    await api.delete(`/wali/admin/guardians/${review.value.santri.id}/${g.waliId}`)
    review.value = { ...review.value, guardians: review.value.guardians.filter((x) => x.waliId !== g.waliId) }
    showSuccess('Tautan wali dilepas')
    load({ quiet: true })
  } catch (err) {
    showError(err.response?.data?.error || 'Gagal melepas tautan')
  }
}

// /dashboard/wali-santri?santri=ID (from Kelola Santri): open that santri right away
onMounted(async () => {
  clockTimer = setInterval(() => {
    now.value = new Date()
  }, 30000)
  await load()
  const id = typeof route.query.santri === 'string' ? route.query.santri : ''
  const row = id && rows.value.find((r) => r.santriId === id)
  if (row) {
    search.value = row.name
    if (row.profileStatus !== 'empty') openReview(row)
  }
})
onBeforeUnmount(() => {
  if (clockTimer) clearInterval(clockTimer)
})
</script>

<style scoped>

.wv-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}

.wv-head-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.wv-head h1 {
  margin: 0 0 4px;
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--lp-ink, #0b3b2a);
}

.wv-head p {
  margin: 0;
  color: var(--lp-body, #475a50);
}

.wv-summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin-bottom: 14px;
  border-radius: 16px;
  background: #fff;
  border: 1px solid rgba(11, 59, 42, 0.1);
  overflow: hidden;
}

.wv-stat {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 12px 14px;
  border: 0;
  background: transparent;
  text-align: left;
  font: inherit;
  cursor: pointer;
}

.wv-stat:hover {
  background: #f6faf8;
}

.wv-stat + .wv-stat {
  border-left: 1px solid rgba(11, 59, 42, 0.08);
}

.wv-summary strong {
  font-size: 1.35rem;
  color: var(--lp-ink, #0b3b2a);
  font-variant-numeric: tabular-nums;
}

.wv-summary span {
  font-size: 0.78rem;
  color: #5b6b62;
}

.wv-summary .is-attn {
  background: #fffbeb;
}

.wv-summary .is-attn strong {
  color: #7c3a0d;
}

.wv-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 12px;
  padding: 4px;
  border-radius: 12px;
  background: rgba(11, 59, 42, 0.06);
  width: fit-content;
  max-width: 100%;
}

.wv-tabs button {
  flex: none;
  white-space: nowrap;
  min-height: 42px;
  padding: 0 14px;
  border: 0;
  border-radius: 9px;
  background: transparent;
  font: inherit;
  font-size: 0.9rem;
  font-weight: 700;
  color: #3b4a42;
  cursor: pointer;
}

.wv-tabs button.active {
  background: #fff;
  color: var(--lp-ink, #0b3b2a);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.wv-count {
  display: inline-grid;
  place-items: center;
  min-width: 20px;
  height: 20px;
  margin-left: 4px;
  border-radius: 999px;
  background: #b45309;
  color: #fff;
  font-size: 0.72rem;
}

/* Streamlined Toolbar: search + filter trigger, single-line status strip, compact dropdown controls */
.wv-toolbar {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.wv-search-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.wv-search-box {
  position: relative;
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
}

.wv-search-ico {
  position: absolute;
  left: 12px;
  color: #5b6b62;
  pointer-events: none;
}

.wv-search-input {
  padding-left: 36px;
}

.wv-filter-toggle {
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 44px;
  padding: 0 14px;
  border-radius: 11px;
  border: 1px solid rgba(11, 59, 42, 0.22);
  background: #fff;
  color: #0b3b2a;
  font: inherit;
  font-size: 0.86rem;
  font-weight: 700;
  cursor: pointer;
}

.wv-filter-toggle.has-active,
.wv-filter-toggle[aria-expanded="true"] {
  border-color: #0a5c40;
  background: #edf7f2;
  color: #0a5c40;
}

.wv-filter-badge {
  display: inline-grid;
  place-items: center;
  min-width: 20px;
  height: 20px;
  padding: 0 5px;
  border-radius: 999px;
  background: #0a5c40;
  color: #fff;
  font-size: 0.72rem;
  font-variant-numeric: tabular-nums;
}

@media (min-width: 768px) {
  .wv-filter-toggle {
    display: none;
  }
}

.wv-input {
  width: 100%;
  min-height: 44px;
  padding: 0 12px;
  border-radius: 11px;
  border: 1px solid rgba(11, 59, 42, 0.22);
  background: #fff;
  font: inherit;
  box-sizing: border-box;
}

textarea.wv-input {
  padding: 10px 12px;
  min-height: 70px;
}

.wv-chips {
  display: flex;
  flex-wrap: nowrap;
  overflow-x: auto;
  gap: 6px;
  padding-bottom: 2px;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}

.wv-chips::-webkit-scrollbar {
  display: none;
}

@media (min-width: 960px) {
  .wv-chips {
    flex-wrap: wrap;
    overflow-x: visible;
  }
}

.wv-chip {
  flex: none;
  min-height: 36px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid rgba(11, 59, 42, 0.16);
  background: #fff;
  font: inherit;
  font-size: 0.83rem;
  font-weight: 600;
  color: #2f4339;
  white-space: nowrap;
  cursor: pointer;
}

.wv-chip span {
  margin-left: 4px;
  color: #5b6b62;
  font-variant-numeric: tabular-nums;
}

.wv-chip[aria-pressed="true"] {
  border-color: #0a5c40;
  background: #0a5c40;
  color: #fff;
}

.wv-chip[aria-pressed="true"] span {
  color: #d9efe4;
}

.wv-controls-panel {
  display: none;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 8px;
  padding: 10px 12px;
  border-radius: 14px;
  background: #f5f9f6;
  border: 1px solid rgba(11, 59, 42, 0.1);
}

.wv-controls-panel.is-open {
  display: grid;
}

@media (min-width: 768px) {
  .wv-controls-panel {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    align-items: end;
  }
}

.wv-ctrl-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.76rem;
  font-weight: 700;
  color: #5b6b62;
}

.wv-select {
  width: 100%;
  min-height: 40px;
  padding: 0 10px;
  border-radius: 10px;
  border: 1px solid rgba(11, 59, 42, 0.2);
  background: #fff;
  color: #0b3b2a;
  font: inherit;
  font-size: 0.86rem;
  font-weight: 600;
  box-sizing: border-box;
}

.wv-active-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

@media (min-width: 768px) {
  .wv-active-tags {
    display: none;
  }
}

.wv-tag-clear {
  min-height: 30px;
  padding: 0 10px;
  border-radius: 999px;
  border: 1px solid rgba(10, 92, 64, 0.25);
  background: #e9f5ef;
  color: #0a5c40;
  font: inherit;
  font-size: 0.76rem;
  font-weight: 700;
  cursor: pointer;
}

.wv-list {
  list-style: none;
  margin: 0;
  padding: 0;
  border-radius: 16px;
  background: #fff;
  border: 1px solid rgba(11, 59, 42, 0.1);
}

.wv-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
}

.wv-row + .wv-row {
  border-top: 1px solid rgba(11, 59, 42, 0.07);
}

.wv-row-main {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.wv-row-main strong {
  color: var(--lp-ink, #0b3b2a);
}

.wv-sub {
  font-size: 0.82rem;
  color: #5b6b62;
}

.wv-sub.is-muted {
  color: #8a968f;
}

.wv-row-side {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.wv-actions {
  display: flex;
  gap: 6px;
}

.wv-pill {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 0.76rem;
  font-weight: 700;
  white-space: nowrap;
}

.wv-pill.is-idle { background: #eef0ef; color: #4b5a52; }
.wv-pill.is-warn { background: #fef3c7; color: #7c3a0d; }
.wv-pill.is-info { background: #e6f0fb; color: #1d4f8a; }
.wv-pill.is-danger { background: #fdecea; color: #8e1b12; }
.wv-pill.is-ok { background: #e3f1ea; color: #0a5c40; }

.wv-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 42px;
  padding: 0 14px;
  border-radius: 11px;
  border: 0;
  font: inherit;
  font-size: 0.88rem;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
}

.wv-btn-primary {
  color: #fff;
  background: linear-gradient(135deg, #0a5c40, #053d2c);
}

.wv-btn-ghost {
  color: var(--lp-ink, #0b3b2a);
  background: #fff;
  border: 1px solid rgba(11, 59, 42, 0.22);
}

.wv-btn-ghost.is-danger {
  color: #b42318;
  border-color: rgba(180, 35, 24, 0.35);
}

.wv-btn-wa {
  color: #fff;
  background: #128c4b;
}

.wv-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.wv-btn:focus-visible,
.wv-chip:focus-visible,
.wv-close:focus-visible {
  outline: 3px solid #b45309;
  outline-offset: 2px;
}

.wv-empty {
  padding: 24px;
  text-align: center;
  color: #5b6b62;
}

.wv-card {
  padding: 14px;
  border-radius: 16px;
  background: #fff;
  border: 1px solid rgba(11, 59, 42, 0.1);
}

.wv-card + .wv-card {
  margin-top: 10px;
}

.wv-request-head {
  display: flex;
  flex-direction: column;
  margin-bottom: 10px;
}

.wv-request-head strong {
  color: var(--lp-ink, #0b3b2a);
  font-size: 1rem;
}

.wv-alfa-switch {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 8px;
}

.wv-alfa-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.wv-alfa-head h2 {
  margin: 0 0 4px;
  font-size: 1.05rem;
  font-weight: 800;
  color: var(--lp-ink, #0b3b2a);
}

.wv-alfa-switch .wv-sub {
  margin: 0;
  line-height: 1.5;
}

.wv-alfa-today {
  margin: 0;
  color: var(--lp-body, #475a50);
}

.wv-section {
  margin: 18px 0 8px;
  font-size: 0.95rem;
  font-weight: 800;
  color: var(--lp-ink, #0b3b2a);
}

.wv-message {
  margin: 0 0 12px;
  padding: 12px 14px;
  border-radius: 12px;
  background: #f4f8f5;
  border: 1px solid rgba(11, 59, 42, 0.12);
  color: var(--lp-ink, #0b3b2a);
  font-size: 0.88rem;
  line-height: 1.5;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.wv-code-send {
  display: grid;
  gap: 8px;
  margin-bottom: 8px;
}

.wv-code-known {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.wv-code-known .wv-chip.is-active {
  border-color: #0a5c40;
  background: #e3f1ea;
}

.wv-note.is-ok {
  background: #e3f1ea;
  color: #0a5c40;
}

.wv-remind-to {
  margin: 0 0 12px;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 4px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.wv-reminded {
  color: #92400e;
}

.wv-slip-active ul {
  margin: 6px 0;
  padding-left: 18px;
}

/* who was told that it waits */
.wv-routing {
  color: #1d4f8a;
}

.wv-routing.is-admin {
  color: #92400e;
  font-weight: 600;
}

.wv-groupby-only {
  grid-column: 1 / -1;
  margin: 2px 0 0;
}

.wv-block + .wv-block {
  margin-top: 16px;
}

.wv-block-title {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 8px;
  margin: 0 0 8px;
  font-size: 1rem;
  font-weight: 800;
  color: #0b3b2a;
  font-variant-numeric: tabular-nums;
}

.wv-block-title span {
  font-size: 0.82rem;
  font-weight: 600;
  color: #5b6b62;
}

.wv-sheet-body .wv-btn-wa + .wv-btn-wa {
  margin-top: 8px;
}

.wv-quote {
  margin: 6px 0 0;
  font-size: 0.88rem;
  color: #2f4339;
}

.wv-label {
  display: block;
  margin: 8px 0 6px;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--lp-ink, #0b3b2a);
}

.wv-request-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 10px;
}

.wv-note {
  margin: 0 0 10px;
  padding: 10px 12px;
  border-radius: 12px;
  background: #eef6f1;
  color: #0a4a34;
  font-size: 0.88rem;
}

.wv-note.is-warn {
  background: #fffbeb;
  color: #5b3a06;
  border: 1px solid #f3d58b;
}

.wv-scope {
  margin-bottom: 14px;
}

.wv-note.is-danger {
  background: #fdecea;
  color: #7a1810;
}

.wv-check {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin: 10px 0;
  font-size: 0.88rem;
  color: #0b3b2a;
}

.wv-check input {
  width: 18px;
  height: 18px;
  accent-color: #0a5c40;
}

/* sheets */
.wv-kk {
  max-width: 760px;
}

/* the KK photo opens from inside the review sheet: it goes over it, not behind it */
.wv-overlay.wv-overlay-top {
  z-index: 9995;
}

.wv-kk-img {
  display: block;
  width: 100%;
  max-height: 70dvh;
  object-fit: contain;
  margin-bottom: 10px;
  border-radius: 12px;
  background: #fff;
  border: 1px solid rgba(11, 59, 42, 0.12);
}

.wv-overlay {
  position: fixed;
  inset: 0;
  z-index: 9990;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: rgba(3, 41, 29, 0.45);
}

.wv-sheet {
  width: 100%;
  max-height: 88dvh;
  overflow-y: auto;
  background: #fbf9f3;
  border-radius: 20px 20px 0 0;
  padding-bottom: env(safe-area-inset-bottom);
}

@media (min-width: 640px) {
  .wv-overlay {
    align-items: center;
    padding: 24px;
  }

  .wv-sheet {
    max-width: 460px;
    border-radius: 20px;
  }

  .wv-sheet-wide {
    max-width: 640px;
  }
}

.wv-sheet-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 18px 12px;
  border-bottom: 1px solid rgba(11, 59, 42, 0.08);
}

.wv-sheet-head h3 {
  margin: 0 0 4px;
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--lp-ink, #0b3b2a);
}

.wv-close {
  flex: none;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  border: 1px solid rgba(11, 59, 42, 0.15);
  background: #fff;
  display: grid;
  place-items: center;
  cursor: pointer;
}

.wv-sheet-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px 18px 20px;
}

.wv-code {
  margin: 4px 0 0;
  text-align: center;
  font-size: 2rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  color: var(--lp-ink, #0b3b2a);
  font-variant-numeric: tabular-nums;
  user-select: all;
}

.wv-center {
  text-align: center;
}

.wv-group {
  padding-top: 10px;
  border-top: 1px solid rgba(11, 59, 42, 0.08);
}

.wv-group > strong {
  color: var(--lp-ink, #0b3b2a);
}

.wv-group dl {
  margin: 6px 0 0;
}

.wv-dl-row {
  display: grid;
  grid-template-columns: minmax(0, 42%) minmax(0, 1fr);
  gap: 10px;
  padding: 3px 0;
  font-size: 0.88rem;
}

.wv-dl-row dt {
  color: #5b6b62;
}

.wv-dl-row dd {
  margin: 0;
  font-weight: 600;
  color: #0b3b2a;
  overflow-wrap: anywhere;
}

.wv-diff {
  margin: 6px 0 0;
  padding-left: 18px;
}

.wv-plain {
  list-style: none;
  margin: 6px 0 8px;
  padding: 0;
  font-size: 0.88rem;
}

.wv-link {
  margin-left: 8px;
  border: 0;
  background: none;
  font: inherit;
  font-weight: 700;
  text-decoration: underline;
  cursor: pointer;
}

.wv-link.is-danger {
  color: #b42318;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

@media (max-width: 720px) {
  .wv-summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .wv-stat:nth-child(3) {
    border-left: 0;
  }

  .wv-stat:nth-child(n + 3) {
    border-top: 1px solid rgba(11, 59, 42, 0.08);
  }

  .wv-tabs {
    width: 100%;
    box-sizing: border-box;
  }

  .wv-tabs button {
    flex: 1 1 0;
    padding: 0 8px;
    font-size: 0.84rem;
  }

  .wv-row {
    flex-direction: column;
    align-items: stretch;
  }

  .wv-row-side {
    justify-content: flex-start;
  }

  .wv-actions {
    margin-left: auto;
  }

  .wv-head-actions {
    width: 100%;
  }

  .wv-head .wv-btn {
    flex: 1 1 0;
    min-width: 0;
  }
}
</style>
