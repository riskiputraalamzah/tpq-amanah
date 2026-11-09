import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { legalDocuments, documentSrc } from "../src/data/legalDocuments.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(here, "../public");
const read = (relative) => fs.readFileSync(path.join(here, relative), "utf8");

function sourceFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? sourceFiles(full) : [full];
  });
}

test("legal documents have unique ids and web copies that exist and stay light", () => {
  const ids = legalDocuments.map((doc) => doc.id);
  assert.equal(new Set(ids).size, ids.length, "ids are unique");
  assert.ok(ids.every((id) => /^[a-z0-9-]{1,64}$/.test(id)), "ids fit what the server accepts");

  for (const doc of legalDocuments) {
    const full = path.join(publicDir, doc.image);
    const thumb = path.join(publicDir, doc.thumb);
    assert.ok(fs.existsSync(full), `${doc.id} full copy exists`);
    assert.ok(fs.existsSync(thumb), `${doc.id} thumbnail exists`);
    assert.ok(fs.statSync(full).size < 300 * 1024, `${doc.id} full copy is under 300KB`);
    assert.ok(fs.statSync(thumb).size < 90 * 1024, `${doc.id} thumbnail is under 90KB`);
    assert.ok(documentSrc(doc).includes(`?v=${doc.version}`), "cache-busting version is part of the URL");
  }
});

test("the original scans are never referenced by the app", () => {
  const offenders = sourceFiles(path.join(here, "../src"))
    .filter((file) => /\.(vue|js)$/.test(file))
    .filter((file) => fs.readFileSync(file, "utf8").includes("/sertif/"));
  assert.deepEqual(offenders, [], "only the redacted copies in /legalitas may be used");
});

test("the SK, which carries personal data, is flagged as redacted", () => {
  const sk = legalDocuments.find((doc) => doc.id === "sk-kepala-tpq");
  assert.ok(sk, "SK is listed");
  assert.equal(sk.redacted, true);
  assert.ok(sk.image.includes("/legalitas/"), "SK uses the redacted copy");
});

test("the original scans folder is kept out of git", () => {
  assert.ok(read("../.gitignore").includes("/public/sertif/"));
});

test("legal documents stay hidden until the server confirms what may be shown", () => {
  const component = read("../src/components/LegalDocuments.vue");
  assert.ok(component.includes("const settings = ref(null)"), "unknown settings start empty");
  assert.ok(component.includes("if (!settings.value?.enabled) return []"), "nothing renders without confirmed settings");
  assert.ok(/catch\s*\{\s*settings\.value = null/.test(component), "a failed request leaves everything hidden");
  assert.ok(component.includes('v-if="visibleDocuments.length"'), "the section disappears when nothing is visible");
});

test("admins can switch the section and each document on or off", () => {
  const admin = read("../src/views/dashboard/admin/ContentManagement.vue");
  assert.ok(admin.includes("id: 'legalitas'"), "Legalitas tab exists");
  assert.ok(admin.includes("content.legalitas.enabled"), "master switch is bound");
  assert.ok(admin.includes("setDocumentVisible"), "per-document switch is bound");
});

test("the viewer is accessible: dialog semantics, Escape, and focus handling", () => {
  const component = read("../src/components/LegalDocuments.vue");
  assert.ok(component.includes('role="dialog"') && component.includes('aria-modal="true"'));
  assert.ok(component.includes("event.key === 'Escape'"));
  assert.ok(component.includes("opener?.focus()"), "focus returns to the control that opened it");
});
