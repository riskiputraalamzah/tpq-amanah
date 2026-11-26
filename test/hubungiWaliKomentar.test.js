import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { squash, has } from "./helpers/sourceText.js";
import { buildWaliGreeting, matchesContactQuery } from "../src/utils/waliContact.js";
import { commentTimeAgo, commentInitial } from "../src/utils/galleryComments.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const read = (p) => fs.readFileSync(path.join(here, "..", p), "utf8");

/* ---------------- Hubungi Wali ---------------- */

test("greeting: Ibu / Bapak by relation, the wali's name, the child and jilid, the sender", () => {
  const ibu = buildWaliGreeting({ relation: "ibu", waliName: "Siti", santriName: "Ahmad", jilidLabel: "Jilid 6", senderName: "Ustadz Riski" });
  assert.equal(ibu, "Assalamu'alaikum Ibu Siti.\n\nSaya Ustadz Riski dari TPQ Amanah, izin menyampaikan perihal ananda Ahmad (Jilid 6).\n\n");
  assert.match(buildWaliGreeting({ relation: "ayah", waliName: "Hasan" }), /^Assalamu'alaikum Bapak Hasan\./);
  assert.match(buildWaliGreeting({ relation: "wali", waliName: "" }), /^Assalamu'alaikum Bapak\/Ibu wali santri\./);
  assert.match(buildWaliGreeting({ relation: "ibu", waliName: "" }), /^Assalamu'alaikum Ibu\./);
  assert.match(buildWaliGreeting({ relation: "ibu", waliName: "Bunda Aisyah" }), /^Assalamu'alaikum Bunda Aisyah\./, "no 'Ibu Bunda …'");
  assert.match(buildWaliGreeting({ senderName: "", senderIsAdmin: true }), /Saya admin dari TPQ Amanah/);
});

test("search: santri name, nomor induk, wali name, or the number typed 08… / 62…", () => {
  const s = { name: "Ahmad Fauzi", nomorInduk: "A-07", contacts: [{ name: "Siti Aminah", phone: "6281234567890" }] };
  assert.ok(matchesContactQuery(s, ""));
  assert.ok(matchesContactQuery(s, "fauzi"));
  assert.ok(matchesContactQuery(s, "a-07"));
  assert.ok(matchesContactQuery(s, "aminah"));
  assert.ok(matchesContactQuery(s, "0812-3456"));
  assert.ok(matchesContactQuery(s, "62812345"));
  assert.ok(!matchesContactQuery(s, "0899"));
  assert.ok(!matchesContactQuery(s, "12"), "two digits are too few to search by number");
});

test("Hubungi Wali: in the Santri & Wali menu for admin and guru, routed for both, opens wa.me with the greeting", () => {
  const layout = squash(read("src/views/dashboard/DashboardLayout.vue"));
  assert.ok(has(layout, "{ to: '/dashboard/hubungi-wali', label: 'Hubungi Wali', icon: ICON.phone },"));
  assert.equal(read("src/views/dashboard/DashboardLayout.vue").split("/dashboard/hubungi-wali").length - 1, 2, "admin menu and guru menu");
  const router = read("src/router/index.js");
  assert.match(router, /path: "hubungi-wali",[\s\S]*?HubungiWaliView\.vue[\s\S]*?meta: \{ role: \["admin", "guru"\] \}/);
  const view = squash(read("src/views/dashboard/HubungiWaliView.vue"));
  assert.ok(has(view, "api.get('/wali/admin/contacts', { cache: false })"), "the server decides the jilid (scope)");
  assert.ok(has(view, "return `https://wa.me/${c.phone}?text=${encodeURIComponent(text)}`"));
  assert.ok(has(view, ':href="`tel:+${c.phone}`"'), "a call button next to WhatsApp");
  assert.ok(has(view, "query: { santri: s.santriId }"), "no number yet: straight to linking on Data Wali Santri");
  assert.ok(has(view, "font-size: 1rem; /* 16px: no zoom-in on iPhone */"));
  assert.ok(has(view, "min-height: 44px;"), "finger-sized buttons");
});

/* ---------------- Komentar momen ---------------- */

test("comment times read naturally in Indonesian", () => {
  const now = Date.UTC(2026, 10, 26, 10, 0, 0);
  const ago = (ms) => new Date(now - ms).toISOString();
  assert.equal(commentTimeAgo(ago(20 * 1000), now), "baru saja");
  assert.equal(commentTimeAgo(ago(5 * 60 * 1000), now), "5 menit lalu");
  assert.equal(commentTimeAgo(ago(3 * 3600 * 1000), now), "3 jam lalu");
  assert.equal(commentTimeAgo(ago(30 * 3600 * 1000), now), "kemarin");
  assert.equal(commentTimeAgo(ago(4 * 86400 * 1000), now), "4 hari lalu");
  assert.equal(commentTimeAgo("2026-11-12T03:00:00.000Z", now), "12 Nov 2026");
  assert.equal(commentInitial("Ustadz Riski"), "R");
  assert.equal(commentInitial("Bunda Aisyah"), "A");
  assert.equal(commentInitial(""), "?");
});

test("comments on the moment page: login to write (wali by WA code or staff), likes untouched, delete asks first", () => {
  const page = squash(read("src/views/GalleryMomentDetailView.vue"));
  assert.ok(has(page, '<GalleryComments :slug="moment.slug || moment.id" />'));
  assert.ok(has(page, '<GalleryLikeButton :moment="moment" variant="hero" @result="onLikeResult" />'), "likes still login-free");
  const c = squash(read("src/components/landing/GalleryComments.vue"));
  assert.ok(has(c, '<form v-if="authStore.isAuthenticated"'));
  assert.ok(has(c, "const query = { redirect: `${momentPath.value}?komentar=1` }"));
  assert.ok(has(c, "if (kind === 'wali') query.as = 'wali'"), "the WhatsApp-code tab opens for a parent");
  assert.ok(has(c, "if (err.response?.data?.code !== 'NAME_REQUIRED') throw err"), "a wali without a name is asked once");
  assert.ok(has(c, "tone: 'danger',"), "our own dialog before deleting, never confirm()");
  assert.ok(!c.includes("confirm("), "no native confirm");
  assert.ok(has(c, "whitespace-pre-line break-words"), "text shown as text (no HTML), long words wrap on phones");
  const login = squash(read("src/views/LoginView.vue"));
  assert.ok(has(login, 'if (redirect.startsWith("/dokumentasi/")) {'), "a wali returns to the moment after the WhatsApp code");
});

test("Dokumentasi (admin): comments are a tab and part of each moment's page — no pop-up; 'baru' badge; reply + delete", () => {
  const v = squash(read("src/views/dashboard/admin/GalleryManagementView.vue"));
  assert.ok(!v.includes("Kelola Komentar"), "the old comments pop-up is gone");
  assert.ok(has(v, "{{ newCommentCount }} baru"), "how many arrived since the last look, on the Komentar tab");
  assert.ok(has(v, '<GalleryCommentFeed :moments="moments" :seen-at="seenBefore" @loaded="onCommentsLoaded" />'));
  assert.ok(has(v, '<GalleryLikeFeed :moments="moments" :likes-total="likesTotal" />'));
  assert.ok(has(v, "if (t === 'suka' && !isAdmin.value) return 'momen'"), "the Suka tab is for the admin only");
  const d = squash(read("src/views/dashboard/admin/GalleryMomentAdminView.vue"));
  assert.ok(has(d, ':moment-id="moment.id"'), "the moment page shows its own comments");
  assert.ok(has(d, "v-else-if=\"tab === 'suka' && isAdmin\""), "and, for the admin, its likes");
  const f = squash(read("src/components/gallery-admin/GalleryCommentFeed.vue"));
  assert.ok(has(f, "api.get('/gallery/manage/comments', {"));
  assert.ok(has(f, "/gallery/manage/comments/${encodeURIComponent(replyFor.value.targetId)}/replies"), "staff answer from the dashboard");
  assert.ok(has(f, "api.delete(`/gallery/comments/${encodeURIComponent(c.id)}`)"));
  assert.ok(has(f, "tone: 'danger',"), "our own dialog before deleting");
  assert.ok(has(f, ".sort((a, b) => b.lastAt - a.lastAt)"), "newest activity first");
  assert.ok(!f.includes("confirm("), "no native confirm");
});

test("public comments: replies under their comment, 'Balas' only when the server says canReply", () => {
  const c = squash(read("src/components/landing/GalleryComments.vue"));
  assert.ok(has(c, "canReply.value = Boolean(data.canReply)"));
  assert.ok(has(c, 'v-if="canReply"') && has(c, '@click="startReply(t, t)"'), "Balas only for staff");
  assert.ok(has(c, "parentId: replyFor.value.targetId"));
  assert.ok(has(c, "comments.value.filter((x) => x.id !== c.id && x.parentId !== c.id)"), "a deleted comment takes its replies");
  const likes = squash(read("src/composables/useGalleryLikes.js"));
  assert.ok(has(likes, "intent: nextLiked ? 'like' : 'unlike'"), "a tap says what it means (one like per account)");
});

test("Perbesar: up to 1000%, the +/- buttons multiply (6 taps to 1000%), zoom follows the finger / cursor, sharp at rest", () => {
  const lb = squash(read("src/components/landing/GalleryLightbox.vue"));
  assert.ok(has(lb, "const MAX_ZOOM = 10"));
  assert.ok(has(lb, "setZoom(zoom.value * ZOOM_FACTOR)"));
  let z = 1;
  let taps = 0;
  while (z < 10) { z = Math.min(10, z * 1.5); taps += 1; }
  assert.equal(taps, 6);
  assert.ok(has(lb, "setZoom(next, { x: e.clientX, y: e.clientY })"), "mouse wheel / touchpad toward the cursor");
  assert.ok(has(lb, "{ x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2 }"), "pinch toward the spot between the fingers");
  assert.ok(has(lb, "toggleDoubleTapZoom({ x: changed.clientX, y: changed.clientY })"), "double tap on the spot tapped");
  assert.ok(has(lb, "isInteracting ? 'transition-none will-change-transform'"), "will-change only while moving, so the photo is redrawn sharp");
  assert.ok(has(lb, ":src=\"galleryPhotoSrc(activePhoto, hiRes ? { width: HIRES_WIDTH } : {})\""), "deep zoom loads the larger Drive photo");
});
