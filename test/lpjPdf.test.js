import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { renderLpj, studentMatrix, lpjFilename, tanggalPanjang } from "../src/utils/lpjPdf.js";
import { sampleLpjDocument } from "./fixtures/lpjDocument.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const kop = "data:image/jpeg;base64," + fs.readFileSync(path.join(here, "../public/kop-surat-pdf.jpg")).toString("base64");

// Text drawn on a page, read from jsPDF's page content before compression.
const pageText = (doc, page) => doc.internal.pages[page].join("\n");
const orientation = (doc, page) => {
  const box = doc.getPageInfo(page).pageContext.mediaBox;
  return box.topRightX > box.topRightY ? "L" : "P";
};

test("one teacher: cover, attendance, SPTJM, student attendance, journal - in that order and orientation", () => {
  const { doc, sections } = renderLpj({ jsPDF, autoTable, kop, documents: [sampleLpjDocument()] });
  const pages = doc.getNumberOfPages();
  const titles = Array.from({ length: pages }, (_, i) => {
    const text = pageText(doc, i + 1);
    for (const t of ["LAPORAN PERTANGGUNGJAWABAN", "DAFTAR HADIR GURU", "SURAT PERNYATAAN TANGGUNG JAWAB MUTLAK", "DAFTAR HADIR SANTRI", "JURNAL MENGAJAR"]) {
      if (text.includes(`(${t}`)) return t;
    }
    return "lanjutan";
  });
  assert.deepEqual(titles.slice(0, 4), ["LAPORAN PERTANGGUNGJAWABAN", "DAFTAR HADIR GURU", "DAFTAR HADIR GURU", "SURAT PERNYATAAN TANGGUNG JAWAB MUTLAK"]);
  assert.equal(titles.filter((t) => t === "DAFTAR HADIR SANTRI").length, 4, "2 months x (Jilid 6 + Jilid 5 badal)");
  assert.ok(titles.indexOf("JURNAL MENGAJAR") > titles.lastIndexOf("DAFTAR HADIR SANTRI"));
  assert.deepEqual([1, 2, 3, 4].map((p) => orientation(doc, p)), ["P", "P", "P", "P"], "cover, teacher attendance and SPTJM are portrait");
  for (let p = 5; p <= pages; p++) assert.equal(orientation(doc, p), "L", `page ${p} (tables) is landscape`);
  assert.deepEqual(sections, [{ guruId: "aini", name: "Ulrotul Aini", fromPage: 1, toPage: pages }]);
  assert.ok(pageText(doc, pages).includes(`(Halaman ${pages} dari ${pages})`), "page numbers per teacher");
  for (let p = 1; p <= pages; p++) assert.ok(pageText(doc, p).includes("/kop-surat") || pageText(doc, p).includes("Do"), `kop on page ${p}`);
});

test("SPTJM follows the official wording and the teacher's data", () => {
  const { doc } = renderLpj({ jsPDF, autoTable, kop, documents: [sampleLpjDocument()] });
  const text = pageText(doc, 4);
  for (const expected of [
    "PENERIMA INSENTIF GURU TAMAN PENDIDIKAN AL-QUR",
    "Yang bertanda tangan di bawah ini:",
    "3515164906000004",
    "Sidoarjo, 09 Juni 2000",
    "Jl. Anusapati RT 03 RW 12 Sawotratap",
    "Jl. Kertanegara No. 20 RT 05 RW 11 Sawotratap",
    "Guru/Pengajar TPQ",
    "Dengan ini menyatakan dengan sebenar-benarnya bahwa:",
    "Pemerintah Kabupaten Sidoarjo",
    "Sidoarjo, 30 November 2026",
    "Yang membuat pernyataan,",
    "NIK. 3515164906000004",
  ]) {
    assert.ok(text.includes(expected), `SPTJM contains "${expected}"`);
  }
  for (let n = 1; n <= 5; n++) assert.ok(text.includes(`(${n}.)`), `statement ${n}`);
});

test("missing profile data prints dotted blanks instead of failing", () => {
  const doc0 = sampleLpjDocument({ guru: { id: "x", name: "Guru Baru", nik: "", birthPlace: "", birthDate: "", address: "", position: "Guru/Pengajar TPQ" } });
  const { doc } = renderLpj({ jsPDF, autoTable, kop, documents: [doc0] });
  const sptjm = pageText(doc, 4);
  assert.ok(sptjm.includes("NIK. .............................."));
});

test("several teachers make one PDF, each starting with its own cover and page count", () => {
  const second = sampleLpjDocument({ guru: { id: "ella", name: "Ustadzah Ella", nik: "1", birthPlace: "Sidoarjo", birthDate: "1999-01-02", address: "x", position: "Guru/Pengajar TPQ" } });
  const { doc, sections } = renderLpj({ jsPDF, autoTable, kop, documents: [sampleLpjDocument(), second] });
  assert.equal(sections.length, 2);
  assert.equal(sections[1].fromPage, sections[0].toPage + 1);
  assert.ok(pageText(doc, sections[1].fromPage).includes("(LAPORAN PERTANGGUNGJAWABAN)"));
  assert.ok(pageText(doc, sections[1].fromPage).includes("Halaman 1 dari"), "page numbers restart for the next teacher");
});

