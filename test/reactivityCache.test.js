import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { squash, has } from "./helpers/sourceText.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const read = (p) => squash(fs.readFileSync(path.join(here, "..", p), "utf8"));

test("api.js: tracks mutationVersion, clears inFlightRequests, and forces fresh=1 on server-cached endpoints after mutations", () => {
  const apiSrc = read("src/services/api.js");
  assert.ok(has(apiSrc, "SERVER_CACHED_URLS = [ '/guru-dashboard', '/admin-dashboard', '/kbm-monitor' ]"));
  assert.ok(has(apiSrc, "if (method === 'get' && needsFreshServerRead(config.url)) { config.params = { ...(config.params || {}), fresh: '1' }; config.cache = false; }") || has(apiSrc, "needsFreshServerRead(config.url)"));
  assert.ok(has(apiSrc, "mutationVersion === startVersion"), "in-flight pre-mutation GET must not poison cache after mutation");
  assert.ok(has(apiSrc, "inFlightRequests.delete(key)"), "in-flight GET dedup entries cleared on mutation");
  assert.ok(has(apiSrc, "isNoClientCacheUrl(config.url)"), "dynamic operational KBM/LPJ/dashboard endpoints skip stale client cache");
});

test("dashboards & KBM Monitor silently refresh on tab return (visibilitychange)", () => {
  for (const file of [
    "src/views/dashboard/guru/GuruDashboard.vue",
    "src/views/dashboard/admin/AdminDashboard.vue",
    "src/views/dashboard/admin/KbmMonitorView.vue",
  ]) {
    const src = read(file);
    assert.ok(has(src, "document.addEventListener('visibilitychange', onVisible)"), `${file} listens to visibilitychange`);
    assert.ok(has(src, "document.removeEventListener('visibilitychange', onVisible)"), `${file} cleans up visibilitychange`);
    assert.ok(has(src, "load(true, { silent: true })"), `${file} fetches fresh data silently on tab return`);
  }
});

test("DailyWorkspace, QuickAttendance, KBM views bypass client GET cache for operational reads", () => {
  const dw = read("src/views/dashboard/guru/DailyWorkspace.vue");
  assert.ok(has(dw, "api.get('/teaching_sessions/daily-context', { params: { date: targetDate.value }, cache: false })"));
  assert.ok(has(dw, "api.get('/teaching_sessions/level-context', { params: { date: targetDate.value, levelId, slotId: selectedSlotId.value }, cache: false })"));

  const qa = read("src/views/QuickAttendanceView.vue");
  assert.ok(has(qa, "api.get(`/attendance/quick/${route.params.code}`, { cache: false })"));
  assert.ok(has(qa, "markDataMutated()"));

  const jv = read("src/views/dashboard/guru/JournalView.vue");
  assert.ok(has(jv, "api.get(`/teaching_sessions/${sessionId}`, { cache: false })"));

  const sv = read("src/views/dashboard/guru/StudentAttendanceView.vue");
  assert.ok(has(sv, "api.get(`/teaching_sessions/${sessionId}`, { cache: false })"));

  const apiSrc = read("src/services/api.js");
  assert.ok(has(apiSrc, "'/teaching_sessions'"));
  assert.ok(has(apiSrc, "'/ljp/'"));
});

test("sidebar badge composables bypass 60s throttle immediately after any mutation", () => {
  for (const file of [
    "src/composables/usePendaftaranCount.js",
    "src/composables/useWaliBadge.js",
    "src/composables/useWaliFeedbackBadge.js",
  ]) {
    const src = read(file);
    assert.ok(has(src, "getLastMutationAt() > lastAt"), `${file} refreshes after mutation`);
  }
});
