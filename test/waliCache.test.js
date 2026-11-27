// The wali portal's store (src/utils/waliCache.js): shown at once, one request per key, per-account, cleared on logout.
import test from "node:test";
import assert from "node:assert/strict";

// a phone's localStorage: stored items are own keys (Object.keys(localStorage) lists them, like a browser)
class PhoneStorage {
  getItem(k) {
    return Object.prototype.hasOwnProperty.call(this, k) ? this[k] : null
  }
  setItem(k, v) {
    this[k] = String(v)
  }
  removeItem(k) {
    delete this[k]
  }
}
globalThis.localStorage = new PhoneStorage();
const stored = () => Object.keys(globalThis.localStorage);

const cache = await import("../src/utils/waliCache.js");
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

test("one request per key while it is on its way; the answer is kept and told to the page", async () => {
  cache.setWaliOwner("w_a");
  let calls = 0;
  const seen = [];
  const stop = cache.subscribe("me", (ev) => seen.push(ev.type));
  const fetcher = async () => {
    calls += 1;
    await wait(10);
    return { santri: [1] };
  };
  const [a, b] = await Promise.all([cache.fetchFresh("me", fetcher), cache.fetchFresh("me", fetcher)]);
  assert.equal(calls, 1);
  assert.deepEqual(a, b);
  assert.deepEqual(cache.peek("me").data, { santri: [1] });
  assert.deepEqual(seen, ["data"]);
  assert.equal(cache.refreshingCount.value, 0);
  stop();
});

test("kept on the phone per account: the same parent sees it after reopening, another parent never", async () => {
  cache.setWaliOwner("w_a");
  cache.put("progress:s1:now", { month: "2026-11" });
  await wait(300); // saved a moment later
  assert.ok(stored().includes("tpq.wali.cache.v1.w_a"));
  cache.setWaliOwner("w_b");
  assert.equal(cache.peek("progress:s1:now"), null, "another parent: nothing");
  assert.ok(!stored().includes("tpq.wali.cache.v1.w_a"), "the other parent's data is removed from this phone");
});

test("invalidate: pages showing the key are told to ask again; a prefix with *", () => {
  cache.setWaliOwner("w_c");
  cache.put("izin:s1", { a: 1 });
  cache.put("izin:s2", { a: 2 });
  cache.put("me", { b: 1 });
  const told = [];
  const s1 = cache.subscribe("izin:s1", (ev) => told.push(`s1:${ev.type}`));
  const s2 = cache.subscribe("me", (ev) => told.push(`me:${ev.type}`));
  cache.invalidate("izin:*");
  assert.deepEqual(told, ["s1:stale"]);
  assert.equal(cache.peek("izin:s2").at, 0, "not on screen: old, asked on the next visit");
  cache.refreshAll();
  assert.deepEqual([...told].sort(), ["me:stale", "s1:stale", "s1:stale"]);
  s1();
  s2();
});

test("prefetch skips what is recent; logout clears everything", async () => {
  cache.setWaliOwner("w_d");
  cache.put("rapor:s1", { r: 1 });
  let calls = 0;
  await cache.prefetch("rapor:s1", async () => {
    calls += 1;
    return {};
  });
  assert.equal(calls, 0);
  await wait(300);
  cache.clearWaliCache();
  assert.equal(cache.peek("rapor:s1"), null);
  assert.ok(!stored().some((k) => k.startsWith("tpq.wali.cache.")));
});

test("an answer that arrives after logout is not kept", async () => {
  cache.setWaliOwner("w_e");
  const p = cache.fetchFresh("me", async () => {
    await wait(20);
    return { secret: true };
  });
  cache.clearWaliCache();
  await p;
  assert.equal(cache.peek("me"), null);
});
