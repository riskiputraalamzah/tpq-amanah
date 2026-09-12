import test from "node:test";
import assert from "node:assert/strict";
import {
  parseSessionDate,
  formatSessionDateID,
  resolveInitialStatus,
  isSessionFuture,
} from "../src/utils/studentAttendanceState.js";

test("successful save then edit transitions (state helpers)", () => {
  assert.equal(resolveInitialStatus(4, 4), "saved");
  assert.equal(resolveInitialStatus(0, 4), "unsaved");
  assert.equal(resolveInitialStatus(0, 0), "empty");
});

test("date 2026-09-01 renders Indonesian long date", () => {
  assert.equal(formatSessionDateID("2026-09-01"), "1 September 2026");
  assert.equal(
    formatSessionDateID({ _seconds: 1788220800, _nanoseconds: 0 }),
    "1 September 2026"
  );
  assert.equal(formatSessionDateID({ seconds: 1788220800 }), "1 September 2026");
});

test("invalid date falls back without Invalid Date text", () => {
  for (const bad of [null, undefined, "", "bukan-tanggal", {}, { foo: 1 }]) {
    const label = formatSessionDateID(bad);
    assert.equal(label, "Tanggal tidak tersedia");
    assert.ok(!label.includes("Invalid"));
  }
  assert.equal(parseSessionDate(new Date("xx")), null);
});

test("future detection uses parsed day", () => {
  assert.equal(isSessionFuture("2099-01-05", new Date("2026-09-12")), true);
  assert.equal(isSessionFuture("2026-09-01", new Date("2026-09-12")), false);
  assert.equal(isSessionFuture({ _seconds: 1788220800 }, new Date("2026-09-12")), false);
});