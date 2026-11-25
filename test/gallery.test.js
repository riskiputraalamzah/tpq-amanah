import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseVideoUrl, formatMomentDate, videoPlatformLabel } from "../src/utils/galleryMedia.js";
import { ACCESS_CARDS } from "../src/utils/guruRights.js";
import { squash, has } from "./helpers/sourceText.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const read = (p) => squash(fs.readFileSync(path.join(here, "..", p), "utf8"));

test("galleryMedia parses YouTube & Instagram links safely for inline web embed", () => {
  const yt = parseVideoUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
  assert.equal(yt.ok, true);
  assert.equal(yt.value.embedUrl, "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0");
  assert.equal(videoPlatformLabel(yt.value), "Video YouTube");

  const shorts = parseVideoUrl("https://youtube.com/shorts/dQw4w9WgXcQ");
  assert.equal(shorts.ok, true);
  assert.equal(shorts.value.aspect, "portrait");
  assert.equal(videoPlatformLabel(shorts.value), "YouTube Shorts");

  const ig = parseVideoUrl("https://www.instagram.com/reel/C8AbCdEf123/");
  assert.equal(ig.ok, true);
  assert.equal(ig.value.embedUrl, "https://www.instagram.com/reel/C8AbCdEf123/embed/");
  assert.equal(videoPlatformLabel(ig.value), "Reel Instagram");

  const gd = parseVideoUrl("https://drive.google.com/file/d/1P_vE3pOJY3LbeF8sAQg-JD6CnvXMMNZI/view");
  assert.equal(gd.ok, true);
  assert.equal(gd.value.platform, "gdrive");
  assert.equal(gd.value.embedUrl, "https://drive.google.com/file/d/1P_vE3pOJY3LbeF8sAQg-JD6CnvXMMNZI/preview");
  assert.equal(videoPlatformLabel(gd.value), "Video Google Drive");

  assert.equal(parseVideoUrl("https://drive.google.com/drive/folders/1P_vE3pOJY3LbeF8sAQg").ok, false);
  assert.equal(parseVideoUrl("https://tiktok.com/@tpq/video/123").ok, false);
  assert.equal(formatMomentDate("2026-11-25"), "25 Nov 2026");
});

test("Dokumentasi access is wired to admin, guru Akses Khusus (gallery-manage), router, and sidebar", () => {
  assert.ok(ACCESS_CARDS.some((c) => c.id === "gallery-manage" && c.to === "/dashboard/dokumentasi"));

  const router = read("src/router/index.js");
  assert.ok(
    has(
      router,
      'path: "dokumentasi", name: "GalleryManagement", component: () => import("../views/dashboard/admin/GalleryManagementView.vue"), meta: { role: "admin", feature: "gallery-manage" }',
    ),
  );

  const layout = read("src/views/dashboard/DashboardLayout.vue");
  assert.ok(has(layout, "{ id: 'gallery-manage', to: '/dashboard/dokumentasi', label: 'Dokumentasi'"));
  assert.ok(has(layout, "{ to: '/dashboard/dokumentasi', label: 'Dokumentasi', icon: ICON.gallery }"));
});

test("Landing page mounts GallerySection with inline video iframe player and self-hiding behavior", () => {
  const home = read("src/views/HomeView.vue");
  assert.ok(has(home, "<GallerySection />"));

  const section = read("src/components/landing/GallerySection.vue");
  assert.ok(has(section, 'v-if="moments.length" id="dokumentasi"'));
  assert.ok(has(section, ':src="activeMoment.video.embedUrl"'), "embeds YouTube/Instagram video directly in web");
  assert.ok(has(section, "api.get('/gallery/public')"));
});

test("GalleryManagementView supports moment upload, live publish default, custom categories, and cover selection", () => {
  const mgmt = read("src/views/dashboard/admin/GalleryManagementView.vue");
  assert.ok(has(mgmt, "published: true"), "moments publish immediately by default");
  assert.ok(has(mgmt, "compressGalleryPhoto(file)"));
  assert.ok(has(mgmt, "api.post('/gallery/categories'"));
  assert.ok(has(mgmt, "api.put(`/gallery/categories/${encodeURIComponent(c.id)}`"));
  assert.ok(has(mgmt, "api.delete(`/gallery/categories/${encodeURIComponent(c.id)}`"));
  assert.ok(has(mgmt, "Jadikan sampul"));
});
