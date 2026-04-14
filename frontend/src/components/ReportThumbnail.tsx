import { useState, useEffect, useRef } from 'react'
import { reportsApi } from '@/api/client'
import { FileIcon } from '@/components/Icons'

interface ReportThumbnailProps {
  reportId: string
  fileType: 'image' | 'pdf' | null
  reportName: string
  onClick: () => void
}

const PdfIcon = () => (
  <svg className="w-5 h-5 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M7 21h10a2 2 0 002-2V9l-5-5H7a2 2 0 00-2 2v13a2 2 0 002 2z" />
    <polyline points="14 4 14 9 19 9" />
    <line x1="9" y1="13" x2="15" y2="13" />
    <line x1="9" y1="17" x2="13" y2="17" />
  </svg>
)

export default function ReportThumbnail({ reportId, fileType, reportName, onClick }: ReportThumbnailProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [hasIntersected, setHasIntersected] = useState(false)

  // IntersectionObserver: trigger load when scrolled near
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasIntersected(true)
          observer.disconnect()
        }
      },
      { rootMargin: '200px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Load preview when visible (images only)
  useEffect(() => {
    if (!hasIntersected || fileType !== 'image' || !reportId) return
    let cancelled = false
    setLoading(true)
    reportsApi.preview(reportId).then(({ data: blob }) => {
      if (!cancelled) setPreviewUrl(URL.createObjectURL(blob))
    }).catch(() => {
      // Preview not available
    }).finally(() => {
      if (!cancelled) setLoading(false)
    })
    return () => { cancelled = true }
  }, [hasIntersected, reportId, fileType])

  // Cleanup blob URL
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  if (fileType === 'pdf') {
    return (
      <div
        ref={containerRef}
        onClick={(e) => { e.stopPropagation(); onClick() }}
        className="w-11 h-11 rounded-xl bg-red-500/10 flex items-center justify-center cursor-pointer hover:bg-red-500/20 transition flex-shrink-0 mt-0.5"
      >
        <PdfIcon />
      </div>
    )
  }

  if (fileType === 'image') {
    return (
      <div
        ref={containerRef}
        onClick={(e) => { e.stopPropagation(); onClick() }}
        className="w-11 h-11 rounded-xl overflow-hidden bg-white/[0.06] cursor-pointer hover:ring-2 hover:ring-emerald-500/40 transition flex-shrink-0 mt-0.5"
      >
        {loading ? (
          <div className="w-full h-full animate-pulse bg-white/[0.08]" />
        ) : previewUrl ? (
          <img src={previewUrl} alt={reportName} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400">
            <FileIcon />
          </div>
        )}
      </div>
    )
  }

  // No file
  return (
    <div
      ref={containerRef}
      className="w-11 h-11 rounded-xl bg-white/[0.06] flex items-center justify-center text-slate-400 flex-shrink-0 mt-0.5"
    >
      <FileIcon />
    </div>
  )
}
