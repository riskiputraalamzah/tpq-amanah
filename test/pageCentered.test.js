// Desktop symmetry: a dashboard page that caps its own width sits in the middle of the work area (the layout default),
// and the pages that capped only an inner box (title full width, card stuck left) cap their whole root instead.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { squash, has } from "./helpers/sourceText.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const read = (rel) => squash(fs.readFileSync(path.join(here, "..", "src", rel), "utf8"));

test("the layout centres a page that caps its own width", () => {
  assert.ok(has(read("views/dashboard/DashboardLayout.vue"), ".dashboard-content > div > * { margin-inline: auto; }"));
});

test("narrow pages are one centred column (title and content together)", () => {
  assert.ok(has(read("views/dashboard/HubungiWaliView.vue"), "max-width: 860px; margin-inline: auto;"));
  assert.ok(has(read("views/dashboard/admin/GalleryMomentFormView.vue"), ".gm-form-page { max-width: 760px; margin-inline: auto; }"));
  assert.ok(has(read("views/dashboard/admin/TpqProfileView.vue"), ".tpq-profile-view { max-width: 800px; margin-inline: auto; }"));
  assert.ok(has(read("views/dashboard/guru/ProfileView.vue"), ".profile-view { max-width: 800px; margin-inline: auto; }"));
});
