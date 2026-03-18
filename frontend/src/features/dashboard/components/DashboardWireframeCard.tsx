import type {
  DashboardWireframeCardConfig,
  DashboardWireframeTone,
} from '../constants/dashboardWireframe'

type DashboardWireframeCardProps = Pick<
  DashboardWireframeCardConfig,
  'label' | 'sectionLabel' | 'footerLabel' | 'minHeightClass' | 'testId' | 'tone'
>

const TONE_CLASSES: Record<DashboardWireframeTone, string> = {
  header: 'border-slate-800 bg-slate-900 text-slate-50 shadow-lg shadow-slate-900/10',
  summary: 'border-slate-200 bg-slate-50 text-slate-900 shadow-sm shadow-slate-200/80',
  primary:
    'border-slate-800 bg-linear-to-br from-slate-900 via-slate-800 to-slate-800 text-slate-50 shadow-lg shadow-slate-900/10',
  secondary:
    'border-slate-200 bg-white text-slate-900 shadow-sm shadow-slate-200/80',
  wide: 'border-slate-200 bg-slate-100 text-slate-900 shadow-sm shadow-slate-200/80',
}

export function DashboardWireframeCard({
  label,
  sectionLabel,
  footerLabel,
  minHeightClass,
  testId,
  tone,
}: DashboardWireframeCardProps) {
  return (
    <article
      data-testid={testId}
      className={[
        'flex flex-col rounded-3xl border p-5',
        minHeightClass,
        TONE_CLASSES[tone],
      ].join(' ')}
    >
      <div
        data-testid="dashboard-card-label"
        className="text-[11px] font-semibold uppercase tracking-[0.18em] text-current/60"
      >
        {sectionLabel}
      </div>

      <div
        data-testid="dashboard-card-body"
        className="flex flex-1 items-center justify-center py-6 text-center text-xl font-semibold"
      >
        {label}
      </div>

      <div
        data-testid="dashboard-card-footer"
        className="text-center text-xs font-medium text-current/60"
      >
        {footerLabel}
      </div>
    </article>
  )
}
