import type { RunningJobItem } from '../investmentStatus.types'

type RunningJobListCardProps = {
  item: RunningJobItem
}

export function RunningJobListCard({ item }: RunningJobListCardProps) {
  return (
    <article
      data-testid="running-job-card"
      className="grid items-center gap-3 rounded-2xl bg-white px-5 py-4 text-slate-900 shadow-sm md:grid-cols-[minmax(0,1fr)_auto]"
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          {item.status}
        </p>
        <p className="mt-2 text-base font-semibold">{item.label}</p>
      </div>
      <p className="text-sm text-slate-500">{item.progressText}</p>
    </article>
  )
}
