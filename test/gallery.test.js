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
  chooseMasonryColumnCount,
  distributeMasonryColumns,
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
    has(navbar, '{ to: "/dokumentasi", label: "Dokumentasi", section: "dokumentasi" }'),
    "Navbar surfaces Dokumentasi menu item linking directly to /dokumentasi",
  );
  assert.ok(
    has(navbar, 'if (route.path !== "/") { router.push(href === "#beranda" ? "/" : { path: "/", hash: href }); return; }'),
    "Navbar navigates cleanly back to landing page sections when clicked from /dokumentasi",
  );

  const appVue = read("src/App.vue");
  assert.ok(!has(appVue, ".page-fade-enter-from { opacity: 0; }"), "page transition never flashes blank white canvas");
  const themeUtil = read("src/utils/themeColor.js");
  assert.ok(has(themeUtil, "surfaceColorFor"), "body/html backdrop aligns with route surface to prevent white flash");
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
  assert.ok(has(archive, "useLenisScroll()"), "archive enables smooth Lenis scrolling like landing page");
  assert.ok(has(archive, "applyPageSeo("), "archive updates dynamic SEO tags & JSON-LD");
  assert.ok(has(archive, "const PAGE_SIZE = 12"), "archive paginates incrementally for performance");
  assert.ok(has(archive, "route.query.kategori"), "archive syncs category filter in query");

  const detail = read("src/views/GalleryMomentDetailView.vue");
  assert.ok(has(detail, "useLenisScroll()"), "detail enables smooth Lenis scrolling like landing page");
  assert.ok(has(detail, "api.get(`/gallery/public/${encodeURIComponent(slugOrId)}`)"), "detail fetches single moment by slug or id");
  assert.ok(has(detail, "applyPageSeo(") && has(detail, "'ImageGallery'"), "detail injects dynamic SEO meta and ImageGallery JSON-LD");
  assert.ok(has(detail, "https://wa.me/?text="), "detail offers 1-tap WhatsApp share");
  assert.ok(has(detail, "copyShareLink"), "detail offers copy link action");
  assert.ok(has(detail, "<GalleryLikeButton"), "detail offers animated public heart like toggle with live count");
  assert.ok(has(detail, "showFloatingLike") && has(detail, "lp-fab-pop"), "detail shows animated floating mobile Like pill on scroll");
  assert.ok(has(detail, "flex-col-reverse gap-3") && has(detail, "w-full sm:w-auto lp-btn-gold"), "bottom navigation buttons stack symmetrically full-width on mobile");

  const likeBtn = read("src/components/landing/GalleryLikeButton.vue");
  assert.ok(has(likeBtn, "glb-spark-fly") && has(likeBtn, "glb-heart-spring"), "Like animation includes 8-way sparkle burst and spring pop");
  assert.ok(has(likeBtn, "glb-heart-wobble") && has(likeBtn, "glb-drop-left"), "Unlike toggle includes expressive wobble and split droplets");
  assert.ok(has(detail, "lp-masonry-flex") && has(detail, "distributeMasonryColumns"), "detail photo gallery renders left-to-right balanced natural-ratio Masonry");
  // Verify balanced Masonry fills left-to-right without leaving empty right columns
  assert.equal(chooseMasonryColumnCount(4, true), 2, "4 photos use full-width 2x2 Masonry on desktop (no empty 3rd column)");
  assert.equal(chooseMasonryColumnCount(3, true), 3, "3 photos fill all 3 columns left-to-right");
  assert.equal(chooseMasonryColumnCount(8, true), 3, "8 photos balance across 3 columns on desktop");
  assert.equal(chooseMasonryColumnCount(8, false), 2, "mobile stays 2 balanced columns");
  const sample4 = [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }];
  const cols4 = distributeMasonryColumns(sample4, chooseMasonryColumnCount(4, true));
  assert.deepEqual(
    cols4.map((c) => c.map((x) => x.photo.id)),
    [["a", "c"], ["b", "d"]],
    "4 photos fill left-to-right cleanly into 2 balanced columns",
  );
  const sampleMixed = [
    { id: "tall", width: 600, height: 1000 }, // col 0 (1.67)
    { id: "wide1", width: 1000, height: 600 }, // col 1 (0.60)
    { id: "wide2", width: 1000, height: 600 }, // col 2 (0.60)
    { id: "next", width: 800, height: 600 }, // should go to col 1 (shortest!) instead of stacking on tall col 0
  ];
  const colsMixed = distributeMasonryColumns(sampleMixed, 3);
  assert.deepEqual(
    colsMixed.map((c) => c.map((x) => x.photo.id)),
    [["tall"], ["wide1", "next"], ["wide2"]],
    "shortest-column Masonry balances tall portraits against landscapes while filling row 1 left-to-right",
  );
  assert.ok(has(detail, "detail-hero-mihrab") && has(detail, "OrnamentRule"), "detail hero is symmetrically centered with Islamic geometric motifs");
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
  assert.ok(!has(mgmt, "content-visibility: auto"), "photo grid tiles avoid content-visibility row overlap bug");
  assert.ok(!has(mgmt, "is-scrollable"), "photo grid avoids nested mobile scroll traps");
  assert.ok(has(mgmt, "photoAddMode"), "photo form simplifies upload vs link into a 2-tab switcher");

  const likesComposable = read("src/composables/useGalleryLikes.js");
  assert.ok(has(likesComposable, "/gallery/public/${encodeURIComponent(slugOrId)}/like"), "likes call public toggle endpoint");
  assert.ok(has(likesComposable, "tpq_gallery_vid_v1"), "likes persist anonymous visitor id in localStorage");
  assert.ok(has(likesComposable, "tpq_gallery_liked_v1"), "likes remember toggled state in localStorage");
});
