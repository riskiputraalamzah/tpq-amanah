// Panduan (user decision 2026-11-28): one /panduan for everybody, the guide of the person's own role, "Yang baru"
// release notes, phone screenshots. These checks keep it from going stale when menus or releases change.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { squash, has } from "./helpers/sourceText.js";
import { GUIDES, RELEASES, rolesFor, unseenReleases, markReleasesSeen } from "../src/content/panduan.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const src = (rel) => fs.readFileSync(path.join(here, "..", "src", rel), "utf8");
const read = (rel) => squash(src(rel));

test("every menu of the dashboard is described in the guide of its role", () => {
  const layout = src("views/dashboard/DashboardLayout.vue");
  const adminPart = layout.slice(layout.indexOf("const ADMIN_GROUPS"), layout.indexOf("const menuGroups"));
  const guruPart = layout.slice(layout.indexOf("const menuGroups"), layout.indexOf("const isItemActive"));
  const links = (part) => [...part.matchAll(/to: '(\/dashboard[^']*)'/g)].map((m) => m[1]);
  const described = (role) => new Set(GUIDES[role].menus.flatMap((g) => g.items.map((i) => i.to)).filter(Boolean));
  for (const to of links(adminPart)) assert.ok(described("admin").has(to), `admin menu ${to} is in the guide`);
  for (const to of links(guruPart)) assert.ok(described("guru").has(to), `guru menu ${to} is in the guide`);
  assert.ok(described("admin").has("/dashboard/panduan") && described("guru").has("/dashboard/panduan"));
});

test("the wali's bottom menu is described", () => {
  const layout = src("views/wali/WaliLayout.vue");
  const navTo = [...layout.matchAll(/to: '(\/wali[^']*)'/g)].map((m) => m[1]);
  const described = new Set(GUIDES.wali.menus.flatMap((g) => g.items.map((i) => i.to)).filter(Boolean));
  for (const to of navTo) assert.ok(described.has(to), `wali menu ${to} is in the guide`);
});

test("releases point at topics that exist; topic ids are unique; screenshots exist", () => {
  for (const r of RELEASES) {
    for (const role of r.roles) {
      assert.ok(GUIDES[role].topics.some((t) => t.id === r.topics[role]), `${r.id}: ${role} topic ${r.topics[role]}`);
      assert.ok((r.points[role] || []).length, `${r.id}: points for ${role}`);
    }
  }
  for (const [role, g] of Object.entries(GUIDES)) {
    const ids = g.topics.map((t) => t.id);
    assert.equal(new Set(ids).size, ids.length, `${role}: unique topic ids`);
    for (const t of g.topics) for (const s of t.shots || []) assert.ok(fs.existsSync(path.join(here, "..", "public", s.src)), `${s.src} exists`);
  }
});

test("who reads which guide; 'Baru' until opened on this device", () => {
  assert.deepEqual(rolesFor("admin"), ["admin", "guru", "wali"]);
  assert.deepEqual(rolesFor("guru"), ["guru", "wali"]);
  assert.deepEqual(rolesFor("wali"), ["wali"]);
  assert.deepEqual(rolesFor(undefined), ["wali"]);
  const store = new Map();
  const storage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, v) };
  assert.equal(unseenReleases("wali", storage).length, RELEASES.filter((r) => r.roles.includes("wali")).length);
  markReleasesSeen("wali", storage);
  assert.equal(unseenReleases("wali", storage).length, 0);
  assert.ok(unseenReleases("guru", storage).length > 0, "per role");
});

test("routes: /panduan sends a signed-in person to their own area; entry points in the menus", () => {
  const r = read("router/index.js");
  assert.ok(has(r, 'path: "/panduan"'));
  assert.ok(has(r, 'return { path: auth.user?.role === "wali" ? "/wali/panduan" : "/dashboard/panduan", query: to.query, hash: to.hash };'));
  assert.ok(has(r, '{ path: "panduan", name: "PanduanDashboard"'));
  assert.ok(has(r, '{ path: "panduan", name: "PanduanWali"'));
  const layout = read("views/dashboard/DashboardLayout.vue");
  assert.ok(has(layout, "if (isAdmin.value) return [...ADMIN_GROUPS, BANTUAN]"), "admin: its own group, open by default");
  assert.ok(has(layout, "panduan: panduanNew.value"));
  assert.ok(has(read("views/wali/WaliAkun.vue"), 'to="/wali/panduan"'));
  assert.ok(has(read("views/wali/WaliHome.vue"), "unseenReleases('wali')"));
  const guide = read("components/panduan/PanduanGuide.vue");
  assert.ok(has(guide, 'loading="lazy"'), "screenshots load lazily");
});
