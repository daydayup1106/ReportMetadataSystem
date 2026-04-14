import type { TFunction } from 'i18next'

/**
 * Map of known English tag values to i18n keys.
 * Both English and Chinese stored values are covered.
 */
const TAG_I18N_MAP: Record<string, string> = {
  // English values (from reports created with English locale)
  'Self-reported': 'reports.tag_self_reported',
  'Blood Pressure': 'reports.tag_blood_pressure',
  'Heart Rate': 'reports.tag_heart_rate',
  'Fasting Glucose': 'reports.tag_fasting_glucose',
  'Postprandial Glucose': 'reports.tag_postprandial_glucose',
  'Glucose': 'reports.tag_glucose',
  // Chinese values (from reports created with Chinese locale)
  '自测记录': 'reports.tag_self_reported',
  '血压': 'reports.tag_blood_pressure',
  '心率': 'reports.tag_heart_rate',
  '空腹血糖': 'reports.tag_fasting_glucose',
  '餐后血糖': 'reports.tag_postprandial_glucose',
  '血糖': 'reports.tag_glucose',
}

/**
 * Translate a report tag using i18n. Falls back to the original value
 * for tags not in the map (e.g. metric names from uploaded reports).
 */
export function translateTag(tag: string, t: TFunction): string {
  const key = TAG_I18N_MAP[tag]
  return key ? t(key) : tag
}

/**
 * Bidirectional report name translation patterns.
 * Maps English prefixes to Chinese and vice versa.
 */
const NAME_PATTERNS: { en: RegExp; zh: RegExp; enPrefix: string; zhPrefix: string }[] = [
  { en: /^Self-reported BP (.+)/, zh: /^自测血压 (.+)/, enPrefix: 'Self-reported BP', zhPrefix: '自测血压' },
  { en: /^Self-reported HR (.+)/, zh: /^自测心率 (.+)/, enPrefix: 'Self-reported HR', zhPrefix: '自测心率' },
  { en: /^Self-reported glucose (.+)/, zh: /^自测血糖 (.+)/, enPrefix: 'Self-reported glucose', zhPrefix: '自测血糖' },
  { en: /^Self-reported 空腹血糖 (.+)/, zh: /^自测空腹血糖 (.+)/, enPrefix: 'Self-reported Fasting Glucose', zhPrefix: '自测空腹血糖' },
  { en: /^Self-reported 餐后血糖 (.+)/, zh: /^自测餐后血糖 (.+)/, enPrefix: 'Self-reported Postprandial Glucose', zhPrefix: '自测餐后血糖' },
]

/**
 * Format a report name: strip trailing time, translate known patterns based on locale.
 */
export function formatReportName(name: string, locale: string): string {
  // Strip trailing HH:MM:SS from old data
  const cleaned = name.replace(/ \d{2}:\d{2}:\d{2}$/, '')

  for (const p of NAME_PATTERNS) {
    if (locale === 'zh') {
      // English → Chinese
      const enMatch = cleaned.match(p.en)
      if (enMatch) return `${p.zhPrefix} ${enMatch[1]}`
    } else {
      // Chinese → English
      const zhMatch = cleaned.match(p.zh)
      if (zhMatch) return `${p.enPrefix} ${zhMatch[1]}`
    }
  }

  return cleaned
}
