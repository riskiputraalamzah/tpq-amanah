import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  isChunkLoadError,
  buildCacheBustedUrl,
  stripRecoveryParam,
  canAttemptChunkReload,
  recoverFromChunkError,
  RECOVERY_COOLDOWN_MS,
} from "../src/utils/chunkRecovery.js";
import { squash, has } from "./helpers/sourceText.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, "..");
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");

function makeStorage() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
  };
}

test("isChunkLoadError recognizes stale-deploy chunk and MIME errors across browsers", () => {
  const positives = [
    new TypeError("Failed to fetch dynamically imported module: https://tpq.com/assets/js/foo.js"),
    new Error("Importing a module script failed."),
    new Error("Unable to preload CSS for /assets/css/index-123.css"),
    new Error("Loading chunk 42 failed."),
    Object.assign(new Error("boom"), { name: "ChunkLoadError" }),
    new Error('Failed to load module script: Expected a JavaScript module script but the server responded with a MIME type of "text/html".'),
  ];
  for (const err of positives) {
    assert.equal(isChunkLoadError(err), true, `should match: ${err.message}`);
  }

  assert.equal(isChunkLoadError(new Error("Network Error")), false);
  assert.equal(isChunkLoadError(new Error("Cannot read properties of undefined")), false);
  assert.equal(isChunkLoadError(null), false);
});

test("buildCacheBustedUrl adds or replaces _r without stacking params and preserves hash", () => {
  assert.equal(buildCacheBustedUrl("/dashboard/absen-santri?tab=sore#top", 1000), "/dashboard/absen-santri?tab=sore&_r=1000#top");
  assert.equal(buildCacheBustedUrl("/dashboard?_r=500&x=1", 2000), "/dashboard?_r=2000&x=1");
  assert.equal(buildCacheBustedUrl("https://www.tpqamanahsawotratap.com/?_r=1", 9999), "https://www.tpqamanahsawotratap.com/?_r=9999");
});

test("stripRecoveryParam removes only _r and keeps other params and hash intact", () => {
  let replaced = null;
  const hist = {
    state: { back: null },
    replaceState: (_s, _t, url) => {
      replaced = url;
    },
  };
  assert.equal(
    stripRecoveryParam({ href: "https://www.tpqamanahsawotratap.com/dashboard?tab=1&_r=12345#sec" }, hist),
    true,
  );
  assert.equal(replaced, "/dashboard?tab=1#sec");

  replaced = null;
  assert.equal(stripRecoveryParam({ href: "https://www.tpqamanahsawotratap.com/dashboard?tab=1" }, hist), false);
  assert.equal(replaced, null);
});

test("recoverFromChunkError rate-limits reloads within cooldown and recovers again on later deploys", async () => {
  const storage = makeStorage();
  const navigated = [];
  const navigate = (url) => navigated.push(url);

  // First stale deploy triggers cache-busted reload
  assert.equal(
    recoverFromChunkError("/dashboard/santri", { now: 100_000, storage, online: true, navigate }),
    true,
  );
  await new Promise((r) => setTimeout(r, 10));
  assert.equal(navigated.length, 1);
  assert.equal(navigated[0], "/dashboard/santri?_r=100000");

  // Immediate repeat within cooldown is blocked (no infinite reload loop)
  assert.equal(
    recoverFromChunkError("/dashboard/santri?_r=100000", {
      now: 100_000 + 5_000,
      storage,
      online: true,
      navigate,
    }),
    false,
  );

  // Another deploy after cooldown expires recovers cleanly in the same open tab
  assert.equal(
    recoverFromChunkError("/dashboard/santri", {
      now: 100_000 + RECOVERY_COOLDOWN_MS + 1,
      storage,
      online: true,
      navigate,
    }),
    true,
  );

  // Offline skips auto-reload
  assert.equal(
    recoverFromChunkError("/dashboard/santri", {
      now: 100_000 + RECOVERY_COOLDOWN_MS * 3,
      storage,
      online: false,
      navigate,
    }),
    false,
  );

  assert.equal(canAttemptChunkReload("k", { storage: null }), false);
});

