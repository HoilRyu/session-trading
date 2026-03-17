import type { MarketChartMarketListItem } from '../marketList.types'

type MarketChartMarketListRowProps = {
  item: MarketChartMarketListItem
  isSelected: boolean
}

function getDisplayName({
  displayNameKo,
  displayNameEn,
  baseAsset,
}: MarketChartMarketListItem) {
  return displayNameKo ?? displayNameEn ?? baseAsset
}

export function MarketChartMarketListRow({
  item,
  isSelected,
}: MarketChartMarketListRowProps) {
  return (
    <div
      data-testid="market-list-row"
      data-selected={isSelected}
      className={`grid grid-cols-[minmax(0,1.3fr)_minmax(0,0.85fr)_minmax(0,0.75fr)_minmax(0,0.95fr)] items-center gap-3 rounded-2xl px-3 py-2 ${
        isSelected ? 'bg-sky-50' : 'bg-white'
      }`}
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-slate-900">
          {getDisplayName(item)}
        </p>
        <p className="mt-0.5 text-xs text-slate-500">
          {item.baseAsset}/{item.quoteAsset}
        </p>
      </div>

      <p className="text-right text-sm font-semibold text-sky-600">
        {item.tradePrice}
      </p>
      <p className="text-right text-sm font-semibold text-sky-600">
        {item.changeRate}
      </p>
      <p className="text-right text-sm font-medium text-slate-500">
        {item.volumeText}
      </p>
    </div>
  )
}