test("student attendance matrix: one table per class, codes and totals per santri", () => {
  const october = sampleLpjDocument().months[0];
  const groups = studentMatrix(october);
  assert.deepEqual(groups.map((g) => g.level), ["Jilid 5", "Jilid 6"]);
  const jilid6 = groups[1];
  assert.equal(jilid6.columns[0], "Kam\n1", "1 Oct 2026 is a Thursday");
  const row = jilid6.rows.find((r) => r.name === "Ahmad Fauzi");
  assert.equal(row.codes.length, jilid6.columns.length);
  assert.equal(row.totals.reduce((a, b) => a + b, 0), row.codes.filter((c) => c).length, "H+I+S+A = sessions attended");
  assert.ok(jilid6.rows.every((r, i, all) => i === 0 || all[i - 1].name.localeCompare(r.name, "id") <= 0), "sorted by name");
});

test("two sessions of the same class on one day get a slot mark", () => {
  const month = { days: [{ date: "2026-10-05", sessions: [
    { date: "2026-10-05", slotId: "wave_1", level: "Jilid 6", levelKey: "6", students: [{ santriId: "a", name: "A", status: "hadir" }] },
    { date: "2026-10-05", slotId: "wave_2", level: "Jilid 6", levelKey: "6", students: [{ santriId: "a", name: "A", status: "izin" }] },
  ] }] };
  const [group] = studentMatrix(month);
  assert.deepEqual(group.columns, ["Sen\n5 S", "Sen\n5 M"]);
  assert.deepEqual(group.rows[0].codes, ["H", "I"]);
});

test("a month without sessions still gets a clear page", () => {
  const empty = sampleLpjDocument();
  empty.months = [{ ...empty.months[0], days: empty.months[0].days.map((d) => ({ ...d, sessions: [] })) }];
  const { doc } = renderLpj({ jsPDF, autoTable, kop, documents: [empty] });
  const all = Array.from({ length: doc.getNumberOfPages() }, (_, i) => pageText(doc, i + 1)).join("\n");
  assert.ok(all.includes("Tidak ada sesi mengajar dengan absensi santri pada bulan ini."));
  assert.ok(all.includes("Tidak ada sesi mengajar pada bulan ini"));
});

test("file names and dates", () => {
  const batch = sampleLpjDocument().batch;
  assert.equal(lpjFilename(batch), "LPJ-Insentif-Semua-Guru-2026-10_2026-11.pdf");
  assert.equal(lpjFilename(batch, "Ulrotul Aini"), "LPJ-Insentif-Ulrotul-Aini-2026-10_2026-11.pdf");
  assert.equal(lpjFilename({ startPeriod: "2026-10", endPeriod: "2026-10" }, "A/B"), "LPJ-Insentif-AB-2026-10.pdf");
  assert.equal(tanggalPanjang("2026-10-10"), "10 Oktober 2026");
  assert.equal(tanggalPanjang(""), "..............................");
});

test("LPJ Insentif page: admin-only, one-click export and reminders", () => {
  const view = fs.readFileSync(path.join(here, "../src/views/dashboard/admin/LpjInsentifView.vue"), "utf8");
  const router = fs.readFileSync(path.join(here, "../src/router/index.js"), "utf8");
  assert.match(router, /path: "lpj-insentif",[\s\S]*?LpjInsentifView\.vue[\s\S]*?meta: \{ role: "admin" \}/);
  assert.ok(view.includes("api.put(`/lpj/teachers/${guru.id}/syahadah`"), "syahadah is marked once per teacher");
  assert.ok(view.includes("[3, 6, 12]"), "quick 3 / 6 / 12 month choices");
  assert.ok(view.includes("api.get(`/lpj/${selected.value.id}/readiness`"), "readiness per teacher");
  assert.ok(view.includes("api.post(`/lpj/${selected.value.id}/remind`"), "reminders from the admin");
  assert.ok(view.includes("renderLpj({ jsPDF, autoTable, kop, documents })"), "one PDF for one or all teachers");
  assert.ok(view.includes("fetch('/kop-surat-pdf.jpg')"), "kop surat on every page");
  assert.ok(view.includes("loadPdfLibs()"), "jsPDF is loaded only when exporting");
});

test("teachers in an LPJ see their own checklist on the dashboard", () => {
  const card = fs.readFileSync(path.join(here, "../src/components/LpjStatusCard.vue"), "utf8");
  const home = fs.readFileSync(path.join(here, "../src/views/dashboard/DashboardHome.vue"), "utf8");
  assert.ok(home.includes('<LpjStatusCard v-if="isGuru" />'), "only on the teacher dashboard");
  assert.ok(card.includes("api.get('/lpj/me'"), "own data only");
  assert.ok(card.includes('v-if="status?.batch"'), "hidden for teachers not in an LPJ");
  for (const link of ["/dashboard/profile", "/dashboard/attendance", "/dashboard/kbm"]) {
    assert.ok(card.includes(`to="${link}"`), `links straight to ${link}`);
  }
});
