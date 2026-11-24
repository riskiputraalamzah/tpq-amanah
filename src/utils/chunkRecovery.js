const CHUNK_ERROR_RE =
  /dynamically imported module|importing a module script failed|loading chunk|chunkloaderror|unable to preload css|failed to load module script|mime type of ["']text\/html["']/i;

export const RECOVERY_PARAM = "_r";
export const RECOVERY_COOLDOWN_MS = 30_000;

export function isChunkLoadError(error) {
  if (!error) return false;
  if (error.name === "ChunkLoadError") return true;
  const text = [
    error.message,
    error.reason?.message,
    typeof error === "string" ? error : "",
  ]
    .filter(Boolean)
    .join(" ");
  return CHUNK_ERROR_RE.test(text);
}

export function buildCacheBustedUrl(targetUrl = "/", now = Date.now()) {
  const isAbsolute = /^https?:\/\//i.test(targetUrl);
  const base =
    typeof window !== "undefined" && window.location?.origin
      ? window.location.origin
      : "https://tpq.local";
  try {
    const url = new URL(targetUrl || "/", base);
    url.searchParams.set(RECOVERY_PARAM, String(now));
    return isAbsolute ? url.toString() : `${url.pathname}${url.search}${url.hash}`;
  } catch {
    const sep = String(targetUrl).includes("?") ? "&" : "?";
    return `${targetUrl || "/"}${sep}${RECOVERY_PARAM}=${now}`;
  }
}

export function stripRecoveryParam(
  loc = typeof window !== "undefined" ? window.location : null,
  hist = typeof window !== "undefined" ? window.history : null,
) {
  if (!loc?.href || !hist?.replaceState) return false;
  try {
    const url = new URL(loc.href);
    if (!url.searchParams.has(RECOVERY_PARAM)) return false;
    url.searchParams.delete(RECOVERY_PARAM);
    const clean = `${url.pathname}${url.search}${url.hash}`;
    hist.replaceState(hist.state, "", clean);
    return true;
  } catch {
    return false;
  }
}

export function normalizeReloadKey(targetPath = "/") {
  try {
    const url = new URL(targetPath || "/", "https://tpq.local");
    return `tpq_chunk_reload:${url.pathname}`;
  } catch {
    return "tpq_chunk_reload:/";
  }
}

export function canAttemptChunkReload(
  key,
  {
    now = Date.now(),
    cooldownMs = RECOVERY_COOLDOWN_MS,
    storage = typeof sessionStorage !== "undefined" ? sessionStorage : null,
  } = {},
) {
  if (!storage) return false;
  try {
    const last = Number(storage.getItem(key));
    if (Number.isFinite(last) && last > 0 && now - last < cooldownMs) {
      return false;
    }
    storage.setItem(key, String(now));
    return true;
  } catch {
    return false;
  }
}

function clearBrowserCachesBestEffort() {
  if (typeof caches === "undefined" || typeof caches.keys !== "function") {
    return Promise.resolve();
  }
  return Promise.race([
    caches
      .keys()
      .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
      .catch(() => {}),
    new Promise((resolve) => setTimeout(resolve, 150)),
  ]);
}

export function recoverFromChunkError(
  targetPath,
  {
    now = Date.now(),
    cooldownMs = RECOVERY_COOLDOWN_MS,
    storage = typeof sessionStorage !== "undefined" ? sessionStorage : null,
    online = typeof navigator !== "undefined" ? navigator.onLine !== false : true,
    navigate = typeof window !== "undefined"
      ? (url) => window.location.replace(url)
      : null,
  } = {},
) {
  if (!online || !navigate) return false;
  const fallbackPath =
    typeof window !== "undefined"
      ? `${window.location.pathname}${window.location.search}${window.location.hash}`
      : "/";
  const path = targetPath || fallbackPath;
  const key = normalizeReloadKey(path);
  if (!canAttemptChunkReload(key, { now, cooldownMs, storage })) {
    return false;
  }
  const nextUrl = buildCacheBustedUrl(path, now);
  clearBrowserCachesBestEffort().finally(() => {
    navigate(nextUrl);
  });
  return true;
}
