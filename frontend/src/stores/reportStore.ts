import { create } from 'zustand'
import type { Report, HealthMetric, MetricSummaryItem } from '@/types/api'
import { reportsApi, metricsApi } from '@/api/client'

interface ReportState {
  reports: Report[]
  total: number
  page: number
  isLoading: boolean
  selectedReport: (Report & { metrics: HealthMetric[] }) | null
  metricsSummary: MetricSummaryItem[]

  fetchReports: (params?: { category?: string; search?: string; page?: number; limit?: number; member_id?: string; sort_by?: string; sort_order?: string; date_from?: string; date_to?: string }) => Promise<void>
  fetchReport: (id: string) => Promise<void>
  fetchMetricsSummary: () => Promise<void>
  uploadReport: (file: File, data?: { report_date?: string; hospital?: string }) => Promise<void>
  deleteReport: (id: string) => Promise<void>
}

export const useReportStore = create<ReportState>((set, get) => ({
  reports: [],
  total: 0,
  page: 1,
  isLoading: false,
  selectedReport: null,
  metricsSummary: [],

  fetchReports: async (params) => {
    set({ isLoading: true })
    try {
      const { data } = await reportsApi.list(params)
      set({ reports: data.reports, total: data.total, page: data.page })
    } catch {
      // Keep existing data on error
    } finally {
      set({ isLoading: false })
    }
  },

  fetchReport: async (id) => {
    set({ isLoading: true })
    try {
      const { data } = await reportsApi.get(id)
      set({ selectedReport: { ...data.report, metrics: data.metrics } })
    } finally {
      set({ isLoading: false })
    }
  },

  fetchMetricsSummary: async () => {
    try {
      const { data } = await metricsApi.summary()
      set({ metricsSummary: data.overview })
    } catch {
      // Keep empty on error
    }
  },

  uploadReport: async (file, data) => {
    set({ isLoading: true })
    try {
      await reportsApi.upload(file, data)
      await get().fetchReports()
    } finally {
      set({ isLoading: false })
    }
  },

  deleteReport: async (id) => {
    await reportsApi.delete(id)
    set((s) => ({ reports: s.reports.filter((r) => r.id !== id) }))
  },
}))
