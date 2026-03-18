import type { StrategyItem } from '../investmentStatus.types'

type StrategyEntryCardProps = {
  item: StrategyItem
  isSelected: boolean
  onSelect: () => void
}

export function StrategyEntryCard({
  item,
  isSelected,
  onSelect,
}: StrategyEntryCardProps) {
  return (
    <button
      type="button"
      data-testid="strategy-entry-card"
      aria-pressed={isSelected}
      data-selected={isSelected}
      onClick={onSelect}
      className={[
        'rounded-3xl border bg-white p-5 text-left shadow-sm transition-colors',
        isSelected
          ? 'border-slate-900 ring-2 ring-slate-200'
          : 'border-slate-200 hover:border-slate-300',
      ].join(' ')}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
        {item.summary}
      </p>
      <p className="mt-3 text-xl font-semibold text-slate-900">{item.label}</p>
      <p className="mt-2 text-sm text-slate-500">{item.description}</p>
    </button>
  )
}
