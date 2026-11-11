import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { renderLpj, studentMatrix, teacherMatrix, journalRows, lpjFilename, tanggalPanjang, JOURNAL_SHEETS } from "../src/utils/lpjPdf.js";
import { sampleLpjDocument } from "./fixtures/lpjDocument.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const kop = "data:image/jpeg;base64," + fs.readFileSync(path.join(here, "../public/kop-surat-pdf.jpg")).toString("base64");

// Text drawn on a page, read from jsPDF's page content before compression.
const pageText = (doc, page) => doc.internal.pages[page].join("\n");
const orientation = (doc, page) => {
  const box = doc.getPageInfo(page).pageContext.mediaBox;
  return box.topRightX > box.topRightY ? "L" : "P";
};

const second = () =>
  sampleLpjDocument({ guru: { id: "ella", name: "Ella Nurleila", nik: "1", birthPlace: "Sidoarjo", birthDate: "1999-01-02", address: "x", position: "Guru/Pengajar TPQ" } });
const TITLES = ["LAPORAN PERTANGGUNGJAWABAN", "SURAT PERNYATAAN TANGGUNG JAWAB MUTLAK", "DAFTAR HADIR SANTRI", "DAFTAR HADIR GURU", "BUKU JURNAL MENGAJAR", "BUKU JURNAL & BERITA ACARA"];
const pageTitle = (doc, page) => {
  const text = pageText(doc, page);
  return TITLES.find((t) => text.includes(`(${t}`)) || "lanjutan";
};

test("whole TPQ: cover, then the official order 1. SPTJM, 2. santri, 3. guru (one recap), 4. jurnal", () => {
  const { doc, sections } = renderLpj({ jsPDF, autoTable, kop, documents: [sampleLpjDocument(), second()] });
  const pages = doc.getNumberOfPages();
  assert.deepEqual(
    sections.map((s) => `${s.key}${s.guruId ? `:${s.guruId}` : ""}`),
    ["cover", "sptjm:ella", "sptjm:aini", "santri:ella", "santri:aini", "guru", "jurnal:ella", "jurnal:aini"],
    "teachers by name within each part",
  );
  sections.slice(1).forEach((s, i) => assert.equal(s.fromPage, sections[i].toPage + 1, `${s.key} follows on`));
  assert.equal(sections.at(-1).toPage, pages);

  const cover = pageText(doc, 1);
  for (const expected of ["(LAPORAN PERTANGGUNGJAWABAN)", "Guru Penerima Insentif", "1.  Ella Nurleila", "2.  Ulrotul Aini", "411235151939"]) {
    assert.ok(cover.includes(expected), `cover contains ${expected}`);
  }

  const guru = sections.find((s) => s.key === "guru");
  assert.equal(guru.toPage - guru.fromPage + 1, 2, "one recap page per month for the whole TPQ");
  for (let p = guru.fromPage; p <= guru.toPage; p++) {
    assert.equal(pageTitle(doc, p), "DAFTAR HADIR GURU");
    assert.equal(orientation(doc, p), "L");
    assert.ok(pageText(doc, p).includes("(Ella Nurleila)") && pageText(doc, p).includes("(Ulrotul Aini)"), "both teachers in one table");
  }

  for (const s of sections.filter((x) => x.key === "sptjm")) {
    assert.equal(pageTitle(doc, s.fromPage), "SURAT PERNYATAAN TANGGUNG JAWAB MUTLAK");
    assert.equal(s.toPage, s.fromPage, "SPTJM fits one page");
    assert.equal(orientation(doc, s.fromPage), "P");
  }
  assert.ok(pageText(doc, pages).includes(`(Halaman ${pages} dari ${pages})`), "page numbers run through the whole PDF");
  for (let p = 1; p <= pages; p++) assert.ok(pageText(doc, p).includes("/kop-surat") || pageText(doc, p).includes("Do"), `kop on page ${p}`);
});

test("journal: a cover plus the first 3 sheets from the start of the period, in the paper book's columns", () => {
  const { doc, sections } = renderLpj({ jsPDF, autoTable, kop, documents: [sampleLpjDocument()], scope: "guru" });
  const jurnal = sections.find((s) => s.key === "jurnal");
  assert.equal(pageTitle(doc, jurnal.fromPage), "BUKU JURNAL MENGAJAR", "journal cover first");
  assert.equal(orientation(doc, jurnal.fromPage), "P");
  assert.ok(pageText(doc, jurnal.fromPage).includes("(Jilid 6)"), "cover lists the teacher's own class");
  assert.equal(jurnal.toPage - jurnal.fromPage, JOURNAL_SHEETS, "exactly 3 sheets after the cover (the period has more)");
  for (let p = jurnal.fromPage + 1; p <= jurnal.toPage; p++) {
    const text = pageText(doc, p);
    assert.equal(orientation(doc, p), "L");
    assert.ok(text.includes("(BUKU JURNAL & BERITA ACARA)"), `sheet ${p} repeats the title`);
    for (const col of ["Hari/Tgl", "Gel", "Kelas", "Santri", "Jml", "Masuk", "Absen", "Materi Inti", "Materi Penunjang", "Tanda Tangan"]) {
      assert.ok(text.includes(`(${col})`), `column ${col} on sheet ${p}`);
    }
    assert.ok(text.includes("(Mengetahui,)") && text.includes("(Ulrotul Aini)"), `signatures on sheet ${p}`);
  }
  assert.ok(pageText(doc, jurnal.fromPage + 1).includes("1 Okt 2026"), "starts at the first day of the period");
  const lastDay = journalRows(sampleLpjDocument()).filter((r) => r.date).at(-1).date.split("\n")[1];
  assert.equal(lastDay, "12 Nov 2026");
  for (let p = jurnal.fromPage + 1; p <= jurnal.toPage; p++) {
    assert.ok(!pageText(doc, p).includes(`(${lastDay})`), "the end of the period is beyond the 3 sheets, so it was cut");
  }

  const rows = journalRows(sampleLpjDocument());
  assert.deepEqual([rows[0].no, rows[0].date, rows[0].slot, rows[0].level], ["1", "Kamis,\n1 Okt 2026", "Sore", "Jilid 6"]);
  assert.equal(rows[0].material, "Yasin & Tahlil");
  const monday = rows.findIndex((r) => r.date.startsWith("Senin"));
  assert.equal(rows[monday + 1].no, "", "second session of the same day has no day number");
  assert.equal(rows[monday + 1].level, "Jilid 5\n(badal)");
  assert.equal(rows[monday + 1].total, "5");
  assert.equal(Number(rows[monday].present) + Number(rows[monday].absent), Number(rows[monday].total));
  assert.ok(rows.some((r) => r.supporting === "Hafalan doa sehari-hari"), "materi penunjang from the KBM form");
});

