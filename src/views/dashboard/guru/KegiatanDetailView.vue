<template>
  <div class="kg" :class="{ 'is-admin': isAdmin }">
    <router-link to="/dashboard/kegiatan" class="kg-back">← Semua kegiatan</router-link>

    <PageSkeleton v-if="loading && !data" :rows="5" label="Memuat kegiatan" />
    <p v-else-if="loadError" class="kg-note is-danger" role="alert">{{ loadError }}</p>

    <template v-else-if="data">
      <header class="kg-head">
        <div class="kg-head-info">
          <div class="kg-title-row">
            <h1>{{ a.title }}</h1>
            <span class="kg-pill" :class="a.status === 'open' ? 'is-ok' : 'is-idle'">{{ a.status === 'open' ? 'Berjalan' : 'Selesai' }}</span>
          </div>
          <p>
            {{ a.typeLabel }}<template v-if="a.date"> · {{ dayLabel(a.date) }}</template>
            <template v-if="a.createdByName"> · oleh {{ a.createdByName }}</template>
          </p>
        </div>
        <div v-if="data.canManage" class="kg-head-actions">
          <button
            v-if="a.status === 'open'"
            type="button"
            class="kg-btn kg-btn-primary kg-btn-sm kg-btn-wa"
            @click="openInfoSheet"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M22 2 11 13" />
              <path d="m22 2-7 20-4-9-9-4 20-7Z" />
            </svg>
            Kirim info WA
          </button>
          <button type="button" class="kg-btn kg-btn-sm" @click="openForm">Ubah</button>
          <button type="button" class="kg-btn kg-btn-sm" :disabled="busy" @click="toggleClosed">{{ a.status === 'open' ? 'Tutup kegiatan' : 'Buka lagi' }}</button>
          <button v-if="isAdmin" type="button" class="kg-btn kg-btn-sm kg-btn-danger" :disabled="busy" @click="removeActivity">Hapus</button>
        </div>
      </header>

      <p v-if="a.description" class="kg-note">{{ a.description }}</p>
      <p class="kg-note">
        <template v-if="a.fee">Biaya <strong>{{ formatRupiah(a.fee) }}</strong> per santri.
          <template v-if="a.savingsBookTitle">Pembayaran dihitung dari setoran di buku <strong>{{ a.savingsBookTitle }}</strong>, tidak perlu dicatat dua kali.</template>
          <template v-else>Tidak ditautkan ke buku tabungan, jadi lunas ditandai manual.</template>
        </template>
        <template v-else>Kegiatan ini tanpa biaya.</template>
        <template v-if="data.limitedToJilid"> Antum melihat dan mengelola peserta dari jilid yang Antum ampu.</template>
      </p>

      <div class="kg-tiles">
        <div class="kg-tile"><strong>{{ sum.total }}</strong><span>peserta</span></div>
        <div v-if="a.fee" class="kg-tile"><strong>{{ sum.lunas }}</strong><span>sudah lunas</span></div>
        <div v-if="a.fee" class="kg-tile" :class="{ 'is-attn': sum.belum }"><strong>{{ sum.belum }}</strong><span>belum lunas</span></div>
        <div v-if="sum.withRequirements" class="kg-tile"><strong>{{ sum.lengkap }}</strong><span>persyaratan lengkap</span></div>
      </div>

      <div class="kg-tabs" role="tablist" aria-label="Bagian kegiatan">
        <button
          type="button"
          role="tab"
          class="kg-tab"
          :aria-selected="activeTab === 'peserta'"
          @click="activeTab = 'peserta'"
        >
          Peserta <span class="kg-tab-count">{{ data.participants.length }}</span>
        </button>
        <button
          type="button"
          role="tab"
          class="kg-tab"
          :aria-selected="activeTab === 'info'"
          @click="activeTab = 'info'"
        >
          Riwayat Info <span class="kg-tab-count">{{ updates.length }}</span>
        </button>
      </div>

      <!-- TAB 1: PESERTA -->
      <section v-show="activeTab === 'peserta'" class="kg-panel" aria-labelledby="kg-peserta">
        <div class="kg-card-top">
          <h2 id="kg-peserta">Peserta</h2>
          <button v-if="a.status === 'open'" type="button" class="kg-btn kg-btn-primary kg-btn-sm" @click="openAdd">+ Tambah peserta</button>
        </div>

        <div v-if="data.participants.length" class="kg-filters">
          <label class="sr-only" for="kg-search">Cari nama</label>
          <input id="kg-search" v-model="search" class="kg-input" placeholder="Cari nama santri" />
          <label class="sr-only" for="kg-jilid">Jilid</label>
          <select id="kg-jilid" v-model="jilidFilter" class="kg-input">
            <option value="">Semua jilid</option>
            <option v-for="id in presentJilid" :key="id" :value="id">{{ levelName(id) }}</option>
          </select>
        </div>
        <div v-if="data.participants.length" class="kg-chips" role="group" aria-label="Saring peserta">
          <button v-for="f in FILTERS" v-show="f.show()" :key="f.value" type="button" class="kg-chip" :aria-pressed="filter === f.value" @click="filter = f.value">
            {{ f.label }} <span>{{ countFor(f.value) }}</span>
          </button>
        </div>

        <p v-if="!data.participants.length" class="kg-empty">Belum ada peserta. Tekan <strong>+ Tambah peserta</strong>.</p>
        <p v-else-if="!visible.length" class="kg-empty">Tidak ada peserta yang cocok.</p>

        <ul v-else class="kg-rows">
          <li v-for="p in visible" :key="p.santriId" class="kg-row">
            <button type="button" class="kg-row-head kg-toggle" :aria-expanded="open === p.santriId" @click="open = open === p.santriId ? null : p.santriId">
              <span class="kg-who">
                <strong>{{ p.name }}</strong>
                <span class="kg-sub">
                  {{ levelName(p.classId) }}<template v-if="p.requirementsTotal"> · {{ p.requirementsDone }}/{{ p.requirementsTotal }} persyaratan</template>
                  · <span :class="p.linkedWali ? 'kg-wa-ok' : 'kg-wa-miss'">{{ p.linkedWali ? 'WA wali tertaut' : 'Belum tertaut WA' }}</span>
                </span>
              </span>
              <span class="kg-row-pills">
                <span class="kg-pill" :class="`is-${STATUS_TONE[p.status] || 'idle'}`">{{ p.statusLabel }}</span>
                <span v-if="a.fee" class="kg-pill" :class="`is-${PAYMENT_TONE[p.payment.state]}`">{{ p.payment.label }}</span>
              </span>
            </button>

            <div v-if="open === p.santriId" class="kg-open">
              <div class="kg-field">
                <label class="kg-label" :for="`st-${p.santriId}`">Status</label>
                <select :id="`st-${p.santriId}`" class="kg-input" :value="p.status" @change="setStatus(p, $event.target.value)">
                  <option v-for="s in PARTICIPANT_STATUSES" :key="s.value" :value="s.value">{{ s.label }}</option>
                </select>
              </div>

              <div v-if="a.requirements.length" class="kg-field">
                <span class="kg-label">Persyaratan</span>
                <div class="kg-checks">
                  <label v-for="r in a.requirements" :key="r.id" class="kg-check">
                    <input type="checkbox" :checked="!!p.checked[r.id]" @change="toggleRequirement(p, r)" />
                    {{ r.label }}
                  </label>
                </div>
              </div>

              <div v-if="a.fee" class="kg-field">
                <span class="kg-label">Pembayaran</span>
                <span class="kg-sub">{{ paymentLine(p.payment) }}</span>
                <div v-if="p.payment.manual" class="kg-inline">
                  <button type="button" class="kg-btn kg-btn-sm" :disabled="busy" @click="clearManual(p)">Batalkan tanda lunas manual</button>
                </div>
                <div v-else-if="p.payment.state !== 'lunas'" class="kg-inline">
                  <input v-model="manualReason[p.santriId]" class="kg-input" maxlength="200" :aria-label="`Alasan lunas manual ${p.name}`" placeholder="Alasan, misalnya: bayar tunai ke admin" />
                  <button type="button" class="kg-btn kg-btn-sm" :disabled="busy || (manualReason[p.santriId] || '').trim().length < 3" @click="markManual(p)">Tandai lunas</button>
                </div>
              </div>

              <div class="kg-field">
                <label class="kg-label" :for="`nt-${p.santriId}`">Catatan (hanya terlihat guru dan admin)</label>
                <textarea :id="`nt-${p.santriId}`" class="kg-input" maxlength="300" :value="p.note" @blur="saveNote(p, $event.target.value)"></textarea>
              </div>

              <div class="kg-inline">
                <button type="button" class="kg-btn kg-btn-sm kg-btn-danger" :disabled="busy" @click="removeParticipant(p)">Keluarkan dari kegiatan</button>
              </div>
            </div>
          </li>
        </ul>
        <p v-if="actionError" class="kg-note is-danger" role="alert">{{ actionError }}</p>
      </section>

      <!-- TAB 2: RIWAYAT INFO KE WALI (CLEAN, DIRECTLY SCANNABLE ON MOBILE) -->
      <section v-show="activeTab === 'info'" ref="infoSectionRef" class="kg-panel" aria-labelledby="kg-info-history">
        <div class="kg-card-top">
          <div>
            <h2 id="kg-info-history">Riwayat info ke wali</h2>
            <p class="kg-sub kg-head-sub">
              {{ allLinkedCount }} tertaut WA Bot<template v-if="allUnlinkedCount"> · {{ allUnlinkedCount }} belum tertaut (salin manual)</template>
            </p>
          </div>
          <button
            v-if="a.status === 'open'"
            type="button"
            class="kg-btn kg-btn-primary kg-btn-sm"
            @click="openInfoSheet"
          >
            + Tulis info
          </button>
        </div>

        <p v-if="a.status !== 'open'" class="kg-note">
          Kegiatan ini sudah ditutup. Info baru tidak bisa dikirim, namun riwayat di bawah tetap tersimpan.
        </p>

        <p v-if="infoError && !infoSheetOpen" class="kg-note is-danger" role="alert">{{ infoError }}</p>

        <div v-if="!updates.length" class="kg-empty-box">
          <p class="kg-empty">Belum ada info kegiatan yang dikirim ke wali santri.</p>
          <button
            v-if="a.status === 'open' && activeParticipants.length"
            type="button"
            class="kg-btn kg-btn-primary"
            @click="openInfoSheet"
          >
            Tulis &amp; kirim info pertama
          </button>
        </div>

        <ul v-else class="kg-upd-list">
          <li v-for="(u, idx) in updates" :key="u.id" class="kg-upd-card" :class="{ 'is-newest': idx === 0 }">
            <div class="kg-upd-head">
              <span class="kg-sub">
                <strong>{{ formatWibDateTime(u.createdAt) }}</strong>
                <template v-if="u.createdByName"> · {{ u.createdByName }}</template>
                · {{ u.targetCount }} peserta
              </span>
              <span v-if="u.sendNow" class="kg-pill is-info">Kirim segera</span>
            </div>

            <div class="kg-upd-body wa-rich" v-html="renderWaMarkdownHtml(u.body)"></div>

            <p v-if="u.contactPhone" class="kg-sub kg-upd-contact">
              Kontak guru: <strong>{{ u.contactName || 'Pengurus' }}</strong> · {{ formatLocalPhone(u.contactPhone) }}
            </p>

            <div class="kg-upd-pills">
              <span v-if="u.wa.sent" class="kg-pill is-ok">{{ u.wa.sent }} WA terkirim</span>
              <span v-if="u.wa.queued" class="kg-pill is-info">{{ u.wa.queued }} antre kirim</span>
              <span v-if="u.wa.held" class="kg-pill is-warn">{{ u.wa.held }} ditahan s/d 06.30</span>
              <span v-if="u.wa.failed" class="kg-pill is-danger">{{ u.wa.failed }} gagal</span>
              <span v-if="!u.wa.total" class="kg-pill is-idle">Hanya Portal Wali</span>
              <span v-if="u.unlinkedSantri.length" class="kg-pill is-warn">{{ u.unlinkedSantri.length }} belum tertaut WA</span>
            </div>

            <div class="kg-inline kg-upd-actions">
              <button type="button" class="kg-btn kg-btn-sm" @click="copyHistoryItem(u)">
                Salin WA
              </button>
              <button
                v-if="u.unlinkedSantri.length"
                type="button"
                class="kg-btn kg-btn-sm"
                @click="openUnlinkedId = openUnlinkedId === u.id ? null : u.id"
              >
                {{ openUnlinkedId === u.id ? 'Tutup salin manual' : `Salin per santri (${u.unlinkedSantri.length})` }}
              </button>
              <button
                type="button"
                class="kg-btn kg-btn-sm kg-btn-danger"
                :disabled="deletingInfoId === u.id"
                @click="removeInfoItem(u)"
              >
                {{ deletingInfoId === u.id ? 'Menghapus…' : 'Hapus' }}
              </button>
            </div>

            <ul v-if="openUnlinkedId === u.id && u.unlinkedSantri.length" class="kg-unlinked-list">
              <li v-for="s in u.unlinkedSantri" :key="s.santriId">
                <span>{{ s.name }}</span>
                <button
                  type="button"
                  class="kg-btn kg-btn-sm"
                  :class="{ 'kg-btn-copied': copiedKey === `${u.id}_${s.santriId}` }"
                  @click="copyForChild(s.name, u.body, { name: u.contactName, phone: u.contactPhone }, `${u.id}_${s.santriId}`)"
                >
                  {{ copiedKey === `${u.id}_${s.santriId}` ? '✓ Disalin' : 'Salin pesan' }}
                </button>
              </li>
            </ul>
          </li>
        </ul>
      </section>
    </template>

    <!-- Focused mobile-first bottom sheet: Kirim info ke wali -->
    <Teleport to="body">
      <div v-if="infoSheetOpen" class="kg-overlay" @click.self="closeInfoSheet">
        <section class="kg-sheet kg-sheet-lg" role="dialog" aria-modal="true" aria-labelledby="kg-info-sheet-title">
          <header class="kg-sheet-head">
            <div class="kg-sheet-title-wrap">
              <h3 id="kg-info-sheet-title">
                {{ sheetSuccessResult ? 'Info berhasil dikirim' : 'Kirim info ke wali' }}
              </h3>
              <span class="kg-sub">{{ a?.title }} · Satu arah via WA Bot &amp; Portal Wali</span>
            </div>
            <button type="button" class="kg-close" aria-label="Tutup" @click="closeInfoSheet">×</button>
          </header>

          <!-- STEP B: Post-send unlinked manual copy helper -->
          <template v-if="sheetSuccessResult">
            <div class="kg-sheet-body">
              <div class="kg-note kg-result-note" role="status">
                <strong v-if="sheetSuccessResult.queued && sheetSuccessResult.heldUntilMorning">
                  ✓ {{ sheetSuccessResult.queued }} pesan WA antre dikirim pukul 06.30 WIB &amp; tampil di Portal Wali.
                </strong>
                <strong v-else-if="sheetSuccessResult.queued">
                  ✓ {{ sheetSuccessResult.queued }} pesan WA masuk antrean kirim WA Bot &amp; tampil di Portal Wali.
                </strong>
                <strong v-else>
                  ✓ Info tersimpan &amp; tampil di Portal Wali.
                </strong>
              </div>

              <div class="kg-unlinked-box">
                <div class="kg-card-top">
                  <div>
                    <strong>{{ sheetSuccessResult.unlinkedSantri.length }} santri belum tertaut WA</strong>
                    <p class="kg-sub">Salin pesan berformat WA di bawah untuk ditempel manual ke WhatsApp orang tua.</p>
                  </div>
                  <button type="button" class="kg-btn kg-btn-sm" @click="copyGeneralUnlinked">
                    Salin umum
                  </button>
                </div>
                <ul class="kg-unlinked-list">
                  <li v-for="u in sheetSuccessResult.unlinkedSantri" :key="u.santriId">
                    <span>{{ u.name }}</span>
                    <button
                      type="button"
                      class="kg-btn kg-btn-sm"
                      :class="{ 'kg-btn-copied': copiedChildren.has(u.santriId) }"
                      @click="copyForUnlinkedPostSend(u)"
                    >
                      {{ copiedChildren.has(u.santriId) ? '✓ Disalin' : 'Salin pesan' }}
                    </button>
                  </li>
                </ul>
              </div>
            </div>
            <footer class="kg-sheet-foot">
              <button type="button" class="kg-btn kg-btn-primary" @click="finishInfoSheet">
                Selesai &amp; lihat riwayat
              </button>
            </footer>
          </template>

          <!-- STEP A: Compose -->
          <template v-else>
            <div class="kg-sheet-body">
              <p v-if="!activeParticipants.length" class="kg-empty">
                Belum ada peserta aktif di kegiatan ini. Tutup lalu tambahkan peserta terlebih dahulu.
              </p>

              <template v-else>
                <!-- 1. Target selector -->
                <div class="kg-field">
                  <span class="kg-label">1. Sasaran peserta</span>
                  <div class="kg-chips" role="group" aria-label="Pilih sasaran peserta">
                    <button type="button" class="kg-chip" :aria-pressed="infoTargetMode === 'all'" @click="infoTargetMode = 'all'">
                      Semua <span>{{ activeParticipants.length }}</span>
                    </button>
                    <button v-if="a.fee" type="button" class="kg-chip" :aria-pressed="infoTargetMode === 'unpaid'" @click="infoTargetMode = 'unpaid'">
                      Belum lunas <span>{{ unpaidTargets.length }}</span>
                    </button>
                    <button v-if="a.requirements.length" type="button" class="kg-chip" :aria-pressed="infoTargetMode === 'incomplete'" @click="infoTargetMode = 'incomplete'">
                      Syarat kurang <span>{{ incompleteTargets.length }}</span>
                    </button>
                    <button type="button" class="kg-chip" :aria-pressed="infoTargetMode === 'selected'" @click="infoTargetMode = 'selected'">
                      Pilih santri <span v-if="infoSelectedIds.length">{{ infoSelectedIds.length }}</span>
                    </button>
                  </div>

                  <div v-if="infoTargetMode === 'selected'" class="kg-info-picker">
                    <button type="button" class="kg-btn kg-btn-sm" @click="toggleSelectAllTargets">
                      {{ allTargetsSelected ? 'Batalkan semua' : `Pilih semua (${activeParticipants.length})` }}
                    </button>
                    <div class="kg-pick kg-pick-sm">
                      <label v-for="p in activeParticipants" :key="p.santriId" class="kg-check">
                        <input v-model="infoSelectedIds" type="checkbox" :value="p.santriId" />
                        <span class="kg-pick-row">
                          <span>{{ p.name }} <span class="kg-sub">· {{ levelName(p.classId) }}</span></span>
                          <span class="kg-pill" :class="p.linkedWali ? 'is-ok' : 'is-warn'">{{ p.linkedWali ? 'WA' : 'Manual' }}</span>
                        </span>
                      </label>
                    </div>
                  </div>

                  <div class="kg-target-summary">
                    <span class="kg-pill is-ok">✓ {{ targetLinked.length }} tertaut WA Bot</span>
                    <span v-if="targetUnlinked.length" class="kg-pill is-warn">{{ targetUnlinked.length }} belum tertaut (salin manual)</span>
                    <span v-if="!targetParticipants.length" class="kg-pill is-danger">Pilih minimal 1 peserta</span>
                  </div>
                </div>

                <!-- 2. Message body (WYSIWYG) -->
                <div class="kg-field">
                  <label class="kg-label" for="kg-info-body">2. Isi informasi</label>
                  <WaRichEditor
                    ref="editorRef"
                    v-model="infoBody"
                    input-id="kg-info-body"
                    :maxlength="2000"
                    :rows="5"
                    :default-preview-open="false"
                    :preview-text="livePreviewText"
                    :preview-caption="previewCaption"
                    :disabled="sendingInfo"
                    placeholder="Contoh: Mohon ananda hadir pukul 05.30 WIB mengenakan seragam putih dan membawa kartu peserta."
                  />
                </div>

                <!-- 3. Guru contact (compact 1-line summary when already filled; expandable to edit) -->
                <div class="kg-field">
                  <div v-if="normalizedContactPhone && !editingContact" class="kg-contact-chip">
                    <div class="kg-contact-chip-text">
                      <span class="kg-label">Kontak langsung di pesan &amp; Portal Wali</span>
                      <span class="kg-sub">{{ infoContactName || 'Pengurus' }} · <strong>{{ formatLocalPhone(normalizedContactPhone) }}</strong></span>
                    </div>
                    <button type="button" class="kg-btn kg-btn-sm" @click="editingContact = true">Ubah</button>
                  </div>

                  <div v-else class="kg-contact-editor">
                    <div class="kg-card-top">
                      <span class="kg-label">Kontak guru terkait (disertakan di pesan)</span>
                      <button
                        v-if="normalizedContactPhone"
                        type="button"
                        class="kg-link-btn"
                        @click="editingContact = false"
                      >
                        Selesai
                      </button>
                    </div>
                    <div class="kg-contact-grid">
                      <div>
                        <label class="sr-only" for="kg-contact-name">Nama guru penanggung jawab</label>
                        <input
                          id="kg-contact-name"
                          v-model="infoContactName"
                          class="kg-input"
                          maxlength="80"
                          placeholder="Nama guru (misal: Ustadz Riski)"
                          :disabled="sendingInfo"
                        />
                      </div>
                      <div>
                        <label class="sr-only" for="kg-contact-phone">Nomor WhatsApp guru</label>
                        <input
                          id="kg-contact-phone"
                          v-model="infoContactPhone"
                          class="kg-input"
                          inputmode="tel"
                          maxlength="24"
                          placeholder="Nomor WA (misal: 082233361877)"
                          :disabled="sendingInfo"
                        />
                      </div>
                    </div>
                    <span v-if="invalidContactPhone" class="kg-error">Nomor WhatsApp belum valid (contoh: 0812xxxxxxxx).</span>
                    <span v-else class="kg-sub">Agar wali bisa langsung chat ke guru terkait bila ada hal yang kurang jelas.</span>
                  </div>
                </div>

                <!-- 4. Quiet hours / send now -->
                <div class="kg-field">
                  <label class="kg-check kg-check-urgent">
                    <input v-model="infoSendNow" type="checkbox" :disabled="sendingInfo" />
                    <span>
                      <strong>Kirim sekarang (mendesak)</strong>
                      <span class="kg-sub kg-block-sub">
                        <template v-if="data.quietHoursNow">Sedang jam tenang (21.00–06.30 WIB). Centang agar langsung terkirim tanpa menunggu 06.30.</template>
                        <template v-else>Lewati jam tenang (21.00–06.30 WIB) bila ingin pesan segera dikirim kapan saja.</template>
                      </span>
                    </span>
                  </label>
                </div>

                <p v-if="infoError" class="kg-note is-danger" role="alert">{{ infoError }}</p>
              </template>
            </div>

            <footer v-if="activeParticipants.length" class="kg-sheet-foot">
              <button
                type="button"
                class="kg-btn kg-btn-copy-foot"
                :disabled="infoBody.trim().length < 3 || invalidContactPhone"
                @click="copyGeneralDraft"
              >
                Salin WA
              </button>
              <button
                type="button"
                class="kg-btn kg-btn-primary kg-btn-send-foot"
                :disabled="sendingInfo || infoBody.trim().length < 3 || !targetParticipants.length || invalidContactPhone"
                @click="submitInfo"
              >
                <template v-if="sendingInfo">Mengirim…</template>
                <template v-else-if="targetLinked.length">Kirim WA Bot ({{ targetLinked.length }})</template>
                <template v-else>Simpan &amp; salin</template>
              </button>
            </footer>
          </template>
        </section>
      </div>
    </Teleport>

    <!-- add participants -->
    <Teleport to="body">
      <div v-if="addOpen" class="kg-overlay" @click.self="addOpen = false">
        <section class="kg-sheet" role="dialog" aria-modal="true" aria-labelledby="kg-add-title">
          <header class="kg-sheet-head">
            <h3 id="kg-add-title">Tambah peserta</h3>
            <button type="button" class="kg-close" aria-label="Tutup" @click="addOpen = false">×</button>
          </header>
          <div class="kg-sheet-body">
            <div class="kg-filters">
              <label class="sr-only" for="kg-pick-search">Cari nama</label>
              <input id="kg-pick-search" v-model="pickSearch" class="kg-input" placeholder="Cari nama santri" />
              <label class="sr-only" for="kg-pick-jilid">Jilid</label>
              <select id="kg-pick-jilid" v-model="pickJilid" class="kg-input">
                <option value="">Semua jilid{{ data?.limitedToJilid ? ' saya' : '' }}</option>
                <option v-for="o in jilidOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
              </select>
            </div>
            <p v-if="pickLoading" class="kg-sub">Memuat daftar santri…</p>
            <p v-else-if="!candidates.length" class="kg-empty">Tidak ada santri yang bisa ditambahkan.</p>
            <template v-else>
              <button type="button" class="kg-btn kg-btn-sm" @click="pickAll">{{ allPicked ? 'Batalkan semua' : `Pilih semua (${candidates.length})` }}</button>
              <div class="kg-pick">
                <label v-for="s in candidates" :key="s.id" class="kg-check">
                  <input v-model="picked" type="checkbox" :value="s.id" />
                  <span>{{ s.name }} <span class="kg-sub">· {{ levelName(normLevel(s.currentClassId)) }}</span></span>
                </label>
              </div>
            </template>
            <p v-if="addError" class="kg-note is-danger" role="alert">{{ addError }}</p>
          </div>
          <footer class="kg-sheet-foot">
            <button type="button" class="kg-btn" @click="addOpen = false">Batal</button>
            <button type="button" class="kg-btn kg-btn-primary" :disabled="busy || !picked.length" @click="addPicked">
              {{ busy ? 'Menambahkan…' : `Tambahkan${picked.length ? ` (${picked.length})` : ''}` }}
            </button>
          </footer>
        </section>
      </div>
    </Teleport>

    <KegiatanForm v-if="form" :activity="a" :books="books" :busy="busy" :error="formError" :errors="formErrors" @close="form = false" @save="saveActivity" />
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'
import PageSkeleton from '@/components/PageSkeleton.vue'
import KegiatanForm from '@/components/KegiatanForm.vue'
import WaRichEditor from '@/components/WaRichEditor.vue'
import { useAuthStore } from '@/stores/auth'
import { useDialog } from '@/composables/useDialog'
import { useToast } from '@/composables/useToast'
import { PARTICIPANT_STATUSES, PAYMENT_TONE, STATUS_TONE, dayLabel, formatRupiah, paymentLine, summarize } from '@/utils/kegiatan'
import {
  buildActivityWaText,
  formatLocalPhone,
  formatWibDateTime,
  normalizeWaPhone,
  renderWaMarkdownHtml,
} from '@/utils/waFormat'
import './kegiatan.css'

