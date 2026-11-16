import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { botStatusOf, lastRunItems, relativeTime, WA_CATEGORY } from "../src/utils/waBotStatus.js";
import { squash, has } from "./helpers/sourceText.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const read = (p) => fs.readFileSync(path.join(here, "..", p), "utf8");
const NOW = Date.parse("2026-11-16T06:00:00Z");
const ago = (min) => new Date(NOW - min * 60000).toISOString();

test("bot status: online, needs a QR scan, reconnecting, dropped, silent, never seen", () => {
  assert.deepEqual(
    [botStatusOf({ lastSyncAt: ago(1), waState: "ready" }, NOW).label, botStatusOf({ lastSyncAt: ago(1), waState: "ready" }, NOW).tone],
    ["Online", "ok"],
  );
  assert.equal(botStatusOf({ lastSyncAt: ago(2), waState: "QR_RECEIVED" }, NOW).label, "Perlu scan QR");
  assert.equal(botStatusOf({ lastSyncAt: ago(2), waState: "RECONNECTING" }, NOW).tone, "warn");
  assert.deepEqual([botStatusOf({ lastSyncAt: ago(2), waState: "UNPAIRED" }, NOW).label, botStatusOf({ lastSyncAt: ago(2), waState: null }, NOW).tone], ["WA terputus", "danger"]);
  const silent = botStatusOf({ lastSyncAt: ago(11), waState: "ready" }, NOW);
  assert.deepEqual([silent.label, silent.tone], ["Bot tidak aktif", "danger"], "no word for 10 minutes: the bot itself is down, whatever it said last");
  assert.match(silent.text, /11 menit lalu/);
  assert.equal(botStatusOf({}, NOW).label, "Belum terhubung");
  assert.equal(botStatusOf(null, NOW).label, "Memeriksa…");
  assert.equal(botStatusOf({ lastSyncAt: { _seconds: (NOW - 20000) / 1000 }, waState: "ready" }, NOW).seen, "baru saja", "a Firestore timestamp works too");
  assert.equal(relativeTime(new Date(NOW - 3 * 3600000), NOW), "3 jam lalu");
});

test("the bot's last runs, labelled", () => {
  const items = lastRunItems({ start: { at: ago(30), sent: 5, failed: 1 }, unknown: { at: ago(1) } });
  assert.equal(items.length, 1);
  assert.equal(items[0].label, "Pesan awal sesi");
  assert.match(items[0].value, /5 terkirim, 1 gagal$/);
  assert.equal(WA_CATEGORY.wali_info, "Info wali");
});

test("one menu item for everything WhatsApp; announcements sit with it under Komunikasi", () => {
  const layout = squash(read("src/views/dashboard/DashboardLayout.vue"));
  const start = layout.indexOf(squash("const ADMIN_GROUPS = ["));
  const admin = layout.slice(start, layout.indexOf(squash("const menuGroups"), start));
  const titles = [...admin.matchAll(/title:'([^']+)'/g)].map((m) => m[1]);
  assert.deepEqual(titles, ["Santri&Wali", "BelajarMengajar", "Keuangan", "Komunikasi", "Pengaturan"]);
  for (const old of ["label:'BroadcastWA'", "label:'PengingatWAGuru'", "label:'Riwayat&AntreanWA'"]) assert.ok(!admin.includes(old), `${old} is a tab now, not a menu item`);
  assert.ok(has(admin, "{ to: '/dashboard/whatsapp', label: 'Pusat WhatsApp'"));
  const komunikasi = admin.slice(admin.indexOf("title:'Komunikasi'"), admin.indexOf("title:'Pengaturan'"));
  assert.deepEqual([...komunikasi.matchAll(/label:'([^']+)'/g)].map((m) => m[1]), ["PusatWhatsApp", "PengumumanWali", "PengumumanGuru&Web"]);
});

test("the WhatsApp pages share one tab bar with the live bot status", () => {
  const nav = read("src/components/WaHubNav.vue");
  for (const to of ["/dashboard/whatsapp", "/dashboard/wa-log", "/dashboard/broadcasts", "/dashboard/wa-reminders"]) assert.ok(nav.includes(`to: '${to}'`), to);
  assert.ok(nav.includes("botStatusOf(live.state.bot"), "status from the shared live data");
  assert.ok(read("src/views/dashboard/admin/BroadcastManagement.vue").includes("<WaHubNav />"));
  assert.ok(read("src/views/dashboard/admin/WaLogView.vue").includes('<WaHubNav v-if="isAdmin" />'), "a guru with the Riwayat access sees no admin tabs");
  assert.ok(read("src/views/dashboard/admin/WhatsAppHubView.vue").includes("<WaHubNav />"));
  const router = read("src/router/index.js");
  assert.match(router, /path: "whatsapp",[\s\S]*?WhatsAppHubView\.vue[\s\S]*?meta: \{ role: "admin" \}/);
});

test("live without reloading: one shared poller, only what is new, paused when hidden, slower when calm", () => {
  const live = squash(read("src/composables/useWaLive.js"));
  assert.ok(has(live, "api.get('/wa-log/live', { headers, cache: false })"));
  assert.ok(has(live, "const headers = { 'X-Wa-Since': since || '', 'X-Wa-Queue': wantQueue ? '1' : '0' }"), "only what arrived since the last look; same URL and headers every time (one CORS preflight)");
  assert.ok(has(live, "if (!users || document.visibilityState !== 'visible') return"), "nothing while the tab is hidden or no page uses it");
  assert.ok(has(live, "Date.now() - lastChange < CALM_AFTER_MS ? FAST_MS : SLOW_MS"));
  assert.ok(has(live, "polls % 3 === 0"), "the queue every third poll");
  assert.ok(has(live, "filter((r) => !seen.has(r.id))"), "the overlap never doubles a message");
  const log = squash(read("src/views/dashboard/admin/WaLogView.vue"));
  assert.ok(has(log, "watch(() => live.state.tick"), "Riwayat merges new messages as they come");
  assert.ok(!has(log, "setInterval(() =>"), "the old one-minute reload is gone");
  assert.ok(has(log, "live.setQueue(d)"), "a send-now / cancel shows everywhere at once");
});

test("old names in hints point to the new place", () => {
  for (const f of ["src/views/dashboard/admin/KbmMonitorView.vue", "src/views/dashboard/admin/LpjInsentifView.vue"]) {
    assert.ok(!read(f).includes("menu Notifikasi WA"), f);
  }
  assert.ok(read("src/views/dashboard/admin/AdminDashboard.vue").includes('<router-link to="/dashboard/whatsapp" class="ad-mini is-link">'));
});
