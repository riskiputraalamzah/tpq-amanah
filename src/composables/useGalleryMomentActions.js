// The actions on one Dokumentasi moment, shared by the list (GalleryManagementView) and the moment page
// (GalleryMomentAdminView): copy the public link, pin, show / hide on the web, delete (asks first, our own dialog).
// Each returns true when the server took it, so the page can reload or leave.
import { ref } from 'vue'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'
import { useDialog } from '@/composables/useDialog'
import { galleryPhotoCardSrc, momentVideosOf } from '@/utils/galleryMedia'

export function momentPublicUrl(m) {
  const slug = m?.slug || m?.id || ''
  const origin =
    typeof window !== 'undefined' && /^https?:/.test(window.location.origin)
      ? window.location.origin
      : 'https://tpqamanahsawotratap.com'
  return `${origin}/dokumentasi/${encodeURIComponent(slug)}`
}

export function momentCoverSrc(m) {
  if (m?.photos?.length) return galleryPhotoCardSrc(m.photos[0])
  const firstVideo = momentVideosOf(m || {})[0]
  if (firstVideo?.thumbnailUrl) return galleryPhotoCardSrc({ url: firstVideo.thumbnailUrl })
  return ''
}

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }
  const ta = document.createElement('textarea')
  ta.value = text
  ta.setAttribute('readonly', '')
  ta.style.position = 'fixed'
  ta.style.opacity = '0'
  document.body.appendChild(ta)
  ta.select()
  document.execCommand('copy')
  document.body.removeChild(ta)
}

export function useGalleryMomentActions() {
  const { success, error: showError } = useToast()
  const { ask } = useDialog()
  const busyId = ref('')

  async function copyMomentLink(m) {
    try {
      await copyText(momentPublicUrl(m))
      success('Link halaman momen berhasil disalin — siap dibagikan!')
    } catch {
      showError('Gagal menyalin link otomatis.')
    }
  }

  async function run(m, body, okText, failText) {
    if (busyId.value) return false
    busyId.value = m.id
    try {
      await api.put(`/gallery/moments/${encodeURIComponent(m.id)}`, body)
      success(okText)
      return true
    } catch (err) {
      showError(err.response?.data?.error || failText)
      return false
    } finally {
      busyId.value = ''
    }
  }

  const togglePublish = (m) =>
    run(
      m,
      { published: !m.published },
      !m.published ? 'Momen ditayangkan di landing page.' : 'Momen disembunyikan dari landing page.',
      'Gagal mengubah status tayang.',
    )

  const togglePin = (m) =>
    run(
      m,
      { pinned: !m.pinned },
      !m.pinned ? 'Momen dipin sebagai unggulan.' : 'Pin unggulan dilepas.',
      'Gagal mengubah pin unggulan.',
    )

  async function confirmDelete(m) {
    const ok = await ask({
      title: `Hapus momen "${m.title}"?`,
      message:
        'Seluruh foto, komentar, dan data suka di momen ini ikut terhapus permanen dan langsung hilang dari landing page.',
      confirmText: 'Ya, hapus',
      cancelText: 'Batal',
      tone: 'danger',
    })
    if (!ok) return false
    busyId.value = m.id
    try {
      await api.delete(`/gallery/moments/${encodeURIComponent(m.id)}`)
      success('Momen dokumentasi dihapus.')
      return true
    } catch (err) {
      showError(err.response?.data?.error || 'Gagal menghapus momen.')
      return false
    } finally {
      busyId.value = ''
    }
  }

  return { busyId, copyMomentLink, togglePublish, togglePin, confirmDelete }
}
