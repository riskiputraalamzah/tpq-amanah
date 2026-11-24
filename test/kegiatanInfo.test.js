import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  applyWaFormat,
  buildActivityWaText,
  formatLocalPhone,
  normalizeWaPhone,
  renderWaMarkdownHtml,
} from "../src/utils/waFormat.js";
import { squash, has } from "./helpers/sourceText.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const read = (p) => squash(fs.readFileSync(path.join(here, "..", p), "utf8"));

test("waFormat: toolbar formatting produces WhatsApp-compatible syntax and toggles cleanly", () => {
  // Bold with trailing space stays valid in WhatsApp (*kumpul* instead of *kumpul *)
  const b = applyWaFormat("Harap kumpul jam 05.30", 6, 13, "bold");
  assert.equal(b.text, "Harap *kumpul* jam 05.30");
  // Toggling bold off on the inner selection unwraps it
  const bOff = applyWaFormat(b.text, b.selectionStart, b.selectionEnd, "bold");
  assert.equal(bOff.text, "Harap kumpul jam 05.30");

  // Italic, strike, mono with collapsed cursor inserts placeholder selected
  const it = applyWaFormat("Catatan: ", 9, 9, "italic");
  assert.equal(it.text, "Catatan: _teks miring_");
  assert.equal(it.text.slice(it.selectionStart, it.selectionEnd), "teks miring");

  const st = applyWaFormat("jam 06.00", 0, 9, "strike");
  assert.equal(st.text, "~jam 06.00~");

  const mn = applyWaFormat("TPQ-01", 0, 6, "mono");
  assert.equal(mn.text, "```TPQ-01```");

  // Multi-line bullet, numbered, and quote lists
  const lines = "Seragam putih\nKartu peserta";
  const bul = applyWaFormat(lines, 0, lines.length, "bullet");
  assert.equal(bul.text, "- Seragam putih\n- Kartu peserta");

  const num = applyWaFormat(bul.text, 0, bul.text.length, "number");
  assert.equal(num.text, "1. Seragam putih\n2. Kartu peserta");

  const qt = applyWaFormat("Mohon tepat waktu", 0, 17, "quote");
  assert.equal(qt.text, "> Mohon tepat waktu");
});

test("waFormat: buildActivityWaText frames polite template + guru direct WA contact for bot and copy-paste", () => {
  assert.equal(normalizeWaPhone("0822-3336-1877"), "6282233361877");
  assert.equal(formatLocalPhone("6282233361877"), "0822-3336-1877");

  const botMsg = buildActivityWaText({
    activityTitle: "Munaqosyah 2026",
    activityDate: "2026-11-29",
    children: ["Aisyah", "Budi"],
    body: "Kumpul pukul *05.30 WIB*.",
    contactName: "Ustadz Riski",
    contactPhone: "082233361877",
  });
  assert.match(botMsg, /Assalamu'alaikum/);
  assert.match(botMsg, /Bapak\/Ibu wali dari \*Aisyah dan Budi\*\./);
  assert.match(botMsg, /\*Munaqosyah 2026\* \(Ahad, 29 November 2026\)/);
  assert.match(botMsg, /Kumpul pukul \*05\.30 WIB\*\./);
  assert.match(botMsg, /0822-3336-1877 \(https:\/\/wa\.me\/6282233361877\)/);
  assert.match(botMsg, /Asisten Pengingat TPQ Amanah/);

  const copyMsg = buildActivityWaText({
    activityTitle: "Munaqosyah 2026",
    activityDate: "2026-11-29",
    body: "Kumpul pukul *05.30 WIB*.",
    contactName: "Ustadz Riski",
    contactPhone: "6282233361877",
    isCopy: true,
  });
  assert.match(copyMsg, /wali santri peserta \*Munaqosyah 2026\*/);
  assert.match(copyMsg, /https:\/\/wa\.me\/6282233361877/);
  assert.doesNotMatch(copyMsg, /dikirim otomatis/);
});

test("waFormat: renderWaMarkdownHtml escapes raw HTML and renders WA formatting safely", () => {
  const html = renderWaMarkdownHtml(
    '<script>alert(1)</script>\n*Tebal* _miring_ ~coret~ ```kode_1```\n> Penting\n- Item satu\nhttps://wa.me/6282233361877?text=halo_test',
  );
  assert.doesNotMatch(html, /<script>/i);
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.match(html, /<strong>Tebal<\/strong>/);
  assert.match(html, /<em>miring<\/em>/);
  assert.match(html, /<s>coret<\/s>/);
  assert.match(html, /<code class="wa-mono">kode_1<\/code>/);
  assert.match(html, /<div class="wa-quote">Penting<\/div>/);
  assert.match(html, /<div class="wa-li"><span class="wa-li-mark">•<\/span><span>Item satu<\/span><\/div>/);
  assert.match(html, /href="https:\/\/wa\.me\/6282233361877\?text=halo_test"/);
});

test("kegiatan access guard: restricted to admin and kegiatan-manage in router and sidebar SPECIAL_MENUS", () => {
  const router = read("src/router/index.js");
  assert.ok(has(router, 'path: "kegiatan", name: "Kegiatan", component: () => import("../views/dashboard/guru/KegiatanView.vue"), meta: { role: "admin", feature: "kegiatan-manage" }'));
  assert.ok(has(router, 'path: "kegiatan/:id", name: "KegiatanDetail", component: () => import("../views/dashboard/guru/KegiatanDetailView.vue"), meta: { role: "admin", feature: "kegiatan-manage" }'));

  const layout = read("src/views/dashboard/DashboardLayout.vue");
  assert.ok(has(layout, "{ id: 'kegiatan-manage', to: '/dashboard/kegiatan', label: 'Kegiatan'"));
  // Default guru santri group no longer includes /dashboard/kegiatan
  const guruSection = layout.slice(layout.indexOf("key: 'mengajar'"), layout.indexOf("if (specialMenus.value.length)"));
  assert.equal(guruSection.includes("/dashboard/kegiatan"), false);
});

test("kegiatan info & Portal Wali wiring: WYSIWYG editor, sendNow, copy-paste, and read-only Portal Wali contact", () => {
  const detail = read("src/views/dashboard/guru/KegiatanDetailView.vue");
  assert.ok(has(detail, "<WaRichEditor"));
  assert.ok(has(detail, "api.post(`/activities/${id}/info`, payload)"));
  assert.ok(has(detail, "v-model=\"infoSendNow\""));
  assert.ok(has(detail, "Salin pesan (format WA)"));
  assert.ok(has(detail, "Belum tertaut WA"));

  const wali = read("src/views/wali/WaliKegiatan.vue");
  assert.ok(has(wali, "Info terbaru kegiatan"));
  assert.ok(has(wali, "renderWaMarkdownHtml(u.body)"));
  assert.ok(has(wali, "https://wa.me/${normalizeWaPhone(u.contactPhone)}"));
});
