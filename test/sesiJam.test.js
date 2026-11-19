import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { squash, has } from "./helpers/sourceText.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const read = (p) => squash(fs.readFileSync(path.join(here, "..", p), "utf8"));
const absen = read("src/views/dashboard/guru/AbsenSantriView.vue");
const attendance = read("src/views/dashboard/guru/AttendanceView.vue");
const kbm = read("src/views/dashboard/guru/DailyWorkspace.vue");
const wali = read("src/views/wali/WaliProgress.vue");
const reports = read("src/components/absen/AbsenReports.vue");
const audit = read("src/components/absen/EarlyAudit.vue");

test("Absen Santri: a sesi not started shows a closed panel (no rows to tap); malam is the default only from 18:00", () => {
  assert.ok(has(absen, '<div v-else-if="sheet && sheet.notOpenYet" class="as-closed" role="status">'));
  assert.ok(has(absen, "Sesi {{ slotLabel }} belum dimulai"));
  assert.ok(has(absen, ">= '18:00' ? 'wave_2' : 'wave_1'"));
});

test("Absen Santri: a past day and a kabar alfa already sent are changed only after a confirmation", () => {
  assert.ok(has(absen, "if (!(await pastDayOk()) || !(await alfaToldOk(santriId, same ? null : status))) return"));
  assert.ok(has(absen, "(sh?.alfaSent || []).includes(santriId)"));
  assert.ok(has(absen, "async function markRest(g) { if (!(await pastDayOk())) return"));
  assert.ok(has(absen, "if (view !== `${date.value}|${slot.value}`) return"), "a switch during the question does not save on another day");
});

test("Absen Santri: the wali's reports (all staff) and the admin's audit of records saved early", () => {
  assert.ok(has(absen, '<AbsenReports ref="reportsBox" @changed="onOutsideChange" />'));
  assert.ok(has(absen, '<EarlyAudit v-if="isAdmin" ref="auditBox" @changed="onOutsideChange" />'));
  assert.ok(has(reports, "api.post(`/santri-presence/reports/${encodeURIComponent(r.id)}/resolve`, body)"));
  assert.ok(has(reports, "input: { label: 'Keterangan untuk wali', required: true"));
  assert.ok(has(audit, "api.post('/santri-presence/audit/early', { action, ids: g.rows.map((r) => r.id) })"));
  assert.ok(has(audit, "tone: 'danger'"), "clearing asks first");
});

test("Absensi guru: Hadir is off until the teacher's sesi starts (izin/sakit stay open); KBM shows when a sesi opens", () => {
  assert.ok(has(attendance, ":disabled=\"hadirClosed\""));
  assert.ok(has(attendance, "api.get('/attendance/hadir-window', { cache: false })"));
  assert.ok(has(kbm, "const slotNotOpen = (slot) => targetDate.value === getTodayWibString() && wibClockNow() < (SLOT_START[slot] || '15:00');"));
});

test("Portal wali: an alfa of the last 7 days can be reported, with the right status and a note; its state is shown", () => {
  assert.ok(has(wali, "const canReport = (m) => m.status === 'alfa' && m.date >= weekAgo() && m.date <= wibToday()"));
  assert.ok(has(wali, "api.post(`/wali/santri/${route.params.santriId}/absen-reports`, { date: m.date, slot: m.slot, want: form.value.want, note: form.value.note })"));
  assert.ok(has(wali, "Sedang dicek ustadz/ustadzah."));
});

test("the next morning until 12:00: Absen Santri and a KBM of yesterday change it only after a confirmation", () => {
  assert.ok(has(absen, "title: sh.lateEdit ? 'Ubah absen kemarin?' : 'Ubah absen hari yang sudah lewat?'"));
  assert.ok(has(absen, "...(ctx.date < today ? { confirmLate: true } : {})"));
  assert.ok(has(kbm, "cancelText: 'Hanya yang kosong'"));
  assert.ok(has(kbm, "...(late.confirmLate ? { confirmLate: true } : {})"));
});

const titipSheet = read("src/components/absen/TitipSheet.vue");
test("Titip santri: a Titipan group on top of the sesi the child goes to; left out (named) in the other; KBM marks them", () => {
  assert.ok(has(absen, "...(titipan.length ? [groupOf('titip', titipan, { own: true, titip: true })] : [])"));
  assert.ok(has(absen, "if (s.titip) continue"), "not in their jilid group");
  assert.ok(has(absen, "else if (s.titip ? titipHere(s) : (sheet.value?.defaultClassIds || []).includes(s.classId)) c.none += 1"));
  assert.ok(has(absen, '<TitipSheet :open="titipOpen" :santri="sheet?.santri || []" @close="titipOpen = false" @changed="onTitipChanged" />'));
  assert.ok(has(titipSheet, "mode: f.mode === 'tetap' ? 'tetap' : 'hari'"));
  assert.ok(has(titipSheet, "classIds.value === null || classIds.value.includes(String(s.classId))"), "only the jilid the person may decide");
  assert.ok(has(kbm, "Titipan · {{ santri.titip.classId === '7' ? 'Marhalah' : `Jilid ${santri.titip.classId}` }}"));
  assert.ok(has(kbm, "titipAway.value = data.titipAway || []"));
});

const attView = read("src/views/dashboard/guru/AttendanceView.vue");
const adminAtt = read("src/views/dashboard/admin/AdminAttendanceView.vue");
const detail = read("src/views/dashboard/admin/TeacherAttendanceDetail.vue");
test("Hadir is switched off, with the reason, where the server would refuse it (guru calendar pop-up, admin add / edit)", () => {
  assert.ok(has(attView, ":disabled=\"!!modalHadirBlock\""));
  assert.ok(has(attView, "Belum bisa untuk hari yang akan datang"));
  assert.ok(has(attView, "if (originalStatus === 'hadir'"), "a record that already says hadir is not limited");
  assert.ok(has(attView, "status: hadirBlockFor(getDateStringForCalendarDay(day), '') ? '' : 'hadir'"), "nothing is preselected when Hadir is off");
  assert.ok(has(attView, ":disabled=\"updating || !updateForm.status\""), "save waits for a status");
  assert.ok(has(adminAtt, ":disabled=\"!!hadirBlock\""));
  assert.ok(has(detail, ":disabled=\"!!hadirBlock\""));
  const composable = read("src/composables/useHadirBlock.js");
  assert.ok(has(composable, "api.get('/attendance/hadir-window', { params: { guruId, date }, cache: false })"));
  assert.ok(has(composable, "if (mine === seq) info.value = data"), "an old answer never replaces a newer question");
});

test("the guru dashboard says 'Tidak hadir', not the raw 'tidak_hadir'", () => {
  const dash = read("src/views/dashboard/guru/GuruDashboard.vue");
  assert.ok(has(dash, "tidak_hadir: 'Tidak hadir'"));
  assert.ok(has(dash, "Sudah: ${attendanceWord(d.tasks.attendance.status)}"));
});
