import type { StrategyItem } from '../investmentStatus.types'

type StrategyDetailPanelProps = {
  item: StrategyItem | null
}

export function StrategyDetailPanel({ item }: StrategyDetailPanelProps) {
  return (
    <aside className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
        Detail Panel
      </p>
      <h2 className="mt-2 text-2xl font-semibold text-slate-900">전략 상세</h2>

      {item === null ? (
        <p className="mt-4 text-sm text-slate-500">
          전략 카드를 선택하면 상세가 표시됩니다
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          <p className="text-xl font-semibold text-slate-900">{item.label}</p>
          <p className="text-sm font-medium text-slate-600">{item.summary}</p>
          <p className="text-sm text-slate-500">{item.description}</p>
        </div>
      )}
    </aside>
  )
}
