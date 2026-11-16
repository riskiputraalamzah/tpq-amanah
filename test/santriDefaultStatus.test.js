import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const src = fs.readFileSync(path.join(here, "..", "src/components/SantriManager.vue"), "utf8");

test("Kelola Santri opens on the active santri; 'Semua Status' still shows everyone", () => {
  assert.ok(src.includes('const DEFAULT_STATUS = "aktif";\nconst statusFilter = ref(DEFAULT_STATUS);') || src.includes('const DEFAULT_STATUS = "aktif";\r\nconst statusFilter = ref(DEFAULT_STATUS);'));
  assert.ok(src.includes('<option value="">Semua Status</option>'));
  assert.ok(src.includes("statusFilter.value !== DEFAULT_STATUS"), "the default view is not an Excel '-filter' export");
});
