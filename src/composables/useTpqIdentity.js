import { ref } from 'vue'
import api from '@/services/api'

// Official NSPQ of TPQ AMANAH and its SIPDAR certificate; Profil TPQ can override both.
export const DEFAULT_NSPQ = '411235151939'
export const DEFAULT_SIPDAR_URL =
  'https://sipdarlpq.kemenag.go.id/print/sertifikat-lpq/62468/411235151939/'
export const SIPDAR_ORIGIN = 'https://sipdarlpq.kemenag.go.id/'

// Shared by the sidebar and Profil TPQ, so a saved change shows up without a reload.
const tpqIdentity = ref({ nspq: DEFAULT_NSPQ, sipdarUrl: DEFAULT_SIPDAR_URL })

export function applyTpqProfile(profile = {}) {
  const nspq = String(profile.nsq || '').replace(/\D/g, '')
  const sipdarUrl = String(profile.sipdarUrl || '').trim()
  tpqIdentity.value = {
    nspq: nspq.length === 12 ? nspq : DEFAULT_NSPQ,
    sipdarUrl: sipdarUrl.startsWith(SIPDAR_ORIGIN) ? sipdarUrl : DEFAULT_SIPDAR_URL
  }
}

export async function loadTpqIdentity() {
  try {
    const { data } = await api.get('/settings/tpq-profile')
    applyTpqProfile(data)
  } catch {
    // Keep the official defaults when the profile cannot be loaded.
  }
}

export function useTpqIdentity() {
  return { tpqIdentity, loadTpqIdentity, applyTpqProfile }
}
