import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const read = (file) => fs.readFileSync(path.join(here, "../src", file), "utf8");

const santriManager = read("components/SantriManager.vue");
const layout = read("views/dashboard/DashboardLayout.vue");
const identity = read("composables/useTpqIdentity.js");
const profile = read("views/dashboard/admin/TpqProfileView.vue");

test("Kelola Santri shows, searches and copies the nomor induk", () => {
  assert.ok(santriManager.includes("<th>No. Induk</th>"), "table has a No. Induk column");
  assert.ok(santriManager.includes("row.nomorInduk"), "each row shows its nomor induk");
  assert.ok(santriManager.includes("Cari nama atau nomor induk"), "search mentions nomor induk");
  assert.ok(santriManager.includes("navigator.clipboard.writeText(text)"), "number can be copied");
  assert.ok(santriManager.includes('replace(/-/g, "")'), "a second button copies it without dashes");
  assert.ok(santriManager.includes("copyNomorInduk(row, { stripped: true })"));
});

test("Only admin can number existing santri, after a preview", () => {
  assert.ok(santriManager.includes('v-if="adminMode && unnumberedCount > 0"'), "banner is admin-only");
  assert.ok(santriManager.includes('api.get("/santri/nomor-induk/preview")'), "admin sees a preview first");
  assert.ok(santriManager.includes('api.post("/santri/nomor-induk/generate"'), "then confirms the generation");
  assert.ok(santriManager.includes('clearApiCache("/santri/nomor-induk")'), "preview is never served from cache");
});

test("Sidebar NSPQ opens the SIPDAR certificate safely in a new tab", () => {
  assert.ok(layout.includes('class="sidebar-nspq"'), "NSPQ link is in the sidebar");
  assert.ok(layout.indexOf('class="sidebar-nspq"') < layout.indexOf('class="sidebar-nav"'), "it sits under the logo, above the menu");
  assert.ok(layout.includes(':href="tpqIdentity.sipdarUrl"'));
  assert.ok(layout.includes('target="_blank"') && layout.includes('rel="noopener noreferrer"'));
  assert.ok(layout.includes("NSPQ"), "labelled NSPQ");
  assert.ok(identity.includes("https://sipdarlpq.kemenag.go.id/print/sertifikat-lpq/62468/411235151939/"));
  assert.ok(identity.includes("'411235151939'"));
  assert.ok(identity.includes("sipdarUrl.startsWith(SIPDAR_ORIGIN)"), "only SIPDAR links are followed");
});

test("Profil TPQ edits the SIPDAR link and refreshes the sidebar on save", () => {
  assert.ok(profile.includes('v-model="form.sipdarUrl"'));
  assert.ok(profile.includes("applyTpqProfile(payload)"));
});

test("Sorting: No. Induk, Nama and Jilid (1-6 then Marhalah), empty values last", async () => {
  const { sortSantri } = await import("../src/utils/santriSort.js");
  const rows = [
    { id: "a", name: "Zaki", currentClassId: "1", nomorInduk: "411235151939-26-010" },
    { id: "b", name: "budi", currentClassId: "7", nomorInduk: "411235151939-26-002" },
    { id: "c", name: "Ani", currentClassId: "6", nomorInduk: "411235151939-27-001" },
    { id: "d", name: "Dewi", currentClassId: "", nomorInduk: "" },
    { id: "e", name: "Eko", currentClassId: "1", nomorInduk: "411235151939-26-1000" },
    { id: "f", name: "Fajar", currentClassId: "marhalah" },
  ];
  const ids = (key, dir) => sortSantri(rows, key, dir).map((r) => r.id).join("");

  assert.equal(ids("name", "asc"), "cbdefa", "A-Z ignores letter case");
  assert.equal(ids("name", "desc"), "afedbc");
  assert.equal(ids("nomorInduk", "asc"), "baecdf", "year then sequence; -1000 after -010; no number last");
  assert.equal(ids("nomorInduk", "desc"), "ceabdf", "no number stays last when descending");
  assert.equal(ids("level", "asc"), "eacbfd", "Jilid 1..6, then Marhalah, then unassigned; same level A-Z");
  assert.equal(ids("level", "desc"), "bfcead", "Marhalah first when descending; unassigned still last");
  assert.deepEqual(rows.map((r) => r.id).join(""), "abcdef", "the original list is not mutated");
});

test("Kelola Santri headers sort and announce their order", () => {
  for (const key of ["nomorInduk", "name", "level"]) {
    assert.ok(santriManager.includes(`@click="toggleSort('${key}')"`), `${key} header sorts`);
    assert.ok(santriManager.includes(`:aria-sort="ariaSort('${key}')"`), `${key} header exposes aria-sort`);
  }
  assert.ok(santriManager.includes('v-for="(row, index) in sortedRows"'), "table renders the sorted rows");
});

test("Kelola Santri offers to fix numbers issued with a mistyped NSPQ", () => {
  assert.ok(santriManager.includes('v-if="adminMode && wrongPrefixRows.length > 0"'), "admin-only banner when prefixes differ");
  assert.ok(santriManager.includes('api.post("/santri/nomor-induk/fix-nspq"'), "calls the fix endpoint");
  assert.ok(santriManager.includes("await confirm("), "asks for confirmation first");
});
