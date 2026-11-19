import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { directionFor, deepPageFor, pageDepth, tabRank, TAB_ORDER, DEEP_PAGES } from "../src/utils/navDirection.js";
import { squash, has } from "./helpers/sourceText.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const read = (p) => fs.readFileSync(path.join(here, "..", p), "utf8");

const go = (to, from, extra = {}) => directionFor({ to, from, role: "admin", ...extra });

test("the browser's Back and Forward decide first: the history position moved", () => {
  assert.equal(go("/dashboard", "/dashboard/pendaftaran/langsung", { posNow: 3, posPrev: 4 }), "back");
  assert.equal(go("/dashboard/santri", "/dashboard", { posNow: 5, posPrev: 4 }), "forward");
  // Back between two tabs that sit left-to-right: still Back (the browser says so, not the tab order)
  assert.equal(go("/dashboard/kbm-monitor", "/dashboard", { posNow: 2, posPrev: 3 }), "back");
  // a plain push leaves the position as it was when the guards run
  assert.equal(go("/dashboard/santri", "/dashboard", { posNow: 4, posPrev: 4 }), "forward");
  // no position (first visit, old browser): the page rules
  assert.equal(go("/dashboard/santri", "/dashboard", { posNow: null, posPrev: null }), "forward");
});

test("into an inner page = forward, up to its parent = back (also when there is no history to go back to)", () => {
  assert.equal(go("/dashboard/pendaftaran/langsung", "/dashboard/pendaftaran"), "forward");
  assert.equal(go("/dashboard/pendaftaran", "/dashboard/pendaftaran/langsung"), "back");
  assert.equal(go("/dashboard/savings/b1", "/dashboard/admin-savings"), "forward");
  assert.equal(go("/dashboard/admin-savings", "/dashboard/savings/b1"), "back");
  assert.equal(directionFor({ to: "/dashboard/kbm", from: "/dashboard/kbm/s1/jurnal", role: "guru" }), "back");
  assert.equal(directionFor({ to: "/dashboard/kbm/s1/jurnal", from: "/dashboard/kbm", role: "guru" }), "forward");
});

test("between the bottom-bar tabs the tab order decides, so the page moves the way the finger did", () => {
  const admin = TAB_ORDER.admin;
  for (let i = 0; i < admin.length; i += 1) {
    for (let j = 0; j < admin.length; j += 1) {
      if (i === j) continue;
      assert.equal(go(admin[j], admin[i]), j > i ? "forward" : "back", `${admin[i]} -> ${admin[j]}`);
    }
  }
  assert.equal(directionFor({ to: "/dashboard/attendance", from: "/dashboard/kbm", role: "guru" }), "forward");
  assert.equal(directionFor({ to: "/dashboard/kbm", from: "/dashboard/absen-santri", role: "guru" }), "back");
});

test("a page from the Menu (not a tab) comes in from the right; moving to a tab from it uses the other rules", () => {
  assert.equal(go("/dashboard/broadcasts", "/dashboard"), "forward");
  assert.equal(go("/dashboard/broadcasts", "/dashboard/wa-log"), "forward");
  assert.equal(go("/dashboard", "/dashboard/broadcasts"), "forward", "no tab order for it: forward, like any new page");
});

test("inner pages know their title, their parent and their depth", () => {
  assert.deepEqual(deepPageFor("/dashboard/kbm/abc/jurnal", "guru"), { title: "Jurnal KBM", back: "/dashboard/kbm" });
  assert.deepEqual(deepPageFor("/dashboard/lpj/r1/sptjm", "guru"), { title: "SPTJM", back: "/dashboard/lpj/r1" });
  assert.equal(deepPageFor("/dashboard/lpj/r1", "admin").back, "/dashboard/admin-lpj");
  assert.equal(deepPageFor("/dashboard/lpj/r1", "guru").back, "/dashboard/lpj");
  assert.equal(deepPageFor("/dashboard/savings/b1", "admin").back, "/dashboard/admin-savings");
  assert.equal(deepPageFor("/dashboard/savings/b1", "guru").back, "/dashboard/savings");
  assert.equal(deepPageFor("/dashboard/santri", "admin"), null);
  assert.equal(pageDepth("/dashboard/santri", "admin"), 1);
  assert.equal(pageDepth("/dashboard/pendaftaran/langsung?x=1", "admin"), 2);
  assert.ok(DEEP_PAGES.every(([re, title, back]) => re instanceof RegExp && title && typeof back === "function"));
});

