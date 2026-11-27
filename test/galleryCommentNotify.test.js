import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { laterSeen, countNewComments } from "../src/utils/galleryAdmin.js";
import { squash, has } from "./helpers/sourceText.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const read = (p) => squash(fs.readFileSync(path.join(here, "..", p), "utf8"));

test("'baru' per account: the later mark wins, so an older answer never brings seen comments back", () => {
  assert.equal(laterSeen(1000, 2000), 2000, "another device looked later");
  assert.equal(laterSeen(3000, 2000), 3000);
  assert.equal(laterSeen(1000, null), 1000, "never opened on the server");
  const comments = [{ createdAt: "2026-11-27T03:00:00Z" }, { createdAt: "2026-11-27T03:05:00Z", mine: true }];
  assert.equal(countNewComments(comments, Date.parse("2026-11-27T02:00:00Z")), 1, "own comments are never 'baru'");
});

test("menu badge on Dokumentasi for the admin and a guru with Kelola Dokumentasi, refreshed on page changes (no timer)", () => {
  const layout = read("src/views/dashboard/DashboardLayout.vue");
  assert.ok(has(layout, "{ to: '/dashboard/dokumentasi', label: 'Dokumentasi', icon: ICON.gallery, badge: 'komentar' }"));
  assert.ok(has(layout, "m.id === 'gallery-manage' ? 'komentar'"));
  assert.ok(has(layout, "komentar: seesComments.value ? newComments.value : 0"));
  assert.ok(has(layout, "if (seesComments.value) refreshComments();"));
  const badge = read("src/composables/useGalleryCommentBadge.js");
  assert.ok(has(badge, "api.get('/gallery/manage/comments/badge', { cache: false })"));
  assert.ok(!badge.includes("setInterval"), "no poller (Vercel CPU)");
});

test("opening the Komentar tab marks them seen on the server; the admin chooses what reaches the admins on WhatsApp", () => {
  const page = read("src/views/dashboard/admin/GalleryManagementView.vue");
  assert.ok(has(page, "await api.post('/gallery/manage/comments/seen')"));
  assert.ok(has(page, "commentBadge.clear()"));
  assert.ok(has(page, "<GalleryCommentNotify />"));
  const notify = read("src/components/gallery-admin/GalleryCommentNotify.vue");
  assert.ok(has(notify, "api.put('/gallery/manage/comment-settings', { adminNotify: value })"));
  assert.ok(has(notify, 'v-if="isAdmin" class="gm-mode-tabs" role="radiogroup"'), "a guru only reads it");
  const home = read("src/views/dashboard/admin/AdminDashboard.vue");
  assert.ok(has(home, "to: '/dashboard/dokumentasi?tab=komentar'"));
  assert.ok(has(home, '<li v-for="a in actions" :key="a.key">'));
});