const route = useRoute()
const { ask } = useDialog()
const toast = useToast()
const router = useRouter()
const authStore = useAuthStore()
const isAdmin = computed(() => authStore.user?.role === 'admin')
const id = route.params.id

const data = ref(null)
const loading = ref(true)
const loadError = ref('')
const busy = ref(false)
const actionError = ref('')
const activeTab = ref('peserta')
const search = ref('')
const jilidFilter = ref('')
const filter = ref('all')
const open = ref(null)
const manualReason = reactive({})
const form = ref(false)
const books = ref([])
const formError = ref('')
const formErrors = ref({})

/* ---- info ke wali sheet & history state */
const infoSheetOpen = ref(false)
const infoSectionRef = ref(null)
const editorRef = ref(null)
const infoTargetMode = ref('all')
const infoSelectedIds = ref([])
const infoContactName = ref('')
const infoContactPhone = ref('')
const editingContact = ref(false)
const infoBody = ref('')
const infoSendNow = ref(false)
const sendingInfo = ref(false)
const deletingInfoId = ref('')
const infoError = ref('')
const sheetSuccessResult = ref(null)
const copiedChildren = ref(new Set())
const copiedKey = ref('')
const openUnlinkedId = ref(null)
let contactInitialized = false

const a = computed(() => data.value.activity)
const updates = computed(() => data.value?.updates || [])
const sum = computed(() => summarize(data.value?.participants || []))
const normLevel = (v) => {
  const s = String(v ?? '').trim().toLowerCase()
  return ['7', '8', '9', 'marhalah'].includes(s) ? '7' : s
}
const levelName = (lv) => (String(lv) === '7' ? 'Marhalah' : lv ? `Jilid ${lv}` : 'Belum ada jilid')
const ALL_JILID = [...[1, 2, 3, 4, 5, 6].map((n) => ({ value: String(n), label: `Jilid ${n}` })), { value: '7', label: 'Marhalah' }]

