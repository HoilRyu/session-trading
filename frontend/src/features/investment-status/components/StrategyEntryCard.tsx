import type { StrategyItem } from '../investmentStatus.types'

type StrategyEntryCardProps = {
  item: StrategyItem
}

export function StrategyEntryCard({ item }: StrategyEntryCardProps) {
  return (
    <button
      type="button"
      data-testid="strategy-entry-card"
      className="rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-colors hover:border-slate-300"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
        {item.summary}
      </p>
      <p className="mt-3 text-xl font-semibold text-slate-900">{item.label}</p>
      <p className="mt-2 text-sm text-slate-500">{item.description}</p>
    </button>
  )
}
