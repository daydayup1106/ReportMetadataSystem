import { useCallback, useEffect, useRef, useState } from 'react'
import { speechApi } from '@/api/client'

// ─── Markdown stripping ─────────────────────────────────────────────
const MD_PATTERNS: [RegExp, string][] = [
  [/```[\s\S]*?```/g, ''],           // fenced code blocks
  [/`([^`]+)`/g, '$1'],              // inline code
  [/!\[[^\]]*\]\([^)]*\)/g, ''],     // images
  [/\[([^\]]*)\]\([^)]*\)/g, '$1'],  // links → keep text
  [/^#{1,6}\s+/gm, ''],              // headings
  [/\*\*([^*]+)\*\*/g, '$1'],        // bold
  [/\*([^*]+)\*/g, '$1'],            // italic
  [/__([^_]+)__/g, '$1'],            // bold (underscore)
  [/_([^_]+)_/g, '$1'],              // italic (underscore)
  [/~~([^~]+)~~/g, '$1'],            // strikethrough
  [/^>\s?/gm, ''],                   // blockquotes
  [/^[-*+]\s/gm, ''],               // unordered list markers
  [/^---+$/gm, ''],                  // horizontal rules
  [/\|/g, ''],                       // table pipes
  [/<[^>]+>/g, ''],                  // HTML tags
]

function stripMarkdown(md: string): string {
  let result = md
  for (const [pattern, replacement] of MD_PATTERNS) {
    result = result.replace(pattern, replacement)
  }
  return result.replace(/\n{3,}/g, '\n\n').trim()
}

// ─── Sentence segmentation ──────────────────────────────────────────
// Handles Chinese, English, and mixed text. Keeps punctuation attached
// to the sentence. Merges very short fragments with neighbors.

/** Minimum characters for a standalone chunk (prevents tiny fragments) */
const MIN_CHUNK_LENGTH = 8

/**
 * Split plain text into TTS-friendly sentence chunks.
 *
 * Chinese: splits on 。！？；…
 * English: splits on . ! ? (with abbreviation/number guards)
 * Mixed:   handles both seamlessly
 * Also splits on newlines (\n) to respect paragraph breaks.
 */
export function splitIntoSentences(text: string): string[] {
  if (!text || text.length <= MIN_CHUNK_LENGTH) return text ? [text] : []

  // Phase 1: Split on clear Chinese sentence-ending punctuation + newlines
  // The regex matches a sentence-ending mark followed by optional whitespace.
  // We use a positive lookbehind to keep the punctuation with its sentence.
  //
  // Strategy: Use a split regex that captures the delimiter, then re-attach.
  // This handles: 。！？；…\n and English .!? at sentence boundaries.

  const raw: string[] = []
  let current = ''

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    current += ch

    // Chinese sentence terminators: always split after these
    if ('。！？；…'.includes(ch)) {
      // Consume trailing whitespace
      while (i + 1 < text.length && /\s/.test(text[i + 1])) {
        i++
        current += text[i]
      }
      raw.push(current.trim())
      current = ''
      continue
    }

    // English sentence terminators: . ! ?
    if (ch === '!' || ch === '?') {
      // Consume trailing whitespace
      while (i + 1 < text.length && /\s/.test(text[i + 1])) {
        i++
        current += text[i]
      }
      raw.push(current.trim())
      current = ''
      continue
    }

    if (ch === '.') {
      // Guard: don't split on decimal numbers (e.g., "3.5", "120.8")
      if (i > 0 && /\d/.test(text[i - 1]) && i + 1 < text.length && /\d/.test(text[i + 1])) {
        continue
      }
      // Guard: don't split on common abbreviations ending with .
      // Check if the preceding word is a known abbreviation
      const before = current.slice(0, -1) // text before the dot
      const lastWord = before.split(/\s/).pop() || ''
      const abbreviations = new Set([
        'Dr', 'Mr', 'Mrs', 'Ms', 'Prof', 'Sr', 'Jr', 'vs', 'etc',
        'e.g', 'i.e', 'a.m', 'p.m', 'Vol', 'No', 'Fig', 'Eq',
        'approx', 'dept', 'est', 'govt', 'inc', 'ltd', 'co',
      ])
      if (abbreviations.has(lastWord)) {
        continue
      }
      // Guard: don't split on ellipsis "..." — consume all dots
      if (i + 1 < text.length && text[i + 1] === '.') {
        continue
      }
      // Guard: next char is lowercase letter (likely not sentence boundary)
      // e.g., "e.g. some" — but we already handle "e.g" above
      if (i + 2 < text.length && text[i + 1] === ' ' && /[a-z]/.test(text[i + 2])) {
        // Could be a real sentence boundary like "done. the next"
        // Heuristic: if current chunk is long enough, split
        if (current.trim().length < MIN_CHUNK_LENGTH) {
          continue
        }
      }

      // It's a sentence boundary — consume trailing whitespace
      while (i + 1 < text.length && /\s/.test(text[i + 1])) {
        i++
        current += text[i]
      }
      raw.push(current.trim())
      current = ''
      continue
    }

    // Newline: split on paragraph breaks
    if (ch === '\n') {
      const trimmed = current.trim()
      if (trimmed) {
        raw.push(trimmed)
      }
      current = ''
      continue
    }
  }

  // Push remaining text
  if (current.trim()) {
    raw.push(current.trim())
  }

  // Phase 2: Merge short fragments with neighbors
  const merged: string[] = []
  for (const chunk of raw) {
    if (merged.length > 0 && merged[merged.length - 1].length < MIN_CHUNK_LENGTH) {
      // Merge with previous (previous was too short)
      merged[merged.length - 1] += ' ' + chunk
    } else if (chunk.length < MIN_CHUNK_LENGTH && merged.length > 0) {
      // This chunk is too short — merge with previous
      merged[merged.length - 1] += ' ' + chunk
    } else {
      merged.push(chunk)
    }
  }

  return merged.filter(s => s.length > 0)
}

// ─── TTS Hook with chunked playback ────────────────────────────────

interface TtsProgress {
  current: number  // 0-based index of the chunk currently playing
  total: number    // total number of chunks
}

export function useTextToSpeech() {
  const [speakingId, setSpeakingId] = useState<string | null>(null)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState<TtsProgress | null>(null)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const objectUrlRef = useRef<string | null>(null)

  // Abort controller ref — used to cancel pending fetch requests on stop
  const abortRef = useRef<AbortController | null>(null)
  // Playback session ID — incremented on each toggleSpeak to invalidate stale callbacks
  const sessionRef = useRef(0)

  // Pre-fetched audio blobs: index → Blob (filled ahead of playback)
  const cacheRef = useRef<Map<number, Blob>>(new Map())

  // Create audio element once
  if (!audioRef.current) {
    audioRef.current = new Audio()
  }

  const revokeUrl = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }
  }, [])

  const cancelPending = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort()
      abortRef.current = null
    }
    cacheRef.current.clear()
  }, [])

  const stop = useCallback(() => {
    // Increment session to invalidate any in-flight callbacks
    sessionRef.current++
    cancelPending()

    const audio = audioRef.current
    if (audio) {
      audio.pause()
      audio.removeAttribute('src')
      audio.load()  // reset without triggering error event
    }
    revokeUrl()
    setSpeakingId(null)
    setLoadingId(null)
    setProgress(null)
  }, [revokeUrl, cancelPending])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      sessionRef.current++
      if (abortRef.current) {
        abortRef.current.abort()
        abortRef.current = null
      }
      cacheRef.current.clear()
      const audio = audioRef.current
      if (audio) {
        audio.pause()
        audio.removeAttribute('src')
        audio.load()
      }
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
        objectUrlRef.current = null
      }
    }
  }, [])

  const toggleSpeak = useCallback(async (messageId: string, content: string, locale: string) => {
    // If same message is playing/loading, stop it
    if (speakingId === messageId || loadingId === messageId) {
      stop()
      return
    }

    // Stop any current playback
    stop()

    const plainText = stripMarkdown(content)
    if (!plainText) return

    const lang = locale === 'zh' ? 'zh' : 'en'
    const chunks = splitIntoSentences(plainText)
    if (chunks.length === 0) return

    // Start new playback session
    const session = ++sessionRef.current
    const abortController = new AbortController()
    abortRef.current = abortController
    cacheRef.current.clear()

    setLoadingId(messageId)
    setError(null)
    setProgress({ current: 0, total: chunks.length })

    // Helper: check if this session is still active
    const isActive = () => sessionRef.current === session && !abortController.signal.aborted

    // Helper: fetch a single chunk, store in cache
    const fetchChunk = async (index: number): Promise<Blob | null> => {
      if (!isActive()) return null
      // Already cached?
      const cached = cacheRef.current.get(index)
      if (cached) return cached
      try {
        const blob = await speechApi.synthesize(chunks[index], lang)
        if (!isActive()) return null
        cacheRef.current.set(index, blob)
        return blob
      } catch (err: unknown) {
        if (!isActive()) return null
        throw err
      }
    }

    // Helper: play a single blob, returns a promise that resolves when playback ends
    const playBlob = (blob: Blob): Promise<void> => {
      return new Promise<void>((resolve, reject) => {
        if (!isActive()) { resolve(); return }

        const audio = audioRef.current!
        revokeUrl()
        const url = URL.createObjectURL(blob)
        objectUrlRef.current = url
        audio.src = url

        const onEnded = () => { cleanup(); resolve() }
        const onError = () => {
          if (!audio.src || audio.src === window.location.href) {
            cleanup(); resolve(); return
          }
          cleanup(); reject(new Error('audio_playback_error'))
        }
        const cleanup = () => {
          audio.removeEventListener('ended', onEnded)
          audio.removeEventListener('error', onError)
        }

        audio.addEventListener('ended', onEnded, { once: true })
        audio.addEventListener('error', onError, { once: true })
        audio.play().catch(reject)
      })
    }

    try {
      // Fetch first chunk — user waits only for this one
      const firstBlob = await fetchChunk(0)
      if (!isActive() || !firstBlob) return

      setSpeakingId(messageId)
      setLoadingId(null)

      // Play chunks sequentially, pre-fetching the next one during playback
      for (let i = 0; i < chunks.length; i++) {
        if (!isActive()) break

        setProgress({ current: i, total: chunks.length })

        // Get current chunk blob (index 0 already fetched above)
        const blob = i === 0 ? firstBlob : await fetchChunk(i)
        if (!isActive() || !blob) break

        // Start pre-fetching the NEXT chunk while this one plays
        let nextPromise: Promise<Blob | null> | null = null
        if (i + 1 < chunks.length) {
          nextPromise = fetchChunk(i + 1).catch(() => null)
        }

        // Play current chunk
        await playBlob(blob)

        // Clean up played blob from cache
        cacheRef.current.delete(i)

        // Wait for pre-fetch to settle (should be done by now or nearly)
        if (nextPromise) await nextPromise
      }

      // All chunks played — clean up
      if (isActive()) {
        revokeUrl()
        setSpeakingId(null)
        setProgress(null)
      }
    } catch (err: unknown) {
      if (!isActive()) return
      setLoadingId(null)
      setSpeakingId(null)
      setProgress(null)
      revokeUrl()
      if (err && typeof err === 'object' && 'response' in err) {
        const status = (err as { response?: { status?: number } }).response?.status
        setError(status === 503 ? 'tts_unavailable' : 'tts_error')
      } else {
        setError('tts_error')
      }
    }
  }, [speakingId, loadingId, stop, revokeUrl])

  const clearError = useCallback(() => setError(null), [])

  return {
    speakingId,
    loadingId,
    error,
    progress,
    toggleSpeak,
    stop,
    clearError,
  }
}
