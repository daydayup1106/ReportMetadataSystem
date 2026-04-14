import { useCallback, useEffect, useRef, useState } from 'react'
import { speechApi } from '@/api/client'

export type VoiceState = 'idle' | 'recording' | 'transcribing'

export function useVoiceRecorder() {
  const [state, setState] = useState<VoiceState>('idle')
  const [error, setError] = useState<string | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)

  const cleanup = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    mediaRecorderRef.current = null
    chunksRef.current = []
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => cleanup, [cleanup])

  const startRecording = useCallback(async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      chunksRef.current = []

      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : ''
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mediaRecorderRef.current = recorder
      recorder.start()
      setState('recording')
    } catch {
      setError('mic_error')
      setState('idle')
    }
  }, [])

  const stopAndTranscribe = useCallback(async (): Promise<string | null> => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
      return null
    }

    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current!

      recorder.onstop = async () => {
        // Stop mic tracks
        streamRef.current?.getTracks().forEach(t => t.stop())
        streamRef.current = null

        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })
        chunksRef.current = []
        mediaRecorderRef.current = null

        if (blob.size === 0) {
          setState('idle')
          resolve(null)
          return
        }

        setState('transcribing')
        try {
          const { data } = await speechApi.transcribe(blob)
          setState('idle')
          if (data.text.trim()) {
            resolve(data.text.trim())
          } else {
            setError('transcription_failed')
            resolve(null)
          }
        } catch (err: unknown) {
          if (err && typeof err === 'object' && 'response' in err) {
            const status = (err as { response?: { status?: number } }).response?.status
            setError(status === 503 ? 'service_unavailable' : 'transcription_failed')
          } else {
            setError('transcription_failed')
          }
          setState('idle')
          resolve(null)
        }
      }

      recorder.stop()
    })
  }, [])

  const cancelRecording = useCallback(() => {
    cleanup()
    setState('idle')
    setError(null)
  }, [cleanup])

  const clearError = useCallback(() => setError(null), [])

  return { state, error, startRecording, stopAndTranscribe, cancelRecording, clearError }
}
