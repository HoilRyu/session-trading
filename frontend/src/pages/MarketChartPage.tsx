import { MarketChartDesktopLayout } from '../features/market-chart/components/MarketChartDesktopLayout'
import { useServerSettings } from '../features/settings/hooks/useServerSettings'

export function MarketChartPage() {
  const { settings, loading } = useServerSettings()

  if (loading && settings === null) {
    return (
      <section className="flex min-h-0 flex-1 items-center justify-center rounded-3xl bg-white text-sm font-medium text-slate-500">
        시세 설정을 불러오는 중이에요.
      </section>
    )
  }

  return <MarketChartDesktopLayout settings={settings} />
}
