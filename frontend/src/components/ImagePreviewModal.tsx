import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { reportsApi } from '@/api/client'
import { DownloadIcon } from '@/components/Icons'

interface ImagePreviewModalProps {
  previewUrl: string
  reportName: string
  reportId: string
  onClose: () => void
}

export default function ImagePreviewModal({ previewUrl, reportName, reportId, onClose }: ImagePreviewModalProps) {
  const { t } = useTranslation()

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  const handleDownload = async () => {
    try {
      const { data: blob } = await reportsApi.download(reportId)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = reportName + '.jpg'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      console.error('Download failed')
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="relative max-w-5xl max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <img
          src={previewUrl}
          alt={reportName}
          className="max-w-full max-h-[85vh] object-contain rounded-lg"
        />
        <div className="flex gap-2 justify-center mt-3">
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition"
          >
            <DownloadIcon />
            {t('reports.download', 'Download')}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-300 bg-white/10 hover:bg-white/20 rounded-lg transition"
          >
            {t('reports.close', 'Close')}
          </button>
        </div>
      </div>
    </div>
  )
}
