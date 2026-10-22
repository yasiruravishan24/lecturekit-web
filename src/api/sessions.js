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
// stop what is being made: kind main (notes and quiz: the lecture is deleted), or visuals / replay / deeper (only that stops)
export const cancel = (id, kind = 'main') => data(http.post(`/sessions/${id}/cancel`, null, { params: { kind } }))
export const retry = (id) => data(http.post(`/sessions/${id}/retry`))
export const getJob = (id) => data(http.get(`/jobs/${id}`))
export const getNotes = (id) => data(http.get(`/sessions/${id}/notes`))
export const exportMarkdown = (id) => http.get(`/sessions/${id}/export.md`, { responseType: 'blob' }).then((r) => r.data)
export const exportPdf = (id) => http.get(`/sessions/${id}/export.pdf`, { responseType: 'blob' }).then((r) => r.data)
export const getDeeper = (id) => data(http.get(`/sessions/${id}/deeper`))
export const startDeeper = (id) => data(http.post(`/sessions/${id}/deeper`))
export const liveStatus = (id) => data(http.get(`/sessions/${id}/live`))
export const finishLive = (id, total) => data(http.post(`/sessions/${id}/live/finish`, null, { params: { total } }))

// the replay (video or audio, faces blurred) and the pictures of the board and screen, made in the background after the notes
export const getReplay = (id) => data(http.get(`/sessions/${id}/replay`))
export const makeReplay = (id) => data(http.post(`/sessions/${id}/replay`))
export const listShots = (id) => data(http.get(`/sessions/${id}/shots`))