const FILTERS = [
  { value: 'all', label: 'Semua', show: () => true },
  { value: 'unpaid', label: 'Belum lunas', show: () => !!a.value.fee },
  { value: 'incomplete', label: 'Persyaratan belum lengkap', show: () => sum.value.withRequirements },
  { value: 'lulus', label: 'Lulus', show: () => true },
]
const matches = (p, f) => {
  if (f === 'unpaid') return p.status !== 'batal' && ['belum', 'sebagian'].includes(p.payment.state)
  if (f === 'incomplete') return p.status !== 'batal' && p.requirementsTotal > 0 && p.requirementsDone < p.requirementsTotal
  if (f === 'lulus') return p.status === 'lulus'
  return true
}
const presentJilid = computed(() => [...new Set(data.value.participants.map((p) => p.classId))].sort((x, y) => x.localeCompare(y, undefined, { numeric: true })))
const byJilid = computed(() => data.value.participants.filter((p) => !jilidFilter.value || p.classId === jilidFilter.value))
const countFor = (f) => byJilid.value.filter((p) => matches(p, f)).length
const visible = computed(() => {
  const q = search.value.trim().toLowerCase()
  return byJilid.value.filter((p) => matches(p, filter.value) && (!q || p.name.toLowerCase().includes(q)))
})

