import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { squash, has } from "./helpers/sourceText.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const layout = squash(fs.readFileSync(path.join(here, "..", "src/views/dashboard/DashboardLayout.vue"), "utf8"));

test("Desktop sidebar can collapse and expand smoothly for both admin and guru, persisted on device", () => {
  assert.ok(has(layout, `class="dashboard-layout" :class="{ 'is-sidebar-collapsed': sidebarCollapsed }"`));
  assert.ok(has(layout, `class="sidebar-collapse-btn"`));
  assert.ok(has(layout, `:aria-expanded="!sidebarCollapsed"`));
  assert.ok(has(layout, `localStorage.getItem(SIDEBAR_COLLAPSE_KEY)`));
  assert.ok(has(layout, `localStorage.setItem(SIDEBAR_COLLAPSE_KEY`));
  assert.ok(has(layout, `--sidebar-w: 280px;`));
  assert.ok(has(layout, `--sidebar-w: 76px;`));
  assert.ok(has(layout, `left: var(--sidebar-w) !important;`));
  assert.ok(has(layout, `v-show="sidebarCollapsed || isGroupOpen(g)"`), "all icons remain reachable in collapsed icon-rail mode");
  assert.ok(has(layout, `class="sidebar-tooltip"`), "collapsed icons expose floating unclipped tooltips");
  assert.ok(has(layout, `@media (prefers-reduced-motion: reduce)`));
});
