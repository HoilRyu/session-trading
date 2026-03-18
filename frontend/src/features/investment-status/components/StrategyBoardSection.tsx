import type { StrategyItem } from '../investmentStatus.types'
import { StrategyEntryCard } from './StrategyEntryCard'

type StrategyBoardSectionProps = {
  items: StrategyItem[]
}

export function StrategyBoardSection({ items }: StrategyBoardSectionProps) {
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            Strategy Board
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">투자 방식</h2>
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-3">
        {items.map((item) => {
          return <StrategyEntryCard key={item.id} item={item} />
        })}
      </div>
    </section>
  )
}
