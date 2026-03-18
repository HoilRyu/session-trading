import type { SettingsGeneralSection } from '../settings.types'
import { getExchangeDisplayName } from '../../market-chart/marketList.types'

type SettingsGeneralCardProps = {
  value: SettingsGeneralSection
  error?: string | null
  disabled?: boolean
  onChange: (patch: Partial<SettingsGeneralSection>) => void
  onReset: () => void
}

export function SettingsGeneralCard({
  value,
  error,
  disabled = false,
  onChange,
  onReset,
}: SettingsGeneralCardProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">일반</h3>
          <p className="mt-1 text-sm text-slate-500">
            기본 거래소와 앱 진입 경로를 관리해요.
          </p>
        </div>
        <button
          type="button"
          onClick={onReset}
          disabled={disabled}
          className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700"
          aria-label="일반 섹션 복원"
        >
          섹션 복원
        </button>
      </div>

      <div className="mt-5 space-y-4">
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          기본 거래소
          <select
            value={value.default_exchange}
            disabled={disabled}
            onChange={(event) =>
              onChange({
                default_exchange: event.target.value as SettingsGeneralSection['default_exchange'],
              })
            }
            className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
          >
            {(['upbit', 'bithumb', 'binance'] as const).map((exchange) => (
              <option key={exchange} value={exchange}>
                {getExchangeDisplayName(exchange)}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          기본 진입 화면
          <select
            value={value.default_route}
            disabled={disabled}
            onChange={(event) =>
              onChange({
                default_route: event.target.value as SettingsGeneralSection['default_route'],
              })
            }
            className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
          >
            <option value="/dashboard">대시보드</option>
            <option value="/investment-status">투자 현황</option>
            <option value="/market-chart">시세 / 차트</option>
            <option value="/settings">설정</option>
          </select>
        </label>
      </div>

      {error ? (
        <p className="mt-4 rounded-2xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      ) : null}
    </section>
  )
}