/* ---- info ke wali targeting & preview */
const activeParticipants = computed(() => (data.value?.participants || []).filter((p) => p.status !== 'batal'))
const allLinkedCount = computed(() => activeParticipants.value.filter((p) => p.linkedWali).length)
const allUnlinkedCount = computed(() => activeParticipants.value.filter((p) => !p.linkedWali).length)
const unpaidTargets = computed(() => activeParticipants.value.filter((p) => ['belum', 'sebagian'].includes(p.payment.state)))
const incompleteTargets = computed(() => activeParticipants.value.filter((p) => p.requirementsTotal > 0 && p.requirementsDone < p.requirementsTotal))
const targetParticipants = computed(() => {
  if (infoTargetMode.value === 'unpaid') return unpaidTargets.value
  if (infoTargetMode.value === 'incomplete') return incompleteTargets.value
  if (infoTargetMode.value === 'selected') {
    const set = new Set(infoSelectedIds.value)
    return activeParticipants.value.filter((p) => set.has(p.santriId))
  }
  return activeParticipants.value
})
const targetLinked = computed(() => targetParticipants.value.filter((p) => p.linkedWali))
const targetUnlinked = computed(() => targetParticipants.value.filter((p) => !p.linkedWali))
const allTargetsSelected = computed(
  () => activeParticipants.value.length > 0 && activeParticipants.value.every((p) => infoSelectedIds.value.includes(p.santriId)),
)
const toggleSelectAllTargets = () => {
  infoSelectedIds.value = allTargetsSelected.value ? [] : activeParticipants.value.map((p) => p.santriId)
}

