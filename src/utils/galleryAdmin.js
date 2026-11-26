// Dokumentasi admin: when this device last opened the Komentar tab. Comments written after it are "baru" (the tab
// badge, the "Baru" mark on each comment). Per device, like before (localStorage; private mode = always 0).

export const COMMENTS_SEEN_KEY = 'tpq.gm.commentsSeenAt'

export function readSeenAt() {
  try {
    return Number(localStorage.getItem(COMMENTS_SEEN_KEY) || 0) || 0
  } catch {
    return 0
  }
}

export function writeSeenAt(ms = Date.now()) {
  try {
    localStorage.setItem(COMMENTS_SEEN_KEY, String(ms))
  } catch {
    /* restricted storage: the badge just stays */
  }
  return ms
}

// newer than the mark and not written by me (my own replies are never "baru")
export function countNewComments(comments = [], seenAt = 0) {
  return comments.filter((c) => !c.mine && Date.parse(c.createdAt) > seenAt).length
}