test("wali portal: tabs, a child's page, and the pages inside it", () => {
  assert.equal(pageDepth("/wali", "wali"), 1);
  assert.equal(pageDepth("/wali/izin", "wali"), 1);
  assert.equal(pageDepth("/wali/santri/s7", "wali"), 2);
  assert.equal(pageDepth("/wali/daftar/abc", "wali"), 2);
  assert.equal(pageDepth("/wali/tautkan", "wali"), 2);
  assert.equal(pageDepth("/wali/santri/s7/rapor", "wali"), 3);
  assert.equal(directionFor({ to: "/wali/santri/s7", from: "/wali", role: "wali" }), "forward");
  assert.equal(directionFor({ to: "/wali", from: "/wali/santri/s7/rapor", role: "wali" }), "back");
  assert.equal(directionFor({ to: "/wali/akun", from: "/wali/izin", role: "wali" }), "forward");
  assert.equal(directionFor({ to: "/wali/izin", from: "/wali/akun", role: "wali" }), "back");
});

test("tabRank: home only for the home page, other tabs also for their inner pages", () => {
  assert.equal(tabRank("/dashboard", "admin"), 0);
  assert.equal(tabRank("/dashboard/santri", "admin"), 1);
  assert.equal(tabRank("/dashboard/kbm/daily-workspace", "guru"), 1, "an inner page of the KBM tab");
  assert.equal(tabRank("/dashboard/broadcasts", "admin"), null);
  assert.equal(tabRank("/dashboard/santri-lain", "admin"), null, "a prefix of the name is not a child");
});

test("TAB_ORDER is the real tab order of the bottom bars", () => {
  const chrome = read("src/components/MobileChrome.vue");
  const block = (role) => {
    const start = chrome.indexOf(`  ${role}: [`, chrome.indexOf("const NAV = {"));
    const end = chrome.indexOf("\n  ],", start);
    return [...chrome.slice(start, end).matchAll(/to: '([^']+)'/g)].map((m) => m[1]);
  };
  assert.deepEqual(block("admin"), TAB_ORDER.admin, "admin tabs (MobileChrome.vue)");
  assert.deepEqual(block("guru"), TAB_ORDER.guru, "guru tabs (MobileChrome.vue)");
  const wali = read("src/views/wali/WaliLayout.vue");
  const navStart = wali.indexOf("const NAV = [");
  const waliTabs = [...wali.slice(navStart, wali.indexOf("\n]\n", navStart)).matchAll(/to: '([^']+)'/g)].map((m) => m[1]);
  assert.deepEqual(waliTabs, TAB_ORDER.wali, "wali tabs (WaliLayout.vue)");
});

test("both layouts slide their pages through the same composable; the old page leaves in place", () => {
  const dash = squash(read("src/views/dashboard/DashboardLayout.vue"));
  const wali = squash(read("src/views/wali/WaliLayout.vue"));
  for (const [name, src] of [["dashboard", dash], ["wali", wali]]) {
    assert.ok(has(src, '<transition :name="pageTransition" @before-leave="onBeforeLeave">'), `${name}: dynamic transition name`);
    assert.ok(has(src, "usePageTransition"), `${name}: uses the composable`);
  }
  assert.ok(!has(dash, '<transition name="fade" mode="out-in">'), "the old fade is gone");
  const composable = squash(read("src/composables/usePageTransition.js"));
  assert.ok(has(composable, "router.beforeEach"), "direction is decided before the page changes");
  assert.ok(has(composable, "position: 'fixed'"), "the old page is held where it is");
  assert.ok(has(composable, "prefers-reduced-motion: reduce"), "reduced motion is respected");
  const css = read("src/styles/page-transition.css");
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(css, /overflow-x: clip/, "browsers that cannot clip get no travel");
  assert.ok(!/transition:\s*all/.test(css), "only transform and opacity animate");
});

test("one bottom bar for everyone: the dashboard and the wali portal both draw it with BubbleNav", () => {
  const bar = read("src/components/BubbleNav.vue");
  const chrome = read("src/components/MobileChrome.vue");
  const wali = read("src/views/wali/WaliLayout.vue");
  assert.match(chrome, /<BubbleNav[\s\S]*?phone-only/, "dashboard: phones and tablets only");
  assert.match(wali, /<BubbleNav[\s\S]*?floating/, "wali: floats on wide screens");
  assert.ok(!/\.mc-nav[\w-]*\s*\{/.test(chrome), "the dashboard component holds no copy of the bar's styles");
  assert.ok(!/wali-nav/.test(wali), "and neither does the wali layout");
  assert.ok(bar.includes("TEXT_FIELD"), "the bar steps aside while typing, for both");
  // the pill design: the active tab shows its name, the others are icons read aloud by their aria-label; nothing is measured
  assert.ok(bar.includes(".mc-nav-item.is-active .mc-nav-label"), "the active tab opens out its name");
  assert.ok(bar.includes(":aria-label=\"itemLabel(item)\""), "an icon-only tab is still named");
  assert.ok(!bar.includes("getBoundingClientRect"), "no measuring: the pill grows by itself");
  assert.ok(/min-width: 44px/.test(bar) && /height: 44px/.test(bar), "every tab is a 44px tap target");
});
