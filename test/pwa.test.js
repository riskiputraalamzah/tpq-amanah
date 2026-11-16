import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { THEME, themeColorFor } from "../src/utils/themeColor.js";
import { squash, has } from "./helpers/sourceText.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, "..");
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const pngSize = (file) => {
  const b = fs.readFileSync(path.join(root, file));
  assert.equal(b.toString("ascii", 1, 4), "PNG", `${file} is a PNG`);
  return [b.readUInt32BE(16), b.readUInt32BE(20)];
};

test("the browser bars take the colour of the area", () => {
  assert.equal(themeColorFor("/dashboard"), THEME.dashboard);
  assert.equal(themeColorFor("/dashboard/kbm/abc/jurnal?x=1"), THEME.dashboard);
  assert.equal(themeColorFor("/wali"), THEME.wali);
  assert.equal(themeColorFor("/wali/santri/s7/rapor"), THEME.wali);
  assert.equal(themeColorFor("/"), THEME.site);
  assert.equal(themeColorFor("/login"), THEME.site);
  assert.equal(themeColorFor("/tabungan/b1"), THEME.site);
  assert.equal(themeColorFor("/dashboardx"), THEME.site, "a longer name is not the dashboard");
});

test("the dashboard's top bar, the browser bar and the installed app are one and the same green", () => {
  const manifest = JSON.parse(read("public/manifest.webmanifest"));
  assert.equal(manifest.theme_color, THEME.dashboard, "installed app status bar = dashboard colour");
  const chrome = read("src/components/MobileChrome.vue");
  const bar = chrome.slice(chrome.indexOf(".mc-bar {"), chrome.indexOf(".mc-logo,"));
  assert.ok(bar.includes(`background: ${THEME.dashboard};`), "the top bar is that solid colour (not translucent over the page)");
  const layout = read("src/views/dashboard/DashboardLayout.vue");
  assert.ok(layout.includes("#03291d"), "the sidebar starts with the same green");
});

test("the manifest makes the app installable: name, start page, scope, display, icons that exist at their sizes", () => {
  const m = JSON.parse(read("public/manifest.webmanifest"));
  assert.ok(m.name && m.short_name && m.short_name.length <= 12, "a short name fits under the icon");
  assert.equal(m.display, "standalone");
  assert.equal(m.start_url, "/login", "signed-in people are sent on to their home from there");
  assert.equal(m.scope, "/");
  assert.equal(m.lang, "id");
  for (const icon of m.icons) {
    const [w, h] = icon.sizes.split("x").map(Number);
    assert.deepEqual(pngSize(`public${icon.src}`), [w, h], `${icon.src} is ${icon.sizes}`);
  }
  assert.ok(m.icons.some((i) => i.sizes === "192x192" && i.purpose === "any"));
  assert.ok(m.icons.some((i) => i.sizes === "512x512" && i.purpose === "any"));
  assert.ok(m.icons.some((i) => i.sizes === "512x512" && i.purpose === "maskable"), "a maskable icon for Android's shapes");
  assert.deepEqual(pngSize("public/icons/apple-touch-icon.png"), [180, 180]);
});

test("index.html links the manifest, the iPhone settings and covers the notch", () => {
  const html = squash(read("index.html"));
  assert.ok(has(html, '<link rel="manifest" href="/manifest.webmanifest" />'));
  assert.ok(has(html, "viewport-fit=cover"), "the top bar can run under an iPhone's status bar");
  assert.ok(has(html, '<meta name="apple-mobile-web-app-capable" content="yes" />'));
  assert.ok(has(html, '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />'));
  assert.ok(has(html, '<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />'));
  assert.ok(has(html, '<meta name="theme-color"'));
});

test("the router updates the colour on every page change; pages outside the two layouts clear the status bar", () => {
  const router = squash(read("src/router/index.js"));
  assert.ok(has(router, "router.afterEach((to) => applyThemeColor(to.path));"));
  const css = squash(read("src/style.css"));
  assert.ok(has(css, "@media (display-mode: standalone)") && has(css, "padding-top: env(safe-area-inset-top, 0px);"));
  const wali = read("src/views/wali/wali.css");
  assert.ok(wali.includes("env(safe-area-inset-top)"), "the wali header pads itself");
  const chrome = read("src/components/MobileChrome.vue");
  assert.ok(chrome.includes("padding: env(safe-area-inset-top, 0px)"), "the dashboard top bar pads itself");
});
