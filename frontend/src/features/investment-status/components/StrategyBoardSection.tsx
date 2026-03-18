import type { StrategyItem } from '../investmentStatus.types'
import { StrategyEntryCard } from './StrategyEntryCard'

type StrategyBoardSectionProps = {
  items: StrategyItem[]
  selectedStrategyId: string | null
  onSelectStrategy: (strategyId: string) => void
}

export function StrategyBoardSection({
  items,
  selectedStrategyId,
  onSelectStrategy,
}: StrategyBoardSectionProps) {
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

      <div
        data-testid="strategy-board-grid"
        className="mt-5 grid gap-4 lg:grid-cols-3"
      >
        {items.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-200 px-5 py-6 text-sm text-slate-500 lg:col-span-3">
            정의된 투자방식이 없습니다
          </p>
        ) : (
          items.map((item) => {
            return (
              <StrategyEntryCard
                key={item.id}
                item={item}
                isSelected={item.id === selectedStrategyId}
                onSelect={() => {
                  onSelectStrategy(item.id)
                }}
              />
            )
          })
        )}
      </div>
    </section>
  )
}
