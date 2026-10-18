import { describe, expect, it } from 'vitest'
import { friendly, isCode } from '../../src/util/errors'
import { currentStep, stageText, stepList } from '../../src/util/stages'
import { kindOf, statusOf, isBusy } from '../../src/util/status'
import { formatDate, formatDuration, formatSize, initials, plural } from '../../src/util/format'
import { buildAnswers } from '../../src/api/quiz'
import { ApiError, toApiError } from '../../src/api/client'

describe('errors', () => {
  it('uses the server message and adds a next step for known codes', () => {
    expect(friendly(new ApiError(422, 'validation', 'Unsupported recording type'))).toBe('Unsupported recording type')
    expect(friendly(new ApiError(429, 'daily_limit', 'Daily limit reached (5 lectures); try again tomorrow'))).toContain('Try again tomorrow')
    expect(friendly(null)).toMatch(/went wrong/)
    expect(isCode(new ApiError(403, 'email_not_verified', 'x'), 'a', 'email_not_verified')).toBe(true)
  })

  it('turns an axios error into an ApiError', () => {
    const fromServer = toApiError({ response: { status: 409, data: { error: { code: 'busy', message: 'Still processing' } } } })
    expect([fromServer.status, fromServer.code, fromServer.message]).toEqual([409, 'busy', 'Still processing'])
    expect(toApiError({ response: { status: 500, data: '<html>' } }).code).toBe('unexpected')
    expect(toApiError(new Error('Network Error')).code).toBe('network')
    const same = new ApiError(1, 'x', 'y')
    expect(toApiError(same)).toBe(same)
  })
})

describe('stages', () => {
  it('has plain words for every stage and "Working" for an unknown one', () => {
    for (const s of ['prepare', 'transcribe', 'slides', 'align', 'filter', 'notes', 'quiz', 'write', 'done']) expect(stageText(s)).not.toBe('Working')
    expect(stageText('something_new')).toBe('Working')
  })

  it('lists the slide step only when there are slides', () => {
    expect(stepList(true).map((s) => s.key)).toEqual(['received', 'speech', 'slides', 'notes'])
    expect(stepList(false).map((s) => s.key)).toEqual(['received', 'speech', 'notes'])
  })

  it('finds the step being worked on', () => {
    expect(currentStep('prepare', 'processing', true)).toBe(0)
    expect(currentStep('transcribe', 'processing', true)).toBe(1)
    expect(currentStep('align', 'processing', true)).toBe(2)
    expect(currentStep('quiz', 'processing', true)).toBe(3)
    expect(currentStep('quiz', 'processing', false)).toBe(2)
    expect(currentStep('unknown_stage', 'processing', true, 10)).toBe(1)           // an unknown stage is placed by the percent
    expect(currentStep('unknown_stage', 'processing', true, 70)).toBe(3)
    expect(currentStep('done', 'done', true)).toBe(4)
  })
})

describe('status', () => {
  it('maps a session state to a word', () => {
    expect(statusOf({ state: 'done' }).text).toBe('Ready')
    expect(statusOf({ state: 'queued' }).text).toBe('Processing')
    expect(statusOf({ state: 'processing' }).css).toBe('processing')
    expect(statusOf({ state: 'failed' }).text).toBe('Failed')
    expect(statusOf({ state: 'live' }).text).toBe('Not finished')
    expect(isBusy({ state: 'queued' })).toBe(true)
    expect(isBusy({ state: 'done' })).toBe(false)
  })

  it('tells live, video and audio apart', () => {
    expect(kindOf({ source: 'live', files: [] }).word).toBe('live')
    expect(kindOf({ source: 'upload', files: [{ kind: 'recording', original_name: 'Lecture.MP4' }] }).word).toBe('video')
    expect(kindOf({ source: 'upload', files: [{ kind: 'recording', original_name: 'talk.m4a' }] }).word).toBe('audio')
    expect(kindOf({ source: 'upload', files: [] }).word).toBe('')
  })
})

describe('format', () => {
  it('formats dates, sizes and durations', () => {
    expect(formatDate('2026-10-12T09:00:00Z')).toMatch(/^1[12] Oct$/)
    expect(formatDate('2026-10-12T12:00:00Z', true)).toBe('12 Oct 2026')
    expect(formatDate(null)).toBe('')
    expect(formatSize(500 * 1024)).toBe('500 KB')
    expect(formatSize(48 * 1024 * 1024)).toBe('48 MB')
    expect(formatSize(1.5 * 1024 * 1024)).toBe('1.5 MB')
    expect(formatDuration(3120)).toBe('52 min')
    expect(formatDuration(20)).toBe('1 min')
    expect(formatDuration(null)).toBe('')
    expect(initials('Yasiru Ravishan')).toBe('YR')
    expect(initials('', 'ann@example.com')).toBe('AN')
    expect(plural(1, 'module')).toBe('1 module')
    expect(plural(3, 'session')).toBe('3 sessions')
  })
})

describe('quiz answers', () => {
  const questions = [{ id: 11 }, { id: 12 }, { id: 13 }]
  it('sends one answer per question in order, null for a skipped one', () => {
    expect(buildAnswers(questions, { 11: 2, 13: 0 })).toEqual([2, null, 0])
    expect(buildAnswers(questions, {})).toEqual([null, null, null])
    expect(buildAnswers(questions, { 12: 0 })).toEqual([null, 0, null])
  })
})
