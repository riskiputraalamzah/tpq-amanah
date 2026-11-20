import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { timeAgo, dateTimeText } from "../src/utils/timeAgo.js";
import { linkCodeMessage } from "../src/utils/santriProfile.js";
import { slipLines } from "../src/utils/waliSlips.js";
import { squash, has } from "./helpers/sourceText.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const read = (p) => squash(fs.readFileSync(path.join(here, "..", p), "utf8"));

test("timeAgo formats relative times today and date + time once past the day", () => {
  const now = new Date("2026-11-20T14:30:00+07:00");
  assert.equal(timeAgo("2026-11-20T14:29:40+07:00", now), "barusan");
  assert.equal(timeAgo("2026-11-20T14:28:00+07:00", now), "2 menit lalu");
  assert.equal(timeAgo("2026-11-20T11:30:00+07:00", now), "3 jam lalu");
  assert.equal(timeAgo("2026-11-19T16:45:00+07:00", now), "19 Nov, 16.45");
});

test("dateTimeText and linkCodeMessage / slipLines include the exact hour in WIB", () => {
  const exp = "2026-12-19T09:15:00+07:00";
  assert.equal(dateTimeText(exp), "19 Desember 2026 pukul 09.15 WIB");

  const msg = linkCodeMessage({
    santriName: "Achmad Afif Firdaus",
    code: "YKWH-7234",
    expiresAt: exp,
    siteUrl: "https://tpqamanahsawotratap.com",
  });
  assert.match(msg, /Kode berlaku sampai 19 Desember 2026 pukul 09\.15 WIB\./);

  const slip = slipLines({
    santriName: "Achmad Afif Firdaus",
    classLabel: "Jilid 6",
    code: "YKWH-7234",
    expiresAt: exp,
    siteUrl: "https://tpqamanahsawotratap.com",
  });
  assert.match(slip.footer, /Berlaku sampai 19 Desember 2026 pukul 09\.15 WIB\./);
});

test("Data Wali Santri defaults to newest first and connects Saran & Kritik Wali across wali and admin", () => {
  const adminWali = read("src/views/dashboard/admin/AdminWaliView.vue");
  assert.ok(has(adminWali, "const sortBy = ref('newest')"));
  assert.ok(has(adminWali, "Berlaku sampai {{ dateTimeText(codeSheet.expiresAt) }}"));

  const waliHome = read("src/views/wali/WaliHome.vue");
  assert.ok(has(waliHome, 'to="/wali/masukan"'));

  const waliMasukan = read("src/views/wali/WaliMasukan.vue");
  assert.ok(has(waliMasukan, "api.post('/wali-feedback/mine'"));

  const adminFeedback = read("src/views/dashboard/admin/AdminFeedbackView.vue");
  assert.ok(has(adminFeedback, "api.get('/wali-feedback/admin'"));
  assert.ok(has(adminFeedback, "api.post(`/wali-feedback/admin/${item.id}/respond`"));

  const layout = read("src/views/dashboard/DashboardLayout.vue");
  assert.ok(has(layout, "{ to: '/dashboard/masukan-wali', label: 'Saran & Kritik Wali', icon: ICON.chat, badge: 'masukan' }"));
  assert.ok(has(layout, "{ to: '/dashboard/izin-santri', label: 'Izin Santri', icon: ICON.absensi }"));

  const izinView = read("src/views/dashboard/guru/IzinSantriView.vue");
  assert.ok(has(izinView, "api.get('/santri-presence/izin'"));
  assert.ok(has(izinView, "api.post('/santri-presence/izin'"));
});