const normalizedContactPhone = computed(() => normalizeWaPhone(infoContactPhone.value))
const invalidContactPhone = computed(() => String(infoContactPhone.value || '').trim().length > 0 && !normalizedContactPhone.value)

const sampleChildName = computed(() => targetLinked.value[0]?.name || targetParticipants.value[0]?.name || 'Ananda')
const livePreviewText = computed(() => buildActivityWaText({
  activityTitle: a.value?.title || '',
  activityDate: a.value?.date || '',
  children: [sampleChildName.value],
  body: infoBody.value,
  contactName: infoContactName.value.trim(),
  contactPhone: normalizedContactPhone.value,
  senderName: authStore.user?.displayName || '',
}))
const previewCaption = computed(() => `Contoh tampilan di WhatsApp wali (misal wali dari ${sampleChildName.value})`)

function openInfoSheet() {
  infoError.value = ''
  sheetSuccessResult.value = null
  copiedChildren.value = new Set()
  editingContact.value = !normalizedContactPhone.value
  infoSheetOpen.value = true
}

function closeInfoSheet() {
  if (sendingInfo.value) return
  infoSheetOpen.value = false
  sheetSuccessResult.value = null
}

async function finishInfoSheet() {
  infoSheetOpen.value = false
  sheetSuccessResult.value = null
  activeTab.value = 'info'
  await nextTick()
  infoSectionRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

async function copyToClipboard(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    /* fallback below */
  }
  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.setAttribute('readonly', '')
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    return ok
  } catch {
    return false
  }
}

