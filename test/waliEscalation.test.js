import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { squash, has } from "./helpers/sourceText.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const read = (p) => squash(fs.readFileSync(path.join(here, "..", p), "utf8"));

test("Data Wali Santri: who decides is what the server says (the admin and the jilid's teacher), not 'admin only'", () => {
  const v = read("src/views/dashboard/admin/AdminWaliView.vue");
  assert.ok(has(v, `<template v-if="review.canVerify && ['submitted', 'needs_fix', 'verified'].includes(review.profile.status)">`));
  assert.ok(has(v, `<button v-if="review.canVerify && review.profile.hasKkPhoto"`));
  assert.ok(has(v, `<div v-if="review.canVerify" class="wv-request-actions">`), "identity changes too");
  assert.ok(!has(v, `v-if="isAdmin && review.profile.hasKkPhoto"`));
  assert.ok(has(v, "if (w.status === 'waiting') return `Dikabarkan ke ${w.teacherNames || 'guru jilidnya'}"), "the row says who was told");
});

test("Data Wali Santri: the list laid out by jilid or by the wali's number, remembered", () => {
  const v = read("src/views/dashboard/admin/AdminWaliView.vue");
  assert.ok(has(v, "{ value: 'phone', label: 'Per nomor wali' }"));
  assert.ok(has(v, "if (!by.has(g.phone)) by.set(g.phone, { relation: g.relation, rows: [] })"), "a child with two wali under both numbers");
  assert.ok(has(v, "localStorage.setItem(GROUP_KEY, v)"));
});

test("the menu badges: one object by key (pendaftaran, wali) for the sidebar, the phone's tabs and its Menu sheet", () => {
  const layout = read("src/views/dashboard/DashboardLayout.vue");
  assert.ok(has(layout, "{ to: '/dashboard/wali-santri', label: 'Data Wali Santri', icon: ICON.wali, badge: 'wali' }"));
  assert.ok(has(layout, `<span v-if="m.badge && badges[m.badge]" class="sidebar-badge"`));
  assert.ok(has(layout, ':badges="badges"'));
  const chrome = read("src/components/MobileChrome.vue");
  assert.ok(has(chrome, "n += props.badges[m.badge] || 0"), "the Menu tab adds up what waits behind it");
  assert.ok(has(read("src/composables/useWaliBadge.js"), "api.get('/wali/admin/badge', { cache: false })"));
});
