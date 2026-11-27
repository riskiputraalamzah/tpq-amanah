import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { cancelPlan, noticeLine, cancelResultText } from "../src/utils/izinNotice.js";
import { squash, has } from "./helpers/sourceText.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const read = (p) => squash(fs.readFileSync(path.join(here, "..", p), "utf8"));

// 2-minute undo window of the teachers' WhatsApp (backend wali_izin_service.js)
const now = new Date("2026-11-27T00:45:00Z"); // 07:45 WIB
const waiting = { state: "waiting", reached: 0, waiting: 1, sendAfter: "2026-11-27T00:46:30Z" };

test("cancel plan: still waiting -> taken back; went (or the window is over) -> correction with apology; none -> plain", () => {
  assert.equal(cancelPlan(waiting, now), "retract");
  assert.equal(cancelPlan({ ...waiting, sendAfter: "2026-11-27T00:44:00Z" }, now), "apologize", "the bot may be sending it right now");
  assert.equal(cancelPlan({ state: "sent", reached: 2 }, now), "apologize");
  assert.equal(cancelPlan({ state: "unknown" }, now), "apologize", "an izin from before: assume the teachers read it");
  assert.equal(cancelPlan({ state: "none" }, now), "plain");
  assert.equal(cancelPlan(null, now), "plain");
});

test("status line and toast texts", () => {
  assert.match(noticeLine(waiting, now), /^WA ke guru dikirim pukul 07[.:]46 · batalkan sebelum itu/);
  assert.equal(noticeLine({ state: "sent", reached: 2 }, now), "WA terkirim ke 2 guru");
  assert.equal(noticeLine({ state: "none" }, now), "");
  assert.equal(cancelResultText("Izin Naila", { teachersNotified: 0, noticeWithdrawn: 2 }), "Izin Naila dibatalkan. Pesan WA ke guru ditarik sebelum terkirim.");
  assert.equal(cancelResultText("Izin Naila", { teachersNotified: 1, noticeWithdrawn: 0 }), "Izin Naila dibatalkan. Ralat & permintaan maaf dikirim ke 1 guru.");
  assert.equal(cancelResultText("Izin Naila", {}), "Izin Naila dibatalkan");
});

test("both izin pages send the optional note with the cancel and ask for it only when the message went", () => {
  const staff = read("src/views/dashboard/guru/IzinSantriView.vue");
  assert.ok(has(staff, "api.delete(`/santri-presence/izin/${encodeURIComponent(item.id)}`, { data: { note } })"));
  assert.ok(has(staff, "if (plan === 'apologize') {"));
  assert.ok(has(staff, "input: NOTE_INPUT"));
  const wali = read("src/views/wali/WaliIzin.vue");
  assert.ok(has(wali, "api.delete(`/wali/izin/${x.id}`, { data: { note } })"));
  assert.ok(has(wali, "if (plan === 'apologize') {"));
});
