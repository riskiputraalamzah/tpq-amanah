import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { squash, has } from "./helpers/sourceText.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const read = (p) => fs.readFileSync(path.join(here, "..", p), "utf8");
const view = squash(read("src/views/dashboard/guru/AbsenSantriView.vue"));

test("a tap remembers its own day and sesi, so a retry can never land on another day", () => {
  assert.ok(has(view, "const keyOf = (d, sl, id) => `${d}|${sl}|${id}`"));
  assert.ok(has(view, "pending.set(keyOf(d, sl, santriId), { date: d, slot: sl, santriId, status, override })"));
  // the request is built from the batch's own day and sesi, not from what is on screen now
  assert.ok(has(view, "api.put('/santri-presence', { ...ctx, marks, ...(ctx.date < today ? { confirmLate: true } : {}) })"));
  assert.ok(!has(view, "date: date.value, slot: slot.value, marks"), "the old send used the current view");
});

test("requests go one after another, and a failure that may pass keeps the taps and retries by itself", () => {
  assert.ok(has(view, "chain = chain.then(sendAll, sendAll)"));
  assert.ok(has(view, "const retriable = (err) => !err.response || err.response.status >= 500 || [408, 429].includes(err.response.status)"));
  assert.ok(has(view, "const RETRY_AFTER = [4000, 10000, 25000]"));
  assert.ok(has(view, "window.addEventListener('online', onOnline)"));
  assert.ok(has(view, "@click=\"retryNow\""));
  // a server "no" is not re-queued forever: it is told to the person
  assert.ok(has(view, "refusal = data?.error || 'Perubahan ditolak server.'"));
  assert.ok(has(view, "<p v-if=\"saveNote\""));
});

test("switching day or sesi does not wait for the network and shows no old rows on the new day", () => {
  assert.ok(has(view, "sheet.value = null // the old day's rows are never tapped on a new day"));
  const setSlot = view.slice(view.indexOf("function setSlot"), view.indexOf("function setDate"));
  assert.ok(!setSlot.includes("await"), "no waiting for the save before switching");
  assert.ok(has(view, "loadSeq"), "a late answer to an old question is dropped");
});

test("leaving with something unsent: warned on the way out of the page, and in the browser", () => {
  assert.ok(has(view, "onBeforeRouteLeave(async () => { await flush()"));
  assert.ok(has(view, "window.addEventListener('beforeunload', onBeforeUnload)"));
  assert.ok(has(view, "title: 'Ada yang belum tersimpan'"));
});

test("a double tap does not undo the tap; the sheet refreshes when the tab comes back and by itself", () => {
  assert.ok(has(view, "now - lastTap.at < 450"));
  assert.ok(has(view, "else if (!pending.size && sheet.value) load({ silent: true })"));
  assert.ok(has(view, "setInterval(() =>"));
  assert.ok(has(view, "if (silent && (pending.size || sending > 0)) return"), "a refresh never replaces taps on their way");
});

test("a parent's izin/sakit row is locked: no buttons, an explicit confirmation in our own dialog, then the change says override", () => {
  assert.ok(has(view, "const isLocked = (id) => records.value[id]?.locked === true && !unlocked.value[id]"));
  assert.ok(has(view, ":disabled=\"!sheet.canEdit || isLocked(s.id)\""));
  assert.ok(has(view, "'is-locked': isLocked(s.id)"));
  assert.ok(has(view, "const { ask } = useDialog()"));
  assert.ok(has(view, "confirmText: 'Ya, ubah'"));
  assert.ok(has(view, "...(m.override ? { override: true } : {})"));
  assert.ok(has(view, "const override = records.value[santriId]?.locked === true"));
  assert.ok(!/\bconfirm\(/.test(read("src/views/dashboard/guru/AbsenSantriView.vue")), "no browser confirm()");
  // a locked row is not changed by the bulk "Tandai sisanya hadir" (it has a status already) or by a stray tap
  assert.ok(has(view, "if (isLocked(santriId)) return"));
  assert.ok(has(view, "g.items.filter((s) => !statusOf(s.id))"));
});

test("the parent's page says the teachers were told", () => {
  const wali = squash(read("src/views/wali/WaliIzin.vue"));
  assert.ok(has(wali, "teachersNotified: data.teachersNotified || 0"));
  assert.ok(has(wali, "sudah diberi tahu lewat WhatsApp"));
});