test("vercel.json disables caching for HTML routes, caches /assets/ immutable, and never rewrites missing assets to index.html", () => {
  const cfg = JSON.parse(read("vercel.json"));
  const headers = cfg.headers || [];

  const htmlRuleIdx = headers.findIndex((h) => h.source === "/(.*)");
  const assetsRuleIdx = headers.findIndex((h) => h.source === "/assets/(.*)");
  assert.ok(htmlRuleIdx >= 0, "default /(.*) header rule exists");
  assert.ok(assetsRuleIdx > htmlRuleIdx, "/assets/(.*) comes after /(.*) so immutable overrides no-store only for hashed assets");

  const htmlCache = headers[htmlRuleIdx].headers.find((x) => x.key === "Cache-Control")?.value || "";
  assert.ok(htmlCache.includes("no-cache") && htmlCache.includes("no-store") && htmlCache.includes("must-revalidate"));

  const assetsCache = headers[assetsRuleIdx].headers.find((x) => x.key === "Cache-Control")?.value || "";
  assert.equal(assetsCache, "public, max-age=31536000, immutable");

  // Ensure no blanket immutable rule on unhashed /(.*).js or /(.*).css
  assert.equal(headers.some((h) => h.source === "/(.*).js"), false);
  assert.equal(headers.some((h) => h.source === "/(.*).css"), false);

  // Validate SPA rewrite pattern excludes /assets/* and static files, while allowing SPA routes
  const rewrite = cfg.rewrites?.[0];
  assert.equal(rewrite?.destination, "/index.html");
  const re = new RegExp(`^${rewrite.source}$`);
  for (const spaRoute of ["/", "/login", "/daftar", "/dashboard", "/dashboard/absen-santri", "/wali", "/wali/santri/s1/rapor", "/a/ABC", "/tabungan/b1"]) {
    assert.ok(re.test(spaRoute), `SPA route should rewrite to index.html: ${spaRoute}`);
  }
  for (const staticAsset of [
    "/assets/js/index-OLDHASH.js",
    "/assets/css/index-OLDHASH.css",
    "/manifest.webmanifest",
    "/logo-sm.png",
    "/icons/icon-192.png",
    "/tartil/cover1.webp",
  ]) {
    assert.equal(re.test(staticAsset), false, `static asset must NOT rewrite to index.html: ${staticAsset}`);
  }
});

test("boot pipeline guards against stuck initial-loader in main.js, index.html, router, and auth store", () => {
  const main = squash(read("src/main.js"));
  assert.ok(has(main, "vite:preloadError"), "main.js recovers on Vite preload errors");
  assert.ok(has(main, "window.__TPQ_BOOTED__ = true"), "main.js signals boot completion to watchdog");
  assert.ok(has(main, "stripRecoveryParam()"), "main.js cleans transient _r query param");
  assert.ok(has(main, ".isReady().then(mountApp).catch("), "main.js never leaves app unmounted on router error");

  const html = squash(read("index.html"));
  assert.ok(has(html, 'id="initial-loader-recovery"'), "index.html provides a fallback recovery UI");
  assert.ok(has(html, 'id="initial-loader-retry"'), "index.html provides a manual reload button");
  assert.ok(has(html, "tpq_boot_reload_at"), "index.html guards auto-reload with sessionStorage cooldown");
  assert.ok(has(html, "serviceWorker.getRegistrations"), "index.html unregisters any legacy service worker");

  const router = squash(read("src/router/index.js"));
  assert.ok(has(router, "if (to.meta.requiresAuth)"), "public routes do not block boot waiting on authStore.token");
  assert.ok(has(router, "if (!isChunkLoadError(error)) return; recoverFromChunkError("), "router.onError uses shared chunk recovery");

  const auth = squash(read("src/stores/auth.js"));
  assert.ok(has(auth, "setTimeout(finish, 4000)"), "Firebase auth check has an upper timeout so it can never hang boot");
  assert.ok(has(auth, "finally { authChecked.value = true }"), "authChecked is always marked true even on unexpected errors");
});
