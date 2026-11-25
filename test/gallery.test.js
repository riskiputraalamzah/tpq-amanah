import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  parseVideoUrl,
  parseImageUrl,
  galleryPhotoSrc,
  galleryPhotoCardSrc,
  galleryPhotoThumbSrc,
  formatMomentDate,
  videoPlatformLabel,
} from "../src/utils/galleryMedia.js";
import { ACCESS_CARDS } from "../src/utils/guruRights.js";
import { squash, has } from "./helpers/sourceText.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const read = (p) => squash(fs.readFileSync(path.join(here, "..", p), "utf8"));

test("galleryMedia parses YouTube, Instagram, Google Drive video & online image links safely", () => {
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

  // Online photo URL parser (Google Drive incl. HEIC, Dropbox, direct HTTPS URL)
  const gdImg = parseImageUrl("https://drive.google.com/file/d/1P_vE3pOJY3LbeF8sAQg-JD6CnvXMMNZI/view?usp=sharing");
  assert.equal(gdImg.ok, true);
  assert.equal(gdImg.value.source, "gdrive");
  assert.equal(gdImg.value.url, "https://drive.google.com/thumbnail?id=1P_vE3pOJY3LbeF8sAQg-JD6CnvXMMNZI&sz=w1600");
  assert.equal(galleryPhotoSrc({ id: "ext_1", url: gdImg.value.url }), gdImg.value.url);
  assert.equal(
    galleryPhotoCardSrc({ id: "ext_1", url: gdImg.value.url }),
    "https://drive.google.com/thumbnail?id=1P_vE3pOJY3LbeF8sAQg-JD6CnvXMMNZI&sz=w800",
    "cards load 800px Drive images for faster mobile bandwidth",
  );
  assert.equal(
    galleryPhotoThumbSrc({ id: "ext_1", url: gdImg.value.url }, 240),
    "https://drive.google.com/thumbnail?id=1P_vE3pOJY3LbeF8sAQg-JD6CnvXMMNZI&sz=w240",
    "thumbnail strips load compact 240px images",
  );
  assert.match(galleryPhotoSrc({ id: "gp_abc" }), /\/gallery\/photos\/gp_abc$/);
  assert.equal(parseImageUrl("https://drive.google.com/drive/folders/12ehFJPw2V").ok, false);
  assert.equal(parseImageUrl("http://localhost/test.png").ok, false);
});

test("Dokumentasi access & dedicated public routes (/dokumentasi and /dokumentasi/:slug) are wired", () => {
  assert.ok(ACCESS_CARDS.some((c) => c.id === "gallery-manage" && c.to === "/dashboard/dokumentasi"));

  const router = read("src/router/index.js");
  assert.ok(
    has(
      router,
      'path: "/dokumentasi", name: "GalleryArchive", component: () => import("../views/GalleryArchiveView.vue")',
    ),
    "public /dokumentasi archive route registered",
  );
  assert.ok(
    has(
      router,
      'path: "/dokumentasi/:slug", name: "GalleryMomentDetail", component: () => import("../views/GalleryMomentDetailView.vue")',
    ),
    "public /dokumentasi/:slug detail route registered",
  );
  assert.ok(
    has(
      router,
      'path: "dokumentasi", name: "GalleryManagement", component: () => import("../views/dashboard/admin/GalleryManagementView.vue"), meta: { role: "admin", feature: "gallery-manage" }',
    ),
  );
  assert.ok(has(router, "if (to.hash)"), "router preserves hash navigation instead of forcing top: 0");

  const layout = read("src/views/dashboard/DashboardLayout.vue");
  assert.ok(has(layout, "{ id: 'gallery-manage', to: '/dashboard/dokumentasi', label: 'Dokumentasi'"));
  assert.ok(has(layout, "{ to: '/dashboard/dokumentasi', label: 'Dokumentasi', icon: ICON.gallery }"));

  const navbar = read("src/components/NavbarComponent.vue");
  assert.ok(
    has(navbar, 'if (route.path !== "/") { router.push(href === "#beranda" ? "/" : { path: "/", hash: href }); return; }'),
    "Navbar navigates cleanly back to landing page sections when clicked from /dokumentasi",
  );
});

