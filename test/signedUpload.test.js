import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const comp = fs.readFileSync(path.join(here, "../src/components/SignedDocumentUpload.vue"), "utf8");
const detail = fs.readFileSync(path.join(here, "../src/views/dashboard/guru/LpjDetailView.vue"), "utf8");

test("admin-only signed upload control", () => {
  assert.match(comp, /accept=".pdf,.jpg,.jpeg,.png"/);
  assert.match(comp, /5 \* 1024 \* 1024/);
  assert.match(comp, /Versi saat ini/);
  assert.match(comp, /Riwayat/);
  assert.match(comp, /Mengunggah/);
});

test("LpjDetailView gates upload behind isAdmin; teacher sees none", () => {
  assert.match(detail, /<SignedDocumentUpload v-if="isAdmin/);
  assert.ok(!detail.includes("<SignedDocumentUpload v-if=\"!isAdmin"), "teacher must not get upload control");
  const teacherBlocks = detail.split("v-if=\"!isAdmin\"");
  for (const b of teacherBlocks.slice(1)) {
    assert.ok(!b.slice(0, 2000).includes("SignedDocumentUpload"), "no upload in teacher block");
  }
});
