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

test("eligible teacher sees LPJ menu; util queries own eligibility", () => {
  assert.match(util, /\/ljp\/eligibility\/me/);
  assert.match(util, /fetchMyEligibility/);
  assert.match(layout, /v-if="lpjEligible"/);
  assert.match(layout, /to="\/dashboard\/lpj"/);
  assert.match(layout, /fetchMyEligibility/);
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
