// The wali portal shows the last data at once and refreshes quietly (user decision 2026-11-28): no page goes back to
// "wait for the server, show a grey skeleton" on every visit.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { squash, has } from "./helpers/sourceText.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const read = (rel) => squash(fs.readFileSync(path.join(here, "..", "src", rel), "utf8"));

test("every reading page of the portal uses the shared store", () => {
  for (const page of ["WaliHome", "WaliIzin", "WaliIzinPick", "WaliProgress", "WaliRapor", "WaliKegiatan", "WaliKegiatanInfo", "WaliAkun", "WaliMasukan"]) {
    const src = read(`views/wali/${page}.vue`);
    assert.ok(has(src, "useWaliResource("), `${page} reads through useWaliResource`);
    assert.ok(!/api\.get\(/.test(src), `${page} does not wait for its own api.get on every visit`);
  }
});

test("the Izin tab goes straight to a single child's form; months keep the old one on screen; logout clears the phone", () => {
  const layout = read("views/wali/WaliLayout.vue");
  assert.ok(has(layout, "return list.length === 1 ? `/wali/santri/${list[0].santriId}/izin` : '/wali/izin'"));
  assert.ok(has(layout, "setWaliOwner(uidOf())"), "the store belongs to the signed-in parent");
  assert.ok(has(layout, "refreshAll()"), "pull to refresh asks every page again");
  assert.ok(has(read("views/wali/WaliProgress.vue"), "{ keepPrevious: true }"));
  const auth = read("stores/auth.js");
  assert.ok(has(auth, "clearWaliCache()") && has(auth, "resetWaliAnnouncements()"));
});

test("a change the parent made refreshes what it touches (one hook for the whole portal)", () => {
  const data = read("utils/waliData.js");
  assert.ok(has(data, "keys: () => ['me', 'izin:*', 'progress:*']"), "an izin: Beranda counts, izin page, progress");
  assert.ok(has(data, "api.interceptors.response.use((response) => {"));
  assert.ok(has(data, "warmUpWali"), "the next pages are made ready after Beranda");
});
