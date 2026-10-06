/**
 * Utility for formatting session slot identifiers (wave_1, wave_2, slot_wave_1_sore, slot_wave_2_malam, etc.)
 * Wave 1 / Sore -> "Sesi Sore" (15:00 - 16:30)
 * Wave 2 / Malam -> "Sesi Malam" (18:00 - 19:30)
 */

export function isEveningSlot(slotId) {
  if (!slotId) return false;
  const s = String(slotId).toLowerCase();
  return s.includes("2") || s.includes("malam");
}

export function resolveSessionSlotName(slotId, sessionSlots = []) {
  if (!slotId) return "-";
  if (isEveningSlot(slotId)) return "Sesi Malam";
  return "Sesi Sore";
}

export function resolveSessionSlotTime(slotId, sessionSlots = []) {
  if (!slotId) return "";
  if (Array.isArray(sessionSlots) && sessionSlots.length > 0) {
    const found = sessionSlots.find((s) => {
      if (s.id === slotId) return true;
      if (isEveningSlot(slotId) && isEveningSlot(s.id)) return true;
      if (!isEveningSlot(slotId) && !isEveningSlot(s.id)) return true;
      return false;
    });
    if (found?.startTime && found?.endTime) {
      return `${found.startTime} - ${found.endTime}`;
    }
  }
  return isEveningSlot(slotId) ? "18:00 - 19:30" : "15:00 - 16:30";
}

export function resolveSessionSlotFullName(slotId, sessionSlots = []) {
  if (!slotId) return "-";
  const name = resolveSessionSlotName(slotId, sessionSlots);
  const time = resolveSessionSlotTime(slotId, sessionSlots);
  return time ? `${name} (${time})` : name;
}