test("Landing page shows 3 curated highlights linking to /dokumentasi/:slug and /dokumentasi", () => {
  const home = read("src/views/HomeView.vue");
  assert.ok(has(home, '<GallerySection @ready="onGalleryReady" />'));
  assert.ok(has(home, 'window.location.hash === "#dokumentasi"'));

  const section = read("src/components/landing/GallerySection.vue");
  assert.ok(has(section, 'v-if="moments.length" id="dokumentasi"'));
  assert.ok(has(section, "const HIGHLIGHT_LIMIT = 3"), "landing section shows 3 curated highlights");
  assert.ok(has(section, "emit('ready')"));
  assert.ok(has(section, ':to="`/dokumentasi/${encodeURIComponent(m.slug || m.id)}`"'), "cards link to shareable moment detail page");
  assert.ok(has(section, ':to="archiveTarget"'), "button links to dedicated /dokumentasi archive page");
  assert.ok(has(section, "api.get('/gallery/public')"));
});

test("GalleryArchiveView and GalleryMomentDetailView deliver SEO, WhatsApp sharing, inline player, and zoomable lightbox", () => {
  const archive = read("src/views/GalleryArchiveView.vue");
  assert.ok(has(archive, "applyPageSeo("), "archive updates dynamic SEO tags & JSON-LD");
  assert.ok(has(archive, "const PAGE_SIZE = 12"), "archive paginates incrementally for performance");
  assert.ok(has(archive, "route.query.kategori"), "archive syncs category filter in query");

  const detail = read("src/views/GalleryMomentDetailView.vue");
  assert.ok(has(detail, "api.get(`/gallery/public/${encodeURIComponent(slugOrId)}`)"), "detail fetches single moment by slug or id");
  assert.ok(has(detail, "applyPageSeo(") && has(detail, "'ImageGallery'"), "detail injects dynamic SEO meta and ImageGallery JSON-LD");
  assert.ok(has(detail, "https://wa.me/?text="), "detail offers 1-tap WhatsApp share");
  assert.ok(has(detail, "copyShareLink"), "detail offers copy link action");
  assert.ok(has(detail, '<GalleryLightbox'), "detail mounts zoomable GalleryLightbox for photos");
  assert.ok(has(detail, ':src="activeVideo.embedUrl"'), "embeds YouTube/Instagram/Google Drive video directly in web");
  assert.ok(has(detail, "activeVideo.platform === 'gdrive'"), "Google Drive uses adaptive height for vertical & horizontal videos");
  assert.ok(!has(detail, "Buka di Google Drive"), "no external Google Drive button on detail page");

  const lightbox = read("src/components/landing/GalleryLightbox.vue");
  assert.ok(has(lightbox, "env(safe-area-inset-top)"), "lightbox clears mobile notch / Dynamic Island");
  assert.ok(has(lightbox, "env(safe-area-inset-bottom)"), "lightbox clears mobile home bar");
  assert.ok(has(lightbox, "zoomIn") && has(lightbox, "zoomOut") && has(lightbox, "resetZoom"), "lightbox supports zoom in/out/reset controls");
  assert.ok(has(lightbox, "toggleDoubleTapZoom") && has(lightbox, "touchMode === 'pinch'"), "lightbox supports double-tap and 2-finger pinch zoom");
  assert.ok(has(lightbox, "clampPan"), "lightbox supports bounded panning when zoomed");
});

test("GalleryManagementView supports moment upload, live publish default, custom categories, cover selection, and share link", () => {
  const mgmt = read("src/views/dashboard/admin/GalleryManagementView.vue");
  assert.ok(has(mgmt, "published: true"), "moments publish immediately by default");
  assert.ok(has(mgmt, "compressGalleryPhoto(file)"));
  assert.ok(has(mgmt, "api.post('/gallery/categories'"));
  assert.ok(has(mgmt, "api.put(`/gallery/categories/${encodeURIComponent(c.id)}`"));
  assert.ok(has(mgmt, "api.delete(`/gallery/categories/${encodeURIComponent(c.id)}`"));
  assert.ok(has(mgmt, "Jadikan sampul"));
  assert.ok(has(mgmt, "uploadedPhotoCount < MAX_UPLOADED_PHOTOS"), "only uploaded photos are capped at 6; external links stay open");
  assert.ok(has(mgmt, "addPhotosFromLinks"));
  assert.ok(has(mgmt, "addVideosFromLinks"));
  assert.ok(has(mgmt, "copyMomentLink"), "dashboard cards provide 1-tap Salin Link for sharing");
  assert.ok(has(mgmt, 'href="/dokumentasi"'), "dashboard View on Web opens /dokumentasi archive");
});
