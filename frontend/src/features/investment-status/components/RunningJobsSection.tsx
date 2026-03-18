import type { RunningJobItem } from '../investmentStatus.types'
import { RunningJobListCard } from './RunningJobListCard'

type RunningJobsSectionProps = {
  items: RunningJobItem[]
}

export function RunningJobsSection({ items }: RunningJobsSectionProps) {
  return (
    <section className="rounded-[2rem] bg-slate-900 p-6 text-white shadow-lg">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Operations
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">현재 실행 중 작업</h2>
        </div>
        <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-300">
          {`${items.length} active`}
        </span>
      </div>

      <div className="mt-5 grid gap-3">
        {items.map((item) => {
          return <RunningJobListCard key={item.id} item={item} />
        })}
      </div>
    </section>
  )
}
