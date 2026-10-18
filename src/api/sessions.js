import { http, data } from './client'

// recordings: array of File (several parts of one lecture are joined by the server, in this order); slides: array of File
export function uploadFiles(sessionId, recordings, slides, onProgress, signal) {
  const form = new FormData()
  recordings.forEach((f) => form.append('recording', f))
  slides.forEach((f) => form.append('slides', f))
  return data(
    http.post(`/sessions/${sessionId}/upload`, form, {
      signal,
      onUploadProgress: (e) => onProgress && e.total && onProgress(Math.round((e.loaded / e.total) * 100)),
    }),
  )
}

export const startProcessing = (id) => data(http.post(`/sessions/${id}/process`))
export const retry = (id) => data(http.post(`/sessions/${id}/retry`))
export const getJob = (id) => data(http.get(`/jobs/${id}`))
export const getNotes = (id) => data(http.get(`/sessions/${id}/notes`))
export const exportMarkdown = (id) => http.get(`/sessions/${id}/export.md`, { responseType: 'blob' }).then((r) => r.data)
export const liveStatus = (id) => data(http.get(`/sessions/${id}/live`))
export const finishLive = (id, total) => data(http.post(`/sessions/${id}/live/finish`, null, { params: { total } }))
