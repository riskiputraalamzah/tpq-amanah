// Pop-up layers. A confirmation (DialogHost, ask()) is often opened FROM another pop-up (hapus santri, tolak
// pengajuan, ...): it must be on top of every pop-up in the app, and only the toasts above it. Every z-index in
// src/ is read here, so a new pop-up with a higher layer fails this test instead of hiding the confirmation.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const src = path.join(here, "..", "src");

function filesIn(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return filesIn(p);
    return /\.(vue|css|js)$/.test(e.name) ? [p] : [];
  });
}

const layers = filesIn(src).flatMap((file) => {
  const rel = path.relative(src, file).replace(/\\/g, "/");
  return fs
    .readFileSync(file, "utf8")
    .split("\n")
    .flatMap((line, i) => [...line.matchAll(/z-index:\s*(\d+)/g)].map((m) => ({ where: `${rel}:${i + 1}`, z: Number(m[1]) })));
});
const zOf = (where) => {
  const found = layers.filter((l) => l.where.startsWith(where));
  assert.equal(found.length, 1, `${where}: one z-index`);
  return found[0].z;
};

test("the app's confirmation dialog is above every pop-up; only the toasts are above it", () => {
  const dialog = zOf("components/DialogHost.vue");
  const toasts = zOf("components/GlobalToast.vue:75");
  const others = layers.filter((l) => !l.where.startsWith("components/DialogHost.vue") && l.where !== "components/GlobalToast.vue:75");
  const above = others.filter((l) => l.z >= dialog);
  assert.deepEqual(above, [], "nothing may cover the confirmation");
  assert.ok(toasts > dialog, "the toasts stay readable above it");
  assert.ok(layers.some((l) => l.where.startsWith("style.css") && l.z === 999999), "the global .modal-overlay layer is still counted");
});

test("a pop-up opened from another pop-up is above it (the KK photo over the review sheet)", () => {
  const view = fs.readFileSync(path.join(src, "views/dashboard/admin/AdminWaliView.vue"), "utf8");
  const sheet = Number(view.match(/\.wv-overlay \{[^}]*z-index: (\d+)/)[1]);
  const top = Number(view.match(/\.wv-overlay\.wv-overlay-top \{[^}]*z-index: (\d+)/)[1]);
  assert.ok(top > sheet);
});

// A page's pop-ups cover the phone's top and bottom bars only when nothing between them and the layout makes its own
// stacking context. Teleported ones live in <body>; the others sit right under the page's root element.
test("page pop-ups cover the phone bars: the layout is the one stacking context, not the page area", () => {
  const layout = fs.readFileSync(path.join(src, "views/dashboard/DashboardLayout.vue"), "utf8");
  const rule = (sel) => {
    const at = layout.indexOf(`\n${sel} {`);
    return at < 0 ? "" : layout.slice(at, layout.indexOf("}", at));
  };
  assert.match(rule(".dashboard-layout"), /isolation: isolate/);
  assert.doesNotMatch(rule(".dashboard-main"), /isolation|transform|filter|z-index/, ".dashboard-main must not trap the page's pop-ups under the bars");
});

test("every pop-up that is not teleported sits directly under its page's root element", () => {
  const views = filesIn(path.join(src, "views", "dashboard")).filter((f) => f.endsWith(".vue"));
  const VOID = new Set(["input", "img", "br", "hr", "meta", "link", "col", "area", "source", "track", "wbr"]);
  const deep = [];
  for (const file of views) {
    const text = fs.readFileSync(file, "utf8");
    const template = text.slice(0, text.indexOf("<script"));
    const stack = [];
    const tag = /<!--[\s\S]*?-->|<(\/?)([A-Za-z][\w-]*)((?:[^>"']|"[^"]*"|'[^']*')*?)(\/?)>/g;
    let m;
    while ((m = tag.exec(template))) {
      if (m[0].startsWith("<!--")) continue;
      const [, close, name, attrs, selfClose] = m;
      if (close) {
        while (stack.length && stack.pop().name !== name);
        continue;
      }
      const cls = attrs.match(/\bclass="([^"]*)"/)?.[1] || "";
      // elements only (a <template v-if> is no element); the first one is the page's root
      const elements = stack.filter((s) => s.name !== "template");
      if (/(^|\s)[\w-]*(overlay|backdrop)(\s|$)/.test(cls) && !stack.some((s) => s.name === "Teleport") && elements.length > 1) {
        deep.push(`${path.relative(src, file)}: .${cls.split(/\s+/)[0]} under ${elements.slice(1).map((s) => s.name).join(" > ")}`);
      }
      if (!selfClose && !VOID.has(name.toLowerCase())) stack.push({ name });
    }
  }
  assert.deepEqual(deep, [], "teleport it to <body> (or keep it right under the page root)");
});

test("the announcement banner shares the dashboard's stacking context: under every sheet, above the bars", () => {
  const banner = fs.readFileSync(path.join(src, "components/AnnouncementBanner.vue"), "utf8");
  assert.ok(!banner.includes("<Teleport"), "teleported, it would cover the sheets that are not");
  assert.equal(zOf("components/AnnouncementBanner.vue"), 8000);
});

// The day sheet of the attendance pages is teleported to <body>; the "Catat kehadiran" pop-up it opens was not, so it sat
// inside the layout's stacking context and the sheet covered it. A page that teleports any pop-up must teleport them all
// (they then share one stacking context and the higher z-index wins). Same for a child component that teleports.
test("a page that teleports a pop-up has none left inside the layout (they would be covered by the teleported one)", () => {
  const all = filesIn(src).filter((f) => f.endsWith(".vue"));
  const templateOf = (f) => {
    const t = fs.readFileSync(f, "utf8");
    return t.slice(0, t.indexOf("<script"));
  };
  const teleporting = new Set(all.filter((f) => templateOf(f).includes("<Teleport")).map((f) => path.basename(f, ".vue")));
  const POPUP = /<div[^>]*v-if="[^"]*"[^>]*class="[^"]*(?:modal-overlay|modal-backdrop|-overlay|-backdrop)[^"]*"/g;
  const stranded = [];
  for (const f of all) {
    const outside = templateOf(f).replace(/<Teleport[\s\S]*?<\/Teleport>/g, "");
    const popups = outside.match(POPUP) || [];
    if (!popups.length) continue;
    const tpl = templateOf(f);
    const own = tpl.includes("<Teleport");
    const kids = [...tpl.matchAll(/<([A-Z][A-Za-z0-9]+)[\s>/]/g)].map((m) => m[1]).filter((n) => teleporting.has(n) && n !== path.basename(f, ".vue"));
    if (own || kids.length) stranded.push(`${path.relative(src, f)}: ${popups.length} pop-up(s) outside <Teleport>`);
  }
  assert.deepEqual(stranded, []);
});
