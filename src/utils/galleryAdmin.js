// Dokumentasi admin: when this ACCOUNT last opened the Komentar tab. Comments written after it are "baru" (the tab
// badge, the "Baru" mark on each comment, the menu badge). The server keeps the mark (users/{uid}
// .galleryCommentsSeenAt, POST /gallery/manage/comments/seen) so every device agrees; localStorage only bridges the
// moment before the server answers (and a failed save).

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

// the later of what this device knows and what the server says (an answer that left before the tab was opened must
// never bring older comments back as "baru")
export function laterSeen(current = 0, fromServer = null) {
  const s = Number(fromServer || 0)
  return s > current ? s : current
}

// newer than the mark and not written by me (my own replies are never "baru")
export function countNewComments(comments = [], seenAt = 0) {
  return comments.filter((c) => !c.mine && Date.parse(c.createdAt) > seenAt).length
}