async function copyGeneralDraft() {
  const text = buildActivityWaText({
    activityTitle: a.value.title,
    activityDate: a.value.date || '',
    children: [],
    body: infoBody.value,
    contactName: infoContactName.value.trim(),
    contactPhone: normalizedContactPhone.value,
    senderName: authStore.user?.displayName || '',
    isCopy: true,
  })
  if (await copyToClipboard(text)) toast.success('Pesan berformat WA disalin ke clipboard.')
  else toast.error('Gagal menyalin pesan.')
}

async function copyGeneralUnlinked() {
  const text = sheetSuccessResult.value?.copyText || ''
  if (!text) return
  if (await copyToClipboard(text)) toast.success('Pesan umum disalin, siap ditempel ke WhatsApp.')
  else toast.error('Gagal menyalin pesan.')
}

async function copyForUnlinkedPostSend(u) {
  const res = sheetSuccessResult.value
  if (!res) return
  const ok = await copyForChild(u.name, res.body, res.contact)
  if (ok) {
    const next = new Set(copiedChildren.value)
    next.add(u.santriId)
    copiedChildren.value = next
  }
}

async function copyForChild(childName, bodyText, contact = {}, key = '') {
  const text = buildActivityWaText({
    activityTitle: a.value.title,
    activityDate: a.value.date || '',
    children: [childName],
    body: bodyText,
    contactName: contact?.name || '',
    contactPhone: contact?.phone || '',
    senderName: authStore.user?.displayName || '',
    isCopy: true,
  })
  const ok = await copyToClipboard(text)
  if (ok) {
    if (key) copiedKey.value = key
    toast.success(`Pesan untuk wali ${childName} disalin.`)
  } else {
    toast.error('Gagal menyalin pesan.')
  }
  return ok
}