test("one teacher: own cover, SPTJM, santri and journal; no TPQ teacher recap", () => {
  const { doc, sections } = renderLpj({ jsPDF, autoTable, kop, documents: [sampleLpjDocument()], scope: "guru" });
  assert.deepEqual(sections.map((s) => s.key), ["cover", "sptjm", "santri", "jurnal"]);
  assert.ok(pageText(doc, 1).includes("(Ulrotul Aini)"));
  const all = Array.from({ length: doc.getNumberOfPages() }, (_, i) => pageTitle(doc, i + 1));
  assert.ok(!all.includes("DAFTAR HADIR GURU"));
  assert.equal(all.filter((t) => t === "DAFTAR HADIR SANTRI").length, 4, "2 months x (Jilid 6 + Jilid 5 badal)");
});

test("SPTJM follows the official wording, the teacher's data and has a materai box", () => {
  const { doc, sections } = renderLpj({ jsPDF, autoTable, kop, documents: [sampleLpjDocument()], scope: "guru" });
  const text = pageText(doc, sections.find((s) => s.key === "sptjm").fromPage);
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
    "(Materai)",
    "(10.000)",
  ]) {
    assert.ok(text.includes(expected), `SPTJM contains "${expected}"`);
  }
  for (let n = 1; n <= 5; n++) assert.ok(text.includes(`(${n}.)`), `statement ${n}`);
});

test("missing profile data prints dotted blanks instead of failing", () => {
  const doc0 = sampleLpjDocument({ guru: { id: "x", name: "Guru Baru", nik: "", birthPlace: "", birthDate: "", address: "", position: "Guru/Pengajar TPQ" } });
  const { doc, sections } = renderLpj({ jsPDF, autoTable, kop, documents: [doc0] });
  assert.ok(pageText(doc, sections.find((s) => s.key === "sptjm").fromPage).includes("NIK. .............................."));
});

test("teacher recap: every date of the month, off days greyed, codes and totals per teacher", () => {
  const { label, columns, rows } = teacherMatrix([sampleLpjDocument(), second()], 0);
  assert.equal(label, "Oktober 2026");
  assert.equal(columns.length, 31);
  assert.equal(columns[0].label, "1");
  assert.ok(columns.find((c) => c.date === "2026-10-03").off, "Saturday");
  assert.equal(columns.find((c) => c.date === "2026-10-20").holidayName, "Libur Yayasan");
  assert.deepEqual(rows.map((r) => r.name), ["Ella Nurleila", "Ulrotul Aini"]);
  const aini = rows[1];
  assert.equal(aini.codes[5], "I", "6 Oct: izin");
  assert.equal(aini.codes[2], "", "3 Oct (Saturday) stays empty");
  assert.equal(aini.totals[0] + aini.totals[1], aini.codes.filter(Boolean).length);
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
  assert.ok(all.includes("Tidak ada sesi mengajar pada periode ini"));
});

test("file names and dates", () => {
  const batch = sampleLpjDocument().batch;
  assert.equal(lpjFilename(batch), "LPJ-Insentif-Lembaga-2026-10_2026-11.pdf");
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
  assert.ok(view.includes("renderLpj({ jsPDF, autoTable, kop, documents, scope })"), "one PDF for the TPQ or one teacher");
  assert.ok(view.includes("exportPdf(readiness.gurus.map((g) => g.id), 'lembaga')"), "the main button builds the TPQ document");
  assert.ok(view.includes("exportPdf([g.id], 'guru')"), "per-teacher export");
  assert.ok(view.includes("fetch('/kop-surat-pdf.jpg')"), "kop surat on every page");
  assert.ok(view.includes("loadPdfLibs()"), "jsPDF is loaded only when exporting");
});

test("teachers in an LPJ see their own checklist on the dashboard", () => {
  const card = fs.readFileSync(path.join(here, "../src/components/LpjStatusCard.vue"), "utf8");
  const home = fs.readFileSync(path.join(here, "../src/views/dashboard/DashboardHome.vue"), "utf8");
  assert.ok(home.includes('<LpjStatusCard v-if="isGuru" />'), "only on the teacher dashboard");
  assert.ok(card.includes("api.get('/lpj/me'"), "own data only");
  assert.ok(card.includes('v-if="status?.batch"'), "hidden for teachers not in an LPJ");
  assert.ok(card.includes('to="/dashboard/profile"'), "profile link");
  assert.ok(card.includes(':to="attendanceLink(m.period)"') && card.includes(':to="kbmLink(m.first)"'), "each month links to that month");
});
