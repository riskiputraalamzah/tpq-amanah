import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const read = (p) => fs.readFileSync(path.join(here, p), "utf8");
const layout = read("../src/views/dashboard/DashboardLayout.vue");
const monthly = read("../src/views/dashboard/guru/MonthlyLpjView.vue");
const admin = read("../src/views/dashboard/admin/AdminLpjView.vue");
const util = read("../src/utils/lpjEligibility.js");

// LPJ Insentif: the admin assembles the LPJ from existing data, so teachers no longer get a monthly LPJ menu.
// The monthly pages stay reachable as an archive; the util is kept for them.
test("teachers no longer get the monthly LPJ menu; admin has one LPJ Insentif menu", () => {
  assert.match(util, /\/ljp\/eligibility\/me/);
  assert.match(util, /fetchMyEligibility/);
  assert.doesNotMatch(layout, /LPJ Bulanan/);
  assert.doesNotMatch(layout, /fetchMyEligibility/, "no eligibility request on every dashboard load");
  assert.match(layout, /to[=:]\s*["']\/dashboard\/lpj-insentif["']/);
  assert.doesNotMatch(layout, />\s*Dokumen LPJ\s*</, "old admin menus are now archive links inside LPJ Insentif");
});

test("non-eligible teacher: menu hidden plus direct view blocked", () => {
  assert.match(monthly, /notEligible/);
  assert.match(monthly, /tidak terdaftar sebagai peserta LPJ/);
  assert.match(monthly, /fetchMyEligibility\(activePeriod/);
});

test("admin assigns participants per period", () => {
  assert.match(admin, /Peserta LPJ/);
  assert.match(admin, /eligibleIds/);
  assert.match(admin, /Simpan Peserta/);
  assert.match(admin, /api\.put\("\/ljp\/eligibility"/);
  assert.match(admin, /api\.get\("\/ljp\/eligibility"/);
});
