// Pop-up layers. A confirmation (DialogHost, ask()) is often opened FROM another pop-up (hapus santri, tolak
// pengajuan, ...): it must be on top of every pop-up in the app, and only the toasts above it. Every z-index in
// src/ is read here, so a new pop-up with a higher layer fails this test instead of hiding the confirmation.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const src = path.join(here, "..", "src");

function filesIn(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return filesIn(p);
    return /\.(vue|css|js)$/.test(e.name) ? [p] : [];
  });
}

const layers = filesIn(src).flatMap((file) => {
  const rel = path.relative(src, file).replace(/\\/g, "/");
  return fs
    .readFileSync(file, "utf8")
    .split("\n")
    .flatMap((line, i) => [...line.matchAll(/z-index:\s*(\d+)/g)].map((m) => ({ where: `${rel}:${i + 1}`, z: Number(m[1]) })));
});
const zOf = (where) => {
  const found = layers.filter((l) => l.where.startsWith(where));
  assert.equal(found.length, 1, `${where}: one z-index`);
  return found[0].z;
};

test("the app's confirmation dialog is above every pop-up; only the toasts are above it", () => {
  const dialog = zOf("components/DialogHost.vue");
  const toasts = zOf("components/GlobalToast.vue:75");
  const others = layers.filter((l) => !l.where.startsWith("components/DialogHost.vue") && l.where !== "components/GlobalToast.vue:75");
  const above = others.filter((l) => l.z >= dialog);
  assert.deepEqual(above, [], "nothing may cover the confirmation");
  assert.ok(toasts > dialog, "the toasts stay readable above it");
  assert.ok(layers.some((l) => l.where.startsWith("style.css") && l.z === 999999), "the global .modal-overlay layer is still counted");
});

test("a pop-up opened from another pop-up is above it (the KK photo over the review sheet)", () => {
  const view = fs.readFileSync(path.join(src, "views/dashboard/admin/AdminWaliView.vue"), "utf8");
  const sheet = Number(view.match(/\.wv-overlay \{[^}]*z-index: (\d+)/)[1]);
  const top = Number(view.match(/\.wv-overlay\.wv-overlay-top \{[^}]*z-index: (\d+)/)[1]);
  assert.ok(top > sheet);
});
