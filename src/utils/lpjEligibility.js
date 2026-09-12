import api from "@/services/api";
import { currentPeriod } from "./lpjState";

export async function resolveLpjPeriod() {
  try {
    const res = await api.get("/settings/tpq-profile");
    if (res.data?.activeOperationalPeriod) return res.data.activeOperationalPeriod;
  } catch {
    // fall back to current month
  }
  return currentPeriod();
}

export async function fetchMyEligibility(period) {
  const res = await api.get("/ljp/eligibility/me", { params: { period } });
  return res.data?.eligible === true;
}
