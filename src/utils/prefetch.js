const whenIdle = (callback) => {
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(callback, { timeout: 2000 });
  } else {
    setTimeout(callback, 300);
  }
};

function canPrefetch() {
  const connection = navigator.connection;
  if (!connection) return true;
  return !connection.saveData && !/2g$/.test(connection.effectiveType || "");
}

// Runs loaders one at a time during idle periods so they never compete with the current page.
export function prefetchWhenIdle(loaders) {
  if (!canPrefetch()) return;
  const queue = [...loaders];
  const next = () => {
    const load = queue.shift();
    if (!load) return;
    Promise.resolve()
      .then(load)
      .catch(() => {})
      .finally(() => whenIdle(next));
  };
  whenIdle(next);
}

// Downloads the dashboard pages this role can open, so menu navigation does not wait on the network.
export function prefetchDashboardRoutes(router, role) {
  const loaders = router
    .getRoutes()
    .filter((record) => {
      if (!record.path.startsWith("/dashboard/")) return false;
      const allowed = record.meta.role;
      return !allowed || [].concat(allowed).includes(role);
    })
    .map((record) => record.components?.default)
    .filter((component) => typeof component === "function");

  prefetchWhenIdle(loaders);
}
