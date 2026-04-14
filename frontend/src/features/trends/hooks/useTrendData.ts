import { useState, useEffect, useCallback } from 'react'
import { metricsApi } from '@/api/client'
import type { MetricGroupItem, GroupedTrendResponse } from '@/types/api'

export function useTrendData(memberId: string | null) {
  const [groups, setGroups] = useState<MetricGroupItem[]>([])
  const [activeGroup, setActiveGroup] = useState<string>('')
  const [scenario, setScenario] = useState<string | null>(null)
  const [period, setPeriod] = useState('all')
  const [trendData, setTrendData] = useState<GroupedTrendResponse | null>(null)
  const [isLoadingGroups, setIsLoadingGroups] = useState(true)
  const [isLoadingTrends, setIsLoadingTrends] = useState(false)

  // Fetch groups when member changes
  useEffect(() => {
    setIsLoadingGroups(true)
    setActiveGroup('')
    setTrendData(null)
    setScenario(null)

    metricsApi.groups(memberId || undefined)
      .then(({ data }) => {
        setGroups(data)
        if (data.length > 0) setActiveGroup(data[0].group_key)
      })
      .catch(() => setGroups([]))
      .finally(() => setIsLoadingGroups(false))
  }, [memberId])

  // Fetch trend data when group, scenario, or period changes
  useEffect(() => {
    if (!activeGroup) {
      setIsLoadingTrends(false)
      return
    }
    setIsLoadingTrends(true)
    metricsApi.groupedTrends(activeGroup, period, scenario || undefined, memberId || undefined)
      .then(({ data }) => setTrendData(data))
      .catch(() => setTrendData(null))
      .finally(() => setIsLoadingTrends(false))
  }, [activeGroup, scenario, period, memberId])

  // Reset scenario when switching groups
  const handleGroupChange = useCallback((groupKey: string) => {
    setActiveGroup(groupKey)
    setScenario(null)
    setTrendData(null)
  }, [])

  const activeGroupItem = groups.find(g => g.group_key === activeGroup) || null

  return {
    groups,
    activeGroup,
    activeGroupItem,
    scenario,
    period,
    trendData,
    isLoadingGroups,
    isLoadingTrends,
    setActiveGroup: handleGroupChange,
    setScenario,
    setPeriod,
  }
}
