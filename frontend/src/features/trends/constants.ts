/** Series line colors for trend charts */
export const SERIES_COLORS: Record<string, string> = {
  // Merged chart: Blood Pressure
  systolic_bp: '#10B981',   // emerald-500
  diastolic_bp: '#60A5FA',  // blue-400

  // Single-metric charts
  fasting_glucose: '#A78BFA',    // violet-400
  postprandial_glucose: '#F472B6', // pink-400
  blood_glucose: '#C084FC',      // purple-400
  heart_rate: '#FB923C',         // orange-400
  blood_oxygen: '#38BDF8',       // sky-400
  body_temperature: '#FBBF24',   // amber-400
  respiratory_rate: '#34D399',   // emerald-300
  hrv: '#818CF8',                // indigo-400
}

export const DEFAULT_SERIES_COLOR = '#94A3B8' // slate-400

/** Scenario badge colors */
export const SCENARIO_BADGE_COLORS: Record<string, { bg: string; text: string }> = {
  fasting:          { bg: 'bg-violet-500/10',  text: 'text-violet-400' },
  before_breakfast: { bg: 'bg-sky-500/10',     text: 'text-sky-400' },
  after_breakfast:  { bg: 'bg-teal-500/10',    text: 'text-teal-400' },
  before_lunch:     { bg: 'bg-cyan-500/10',    text: 'text-cyan-400' },
  after_lunch:      { bg: 'bg-blue-500/10',    text: 'text-blue-400' },
  before_dinner:    { bg: 'bg-indigo-500/10',  text: 'text-indigo-400' },
  after_dinner:     { bg: 'bg-purple-500/10',  text: 'text-purple-400' },
  before_sleep:     { bg: 'bg-pink-500/10',    text: 'text-pink-400' },
  undefined:        { bg: 'bg-slate-500/10',   text: 'text-slate-400' },
}

/** Scenario display labels */
export const SCENARIO_LABELS: Record<string, { en: string; cn: string }> = {
  fasting:          { en: 'Fasting',           cn: '空腹' },
  before_breakfast: { en: 'Bef. Breakfast',    cn: '早餐前' },
  after_breakfast:  { en: 'Aft. Breakfast',    cn: '早餐后' },
  before_lunch:     { en: 'Bef. Lunch',        cn: '午餐前' },
  after_lunch:      { en: 'Aft. Lunch',        cn: '午餐后' },
  before_dinner:    { en: 'Bef. Dinner',       cn: '晚餐前' },
  after_dinner:     { en: 'Aft. Dinner',       cn: '晚餐后' },
  before_sleep:     { en: 'Before Sleep',      cn: '睡前' },
  undefined:        { en: 'Other',             cn: '非标准' },
}

export function getSeriesColor(metricCode: string): string {
  return SERIES_COLORS[metricCode] || DEFAULT_SERIES_COLOR
}

export function getScenarioLabel(scenario: string, locale: string): string {
  const labels = SCENARIO_LABELS[scenario]
  if (!labels) return scenario
  return locale === 'zh' ? labels.cn : labels.en
}

export function getScenarioBadge(scenario: string): { bg: string; text: string } {
  return SCENARIO_BADGE_COLORS[scenario] || SCENARIO_BADGE_COLORS.undefined
}