async function copyHistoryItem(u) {
  const text = buildActivityWaText({
    activityTitle: a.value.title,
    activityDate: a.value.date || '',
    children: [],
    body: u.body,
    contactName: u.contactName || '',
    contactPhone: u.contactPhone || '',
    senderName: u.createdByName || '',
    isCopy: true,
  })
  if (await copyToClipboard(text)) toast.success('Pesan riwayat disalin dalam format WA.')
  else toast.error('Gagal menyalin pesan.')
}

async function removeInfoItem(u) {
  const pendingWa = Number(u.wa?.queued || 0) + Number(u.wa?.held || 0)
  const sentWa = Number(u.wa?.sent || 0)
  const notes = ['Info ini akan dihapus permanen dari database, riwayat, dan Portal Wali.']
  if (pendingWa > 0) notes.push(`${pendingWa} pesan WA yang masih antre akan ikut dibatalkan otomatis.`)
  if (sentWa > 0) notes.push(`${sentWa} pesan WA yang sudah telanjur terkirim ke WhatsApp wali tidak dapat ditarik oleh bot.`)
  const ok = await ask({
    title: 'Hapus info kegiatan?',
    message: notes.join(' '),
    tone: 'danger',
    confirmText: 'Hapus info',
  })
  if (!ok) return

  deletingInfoId.value = u.id
  infoError.value = ''
  try {
    const { data: res } = await api.delete(`/activities/${id}/info/${u.id}`)
    if (data.value && Array.isArray(res.updates)) {
      data.value.updates = res.updates
    }
    if (openUnlinkedId.value === u.id) {
      openUnlinkedId.value = null
    }
    toast.success(
      res.messagesDropped
        ? `Info dihapus & ${res.messagesDropped} antrean WA dibatalkan.`
        : 'Info kegiatan dihapus dari riwayat & Portal Wali.',
    )
  } catch (err) {
    infoError.value = err.response?.data?.error || 'Info belum bisa dihapus. Coba lagi.'
  } finally {
    deletingInfoId.value = ''
  }
}

async function submitInfo() {
  infoError.value = ''
  const linkedCount = targetLinked.value.length
  const unlinkedCount = targetUnlinked.value.length
  const parts = []
  if (linkedCount) {
    parts.push(`${linkedCount} santri tertaut WA akan dikirimi pesan otomatis oleh WA Bot${data.value?.quietHoursNow && !infoSendNow.value ? ' (antre hingga pukul 06.30 WIB)' : ' sekarang'}.`)
  } else {
    parts.push('Belum ada santri tertaut WA pada sasaran ini — info tetap disimpan ke Portal Wali dan teks salinan disiapkan.')
  }
  if (unlinkedCount) {
    parts.push(`${unlinkedCount} santri belum tertaut WA tidak dikirimi bot dan bisa disalin manual.`)
  }
  const ok = await ask({
    title: linkedCount ? 'Kirim info ke wali peserta?' : 'Simpan info kegiatan?',
    message: parts.join(' '),
    confirmText: linkedCount ? 'Kirim via WA Bot' : 'Simpan info',
  })
  if (!ok) return

  sendingInfo.value = true
  const submittedBody = infoBody.value.trim()
  try {
    const payload = {
      body: submittedBody,
      targetMode: infoTargetMode.value,
      santriIds: infoTargetMode.value === 'selected' ? infoSelectedIds.value : undefined,
      sendNow: infoSendNow.value,
      contactName: infoContactName.value.trim(),
      contactPhone: infoContactPhone.value.trim(),
    }
    const { data: res } = await api.post(`/activities/${id}/info`, payload)
    if (data.value && Array.isArray(res.updates)) {
      data.value.updates = res.updates
    }
    infoBody.value = ''
    infoSendNow.value = false
    toast.success(
      res.queued
        ? res.heldUntilMorning
          ? `${res.queued} pesan WA antre dikirim pukul 06.30 WIB.`
          : `${res.queued} pesan WA masuk antrean WA Bot.`
        : 'Info kegiatan tersimpan di Portal Wali.',
    )

    if (res.unlinkedSantri?.length) {
      sheetSuccessResult.value = { ...res, body: submittedBody }
      copiedChildren.value = new Set()
    } else {
      await finishInfoSheet()
    }
  } catch (err) {
    infoError.value = err.response?.data?.error || 'Info belum bisa dikirim. Coba lagi.'
  } finally {
    sendingInfo.value = false
  }
}

async function load(quiet = false) {
  if (!quiet) loading.value = true
  loadError.value = ''
  try {
    const { data: d } = await api.get(`/activities/${id}`, { cache: false })
    data.value = d
    if (!contactInitialized && d.contact) {
      infoContactName.value = d.contact.name || ''
      infoContactPhone.value = d.contact.phone ? formatLocalPhone(d.contact.phone) : ''
      contactInitialized = true
    }
  } catch (err) {
    loadError.value = err.response?.data?.error || 'Kegiatan belum bisa dimuat.'
  } finally {
    loading.value = false
  }
}

