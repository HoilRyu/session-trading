import type { MarketChartMarketListItem } from '../marketList.types'

type MarketChartMarketListRowProps = {
  item: MarketChartMarketListItem
  isSelected: boolean
  onSelect?: (marketListingId: number) => void
}

function getDisplayName({
  displayNameKo,
  displayNameEn,
  baseAsset,
}: MarketChartMarketListItem) {
  return displayNameKo ?? displayNameEn ?? baseAsset
}

function getChangeTone(changeRate: string) {
  if (changeRate.startsWith('+')) {
    return 'text-rose-600'
  }

  if (changeRate.startsWith('-')) {
    return 'text-blue-600'
  }

  return 'text-slate-500'
}

function getRowActionLabel(item: MarketChartMarketListItem) {
  return `${getDisplayName(item)} ${item.quoteAsset}/${item.baseAsset} 차트 보기`
}

export function MarketChartMarketListRow({
  item,
  isSelected,
  onSelect,
}: MarketChartMarketListRowProps) {
  const changeToneClass = getChangeTone(item.changeRate)
  const content = (
    <>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-slate-900">
          {getDisplayName(item)}
        </p>
        <p className="mt-0.5 text-xs text-slate-500">
          {item.baseAsset}/{item.quoteAsset}
        </p>
      </div>

      <p className={`text-right text-sm font-semibold tabular-nums ${changeToneClass}`}>
        {item.tradePrice}
      </p>
      <p className={`text-right text-sm font-semibold tabular-nums ${changeToneClass}`}>
        {item.changeRate}
      </p>
      <p className="text-right text-sm font-medium tabular-nums text-slate-500">
        {item.volumeText}
      </p>
    </>
  )
  const rowClassName = `grid w-full grid-cols-[minmax(0,1.15fr)_minmax(0,0.9fr)_minmax(0,0.78fr)_minmax(0,0.92fr)] items-center gap-2 rounded-2xl px-2.5 py-2 text-left sm:px-3 ${
    isSelected ? 'bg-sky-50' : 'bg-white'
  }`

  if (!onSelect) {
    return (
      <div
        data-testid="market-list-row"
        data-selected={isSelected}
        className={rowClassName}
      >
        {content}
      </div>
    )
  }

  return (
    <button
      type="button"
      aria-pressed={isSelected}
      aria-label={getRowActionLabel(item)}
      onClick={() => onSelect(item.marketListingId)}
      data-testid="market-list-row"
      data-selected={isSelected}
      className={`${rowClassName} cursor-pointer transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500`}
    >
      {content}
    </button>
  )
}
