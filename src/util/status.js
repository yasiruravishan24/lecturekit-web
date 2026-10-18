// Session state (server) -> the chip the person sees.
export function statusOf(session) {
  switch (session.state) {
    case 'done': return { text: 'Completed', css: 'completed' }
    case 'queued':
    case 'processing': return { text: 'Processing', css: 'processing' }
    case 'failed': return { text: 'Failed', css: 'failed' }
    case 'live': return { text: 'Not finished', css: 'idle' }
    case 'uploaded': return { text: 'Uploaded', css: 'idle' }
    default: return { text: 'Empty', css: 'idle' }
  }
}

const VIDEO = ['.mp4', '.mov', '.webm', '.mkv']

// icon of a session: live, video or audio (from the recording's file extension)
export function kindOf(session) {
  if (session.source === 'live') return { icon: 'sensors', word: 'live' }
  const rec = (session.files || []).find((f) => f.kind === 'recording')
  const name = ((rec && rec.original_name) || '').toLowerCase()
  if (VIDEO.some((e) => name.endsWith(e))) return { icon: 'videocam', word: 'video' }
  if (rec) return { icon: 'graphic_eq', word: 'audio' }
  return { icon: 'description', word: '' }
}

export const isBusy = (session) => session.state === 'queued' || session.state === 'processing'