async function act(fn) {
  busy.value = true
  actionError.value = ''
  try {
    await fn()
  } catch (err) {
    actionError.value = err.response?.data?.error || 'Belum tersimpan. Coba lagi.'
    await load(true)
  } finally {
    busy.value = false
  }
}
const patch = (p, body) => api.patch(`/activities/${id}/participants/${p.santriId}`, body)

// each change is shown at once and saved; a failure reloads the true state
const setStatus = (p, value) => act(async () => {
  await patch(p, { status: value })
  p.status = value
  p.statusLabel = PARTICIPANT_STATUSES.find((s) => s.value === value)?.label || p.statusLabel
})
const toggleRequirement = (p, r) => act(async () => {
  const on = !p.checked[r.id]
  await patch(p, { checked: { [r.id]: on } })
  const next = { ...p.checked }
  if (on) next[r.id] = true
  else delete next[r.id]
  p.checked = next
  p.requirementsDone = a.value.requirements.filter((x) => next[x.id]).length
})
const saveNote = (p, value) => {
  if (value.trim() === (p.note || '').trim()) return
  return act(async () => {
    await patch(p, { note: value })
    p.note = value.trim()
  })
}
const markManual = (p) => act(async () => {
  await patch(p, { lunasManual: { on: true, note: manualReason[p.santriId] } })
  manualReason[p.santriId] = ''
  await load(true)
})
const clearManual = (p) => act(async () => {
  await patch(p, { lunasManual: { on: false } })
  await load(true)
})
const removeParticipant = async (p) => {
  const ok = await ask({
    title: 'Keluarkan dari kegiatan?',
    message: `${p.name} dikeluarkan dari ${a.value.title}. Centang persyaratan dan catatannya ikut terhapus.`,
    tone: 'danger',
    confirmText: 'Keluarkan',
  })
  if (!ok) return
  return act(async () => {
    await api.delete(`/activities/${id}/participants/${p.santriId}`)
    open.value = null
    await load(true)
  })
}

/* ---- the activity itself */
async function openForm() {
  formError.value = ''
  formErrors.value = {}
  try {
    books.value = (await api.get('/activities/books', { cache: false })).data || []
  } catch {
    books.value = []
  }
  form.value = true
}
async function saveActivity(payload) {
  busy.value = true
  formError.value = ''
  formErrors.value = {}
  try {
    await api.put(`/activities/${id}`, payload)
    form.value = false
    await load(true)
  } catch (err) {
    formErrors.value = err.response?.data?.fields || {}
    formError.value = err.response?.data?.error || 'Belum tersimpan.'
  } finally {
    busy.value = false
  }
}
const toggleClosed = () => act(async () => {
  const x = a.value
  await api.put(`/activities/${id}`, { ...x, status: x.status === 'open' ? 'closed' : 'open' })
  await load(true)
})
const removeActivity = async () => {
  const ok = await ask({
    title: 'Hapus kegiatan?',
    message: `"${a.value.title}" beserta ${data.value.participants.length} pesertanya akan dihapus dan tidak bisa dikembalikan. Untuk menyimpan riwayatnya, pilih "Tutup kegiatan".`,
    tone: 'danger',
    confirmText: 'Hapus kegiatan',
  })
  if (!ok) return
  return act(async () => {
    await api.delete(`/activities/${id}`)
    router.push('/dashboard/kegiatan')
  })
}

/* ---- adding participants: the santri of the jilid this person manages, who are not in yet */
const addOpen = ref(false)
const santriAll = ref([])
const pickLoading = ref(false)
const pickSearch = ref('')
const pickJilid = ref('')
const picked = ref([])
const addError = ref('')
const jilidOptions = computed(() => {
  const lim = data.value?.limitedToJilid
  return lim ? ALL_JILID.filter((o) => lim.includes(o.value)) : ALL_JILID
})
const candidates = computed(() => {
  const taken = new Set(data.value.participants.map((p) => p.santriId))
  const lim = data.value.limitedToJilid
  const q = pickSearch.value.trim().toLowerCase()
  return santriAll.value
    .filter((s) => ['aktif', '-', ''].includes(String(s.status || 'aktif').toLowerCase()) && !taken.has(s.id))
    .filter((s) => !lim || lim.includes(normLevel(s.currentClassId)))
    .filter((s) => !pickJilid.value || normLevel(s.currentClassId) === pickJilid.value)
    .filter((s) => !q || String(s.name || '').toLowerCase().includes(q))
})
const allPicked = computed(() => candidates.value.length > 0 && candidates.value.every((s) => picked.value.includes(s.id)))
const pickAll = () => {
  picked.value = allPicked.value ? picked.value.filter((x) => !candidates.value.some((s) => s.id === x)) : [...new Set([...picked.value, ...candidates.value.map((s) => s.id)])]
}
async function openAdd() {
  addOpen.value = true
  addError.value = ''
  picked.value = []
  pickSearch.value = ''
  pickJilid.value = ''
  if (santriAll.value.length) return
  pickLoading.value = true
  try {
    santriAll.value = (await api.get('/santri', { cache: false })).data || []
  } catch (err) {
    addError.value = err.response?.data?.error || 'Daftar santri belum bisa dimuat.'
  } finally {
    pickLoading.value = false
  }
}
async function addPicked() {
  busy.value = true
  addError.value = ''
  try {
    await api.post(`/activities/${id}/participants`, { santriIds: picked.value })
    addOpen.value = false
    await load(true)
  } catch (err) {
    addError.value = err.response?.data?.error || 'Belum bisa menambahkan.'
  } finally {
    busy.value = false
  }
}

onMounted(() => load())
</script>
