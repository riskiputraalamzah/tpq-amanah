import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const read = (file) => fs.readFileSync(path.join(here, "../src", file), "utf8");
const view = read("views/dashboard/admin/WaReminderView.vue");
const router = read("router/index.js");
const layout = read("views/dashboard/DashboardLayout.vue");

test("Pengingat WA Guru is admin-only and lives in Pusat WhatsApp (one menu item for everything WhatsApp)", () => {
  assert.match(router, /path: "wa-reminders",[\s\S]*?WaReminderView\.vue[\s\S]*?meta: \{ role: "admin" \}/);
  assert.ok(layout.includes("{ to: '/dashboard/whatsapp', label: 'Pusat WhatsApp', icon: ICON.chat, also: ['/dashboard/wa-log', '/dashboard/broadcasts', '/dashboard/wa-reminders'] }"), "the side menu item covers its tabs");
  assert.ok(view.includes("<WaHubNav />"), "the hub's tabs and live status on top");
});

test("admin manages numbers, sessions and message types", () => {
  for (const binding of [
    'v-model="form.gurus[guru.id].number"',
    'v-model="form.gurus[guru.id].session"',
    'v-model="form.gurus[guru.id].enabled"',
    'v-model="form.sessions[key].start"',
    'v-model="form.sessions[key].end"',
    'v-model="form.startMessage.enabled"',
    'v-model="form.endCheck.enabled"',
    'v-model="form.nightlyRecap.time"',
  ]) {
    assert.ok(view.includes(binding), binding);
  }
  assert.ok(view.includes("api.put('/wa-reminders/settings', payload)"));
});

test("tests go to a chosen number; what the bot ran last and how it gets its schedule are shown", () => {
  assert.ok(view.includes("api.post('/wa-reminders/test'"));
  assert.ok(view.includes("targetNumber: dialog.number"));
  assert.ok(view.includes("runItems(bot.value.lastRuns)"));
  assert.ok(view.includes("WA_SCHEDULE_SOURCE=backend"), "explains how to switch the bot over");
  assert.ok(view.includes("PageSkeleton"), "uses the shared loading skeleton");
  assert.ok(!view.includes("setInterval(refreshBotStatus"), "no second status poller: the hub's live status is shared");
});

test("Notifikasi WA: 'jaga sesi agar tidak kosong guru' with lead time and admin numbers", () => {
  const src = fs.readFileSync(path.join(here, "../src/views/dashboard/admin/WaReminderView.vue"), "utf8");
  assert.ok(src.includes('id="coverage-switch" v-model="form.coverageAlert.enabled"'), "on/off");
  assert.ok(/<option :value="60">1 jam sebelum<\/option>[\s\S]*<option :value="180">3 jam sebelum<\/option>/.test(src), "how early it starts watching");
  assert.ok(src.includes('v-model="form.coverageAlert.adminNumbersText"'), "admin numbers");
  assert.ok(src.includes("Belum diisi: kalau satu sesi kosong guru, belum ada yang diberi tahu."), "warns when no admin number");
  assert.ok(src.includes("adminNumbers: payload.coverageAlert.adminNumbersText"), "sent to the server, which validates and normalizes");
  const status = fs.readFileSync(path.join(here, "../src/utils/waBotStatus.js"), "utf8");
  assert.ok(status.includes("coverage: 'Jaga sesi tidak kosong guru'"), "shown in the bot's last runs");
});
