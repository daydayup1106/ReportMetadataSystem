import { useRef, useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { UploadIcon, CameraIcon, DownloadIcon, CheckIcon } from '@/components/Icons'
import { scanApi } from '@/api/client'
import { useMemberStore } from '@/stores/memberStore'
import { RELATIONSHIP_KEYS, RELATIONSHIP_OPTION_VALUES } from '@/constants/relationships'

interface ExtractedMetric {
  metric_name: string
  metric_name_cn?: string
  value: number
  unit: string
  status: string
  reference_low?: number
  reference_high?: number
}

type UploadState = 'idle' | 'uploading' | 'review' | 'saving' | 'done' | 'error'

export default function ScanPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [state, setState] = useState<UploadState>('idle')
  const [jobId, setJobId] = useState<string | null>(null)
  const [metrics, setMetrics] = useState<ExtractedMetric[]>([])
  const [rawText, setRawText] = useState<string>('')
  const [metadata, setMetadata] = useState<Record<string, string>>({})
  const [fileName, setFileName] = useState('')
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)

  const { members, hasMultipleMembers, fetchMembers } = useMemberStore()
  const [selectedMemberId, setSelectedMemberId] = useState<string | 'new' | null>(null)
  const [newMemberRelationship, setNewMemberRelationship] = useState(4) // default: son
  const [newMemberLabel, setNewMemberLabel] = useState('')

  useEffect(() => {
    fetchMembers()
  }, [fetchMembers])

  const handleFile = useCallback(async (file: File) => {
    setState('uploading')
    setError('')
    setFileName(file.name)
    try {
      const { data } = await scanApi.upload(file)
      setJobId(data.job_id)
      setMetrics(data.extracted_metrics || [])
      setRawText(data.raw_text || '')
      setMetadata(data.metadata || {})
      setState('review')
    } catch {
      setError(t('scan.upload_failed'))
      setState('error')
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleConfirm = async () => {
    if (!jobId) return
    setState('saving')
    try {
      const confirmData: Record<string, unknown> = {
        name: fileName,
        report_date: metadata.report_date,
        hospital: metadata.hospital,
      }

      if (hasMultipleMembers) {
        if (selectedMemberId === 'new' && newMemberLabel.trim()) {
          confirmData.new_member = { relationship: newMemberRelationship, label: newMemberLabel.trim() }
        } else if (selectedMemberId && selectedMemberId !== 'new') {
          confirmData.member_id = selectedMemberId
        }
        // null = default to self, no extra param needed
      }

      await scanApi.confirm(jobId, confirmData as Parameters<typeof scanApi.confirm>[1])
      // Refresh member store if new member was created
      if (selectedMemberId === 'new' && newMemberLabel.trim()) {
        fetchMembers()
      }
      setState('done')
      setTimeout(() => navigate('/reports'), 1500)
    } catch {
      setError(t('scan.save_failed'))
      setState('error')
    }
  }

  return (
    <div className="flex-1 p-8 overflow-y-auto">
      <h1 className="text-2xl font-bold text-white mb-6 font-[family-name:var(--font-outfit)]">{t('scan.title')}</h1>

      <div className="max-w-2xl mx-auto">
        {/* Upload Zone */}
        {(state === 'idle' || state === 'error') && (
          <>
            <div
              className={`bg-white/[0.03] border-2 border-dashed rounded-3xl p-16 flex flex-col items-center justify-center transition-all group cursor-pointer ${
                dragOver ? 'border-emerald-400 bg-emerald-500/5' : 'border-white/10 hover:border-emerald-500/30'
              }`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.pdf,.bmp,.tiff"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
              />
              <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition">
                <UploadIcon />
              </div>
              <p className="text-lg font-semibold text-white mb-2">{t('scan.drop_here')}</p>
              <p className="text-sm text-slate-400 mb-6">{t('scan.browse_files')} · {t('scan.supported')}</p>
              <div className="flex gap-3">
                <button className="px-6 py-3 bg-emerald-500 text-white rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-emerald-400 transition">
                  <CameraIcon /> {t('scan.take_photo')}
                </button>
                <button className="px-6 py-3 bg-white/[0.06] text-white rounded-xl text-sm font-medium flex items-center gap-2 border border-white/10 hover:bg-white/[0.1] transition">
                  <DownloadIcon /> {t('scan.import_pdf')}
                </button>
              </div>
            </div>
            {error && <p className="text-red-400 text-sm mt-4 text-center">{error}</p>}
          </>
        )}

        {/* Uploading */}
        {state === 'uploading' && (
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-3xl p-16 flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mb-6" />
            <p className="text-white font-semibold">{t('scan.processing', { fileName })}</p>
            <p className="text-sm text-slate-400 mt-2">{t('scan.processing_desc')}</p>
          </div>
        )}

        {/* Review extracted metrics */}
        {state === 'review' && (
          <div className="space-y-4">
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-bold text-white">{fileName}</p>
                  {metadata.hospital && <p className="text-[12px] text-slate-400 mt-1">{metadata.hospital}</p>}
                </div>
                <div className="text-right">
                  <p className="text-[12px] text-slate-400">
                    {metadata.report_date || metadata.sample_date || metadata.receive_date || new Date().toISOString().slice(0, 10)}
                  </p>
                  <span className="text-[11px] text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full font-medium inline-block mt-1">
                    {t('scan.metrics_found', { count: metrics.length })}
                  </span>
                </div>
              </div>

              {/* For Whom selector (only when multiple members) */}
              {hasMultipleMembers && (
                <div className="mb-4 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-slate-400 shrink-0">{t('scan.for_whom')}:</span>
                    <select
                      value={selectedMemberId || ''}
                      onChange={(e) => {
                        const val = e.target.value
                        setSelectedMemberId(val === '' ? null : val)
                      }}
                      className="flex-1 bg-white/[0.05] border border-white/[0.08] rounded-lg px-3 py-1.5 text-sm text-white outline-none appearance-none cursor-pointer"
                    >
                      {members.map((m) => {
                        const label = m.is_owner
                          ? t('members.self')
                          : t(`members.${RELATIONSHIP_KEYS[m.relationship] || 'other'}`)
                        return (
                          <option key={m.id} value={m.id}>{label}</option>
                        )
                      })}
                      <option value="new">{t('scan.add_new_member')}</option>
                    </select>
                  </div>
                  {selectedMemberId === 'new' && (
                    <div className="flex items-center gap-3 mt-3">
                      <select
                        value={newMemberRelationship}
                        onChange={(e) => setNewMemberRelationship(Number(e.target.value))}
                        className="bg-white/[0.05] border border-white/[0.08] rounded-lg px-3 py-1.5 text-sm text-white outline-none appearance-none cursor-pointer"
                      >
                        {RELATIONSHIP_OPTION_VALUES.map((val) => (
                          <option key={val} value={val}>{t(`members.${RELATIONSHIP_KEYS[val]}`)}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={newMemberLabel}
                        onChange={(e) => setNewMemberLabel(e.target.value)}
                        placeholder={t('scan.member_label')}
                        className="flex-1 bg-white/[0.05] border border-white/[0.08] rounded-lg px-3 py-1.5 text-sm text-white outline-none placeholder:text-slate-600"
                      />
                    </div>
                  )}
                </div>
              )}

              {metrics.length > 0 ? (
                <div className="space-y-2">
                  {metrics.map((m, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                      <div>
                        <p className="text-sm font-medium text-white">
                          {i18n.language === 'zh' ? (m.metric_name_cn || m.metric_name) : m.metric_name}
                        </p>
                        {i18n.language === 'zh'
                          ? <p className="text-[11px] text-slate-500">{m.metric_name}</p>
                          : m.metric_name_cn && <p className="text-[11px] text-slate-500">{m.metric_name_cn}</p>
                        }
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-white">{m.value} {m.unit}</span>
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          m.status === 'normal' ? 'bg-emerald-500/10 text-emerald-400' :
                          m.status === 'high' ? 'bg-red-500/10 text-red-400' :
                          m.status === 'low' ? 'bg-amber-500/10 text-amber-400' :
                          'bg-slate-500/10 text-slate-400'
                        }`}>{t(`common.${m.status}`)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 text-sm">{t('scan.no_metrics')}</p>
              )}

              {rawText && (
                <details className="mt-4">
                  <summary className="text-[12px] text-slate-500 cursor-pointer hover:text-slate-300">{t('scan.show_raw_text')}</summary>
                  <pre className="mt-2 text-[11px] text-slate-500 bg-white/[0.02] p-3 rounded-lg overflow-x-auto max-h-40 whitespace-pre-wrap">{rawText}</pre>
                </details>
              )}
            </div>

            <div className="flex gap-3">
              <button onClick={() => { setState('idle'); setMetrics([]); setSelectedMemberId(null); setNewMemberLabel('') }} className="px-6 py-3 bg-white/[0.06] text-white rounded-xl text-sm font-medium border border-white/10 hover:bg-white/[0.1] transition">
                {t('scan.re_upload')}
              </button>
              <button onClick={handleConfirm} className="flex-1 px-6 py-3 bg-emerald-500 text-white rounded-xl text-sm font-semibold hover:bg-emerald-400 transition flex items-center justify-center gap-2">
                <CheckIcon /> {t('scan.confirm_save')}
              </button>
            </div>
          </div>
        )}

        {/* Saving */}
        {state === 'saving' && (
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-3xl p-16 flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mb-6" />
            <p className="text-white font-semibold">{t('scan.saving')}</p>
          </div>
        )}

        {/* Done */}
        {state === 'done' && (
          <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-3xl p-16 flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mb-6">
              <CheckIcon />
            </div>
            <p className="text-white font-semibold text-lg">{t('scan.save_success')}</p>
            <p className="text-sm text-slate-400 mt-2">{t('scan.redirecting')}</p>
          </div>
        )}

        {/* How it works (show only on idle) */}
        {(state === 'idle' || state === 'error') && (
          <div className="mt-6 p-5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <p className="text-sm font-bold text-white mb-3">{t('scan.how_it_works')}</p>
            <div className="grid grid-cols-3 gap-4">
              {[
                { s: '1', title: t('scan.step_upload'), d: t('scan.step_upload_desc') },
                { s: '2', title: t('scan.step_extract'), d: t('scan.step_extract_desc') },
                { s: '3', title: t('scan.step_track'), d: t('scan.step_track_desc') },
              ].map((step, i) => (
                <div key={i} className="text-center">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center mx-auto mb-2 text-sm font-bold">{step.s}</div>
                  <p className="text-sm font-semibold text-white">{step.title}</p>
                  <p className="text-[11px] text-slate-500 mt-1">{step.d}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
