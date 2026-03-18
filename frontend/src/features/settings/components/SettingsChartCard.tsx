import { getExchangeDisplayName } from '../../market-chart/marketList.types'
import type { SettingsChartSection } from '../settings.types'

type SettingsChartCardProps = {
  value: SettingsChartSection
  error?: string | null
  disabled?: boolean
  onChange: (patch: Partial<SettingsChartSection>) => void
  onReset: () => void
}

export function SettingsChartCard({
  value,
  error,
  disabled = false,
  onChange,
  onReset,
}: SettingsChartCardProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">차트</h3>
          <p className="mt-1 text-sm text-slate-500">
            기본 차트 심볼과 표시 형식을 관리해요.
          </p>
        </div>
        <button
          type="button"
          onClick={onReset}
          disabled={disabled}
          className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700"
          aria-label="차트 섹션 복원"
        >
          섹션 복원
        </button>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          기본 거래소
          <select
            value={value.default_exchange}
            disabled={disabled}
            onChange={(event) =>
              onChange({
                default_exchange: event.target.value as SettingsChartSection['default_exchange'],
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
          기본 심볼
          <input
            type="text"
            value={value.default_symbol}
            disabled={disabled}
            onChange={(event) =>
              onChange({
                default_symbol: event.target.value,
              })
            }
            className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          기본 타임프레임
          <select
            value={value.default_interval}
            disabled={disabled}
            onChange={(event) =>
              onChange({
                default_interval: event.target.value as SettingsChartSection['default_interval'],
              })
            }
            className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
          >
            <option value="1">1분</option>
            <option value="3">3분</option>
            <option value="5">5분</option>
            <option value="15">15분</option>
            <option value="30">30분</option>
            <option value="60">1시간</option>
            <option value="240">4시간</option>
            <option value="1D">1일</option>
          </select>
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          차트 테마
          <select
            value={value.theme}
            disabled={disabled}
            onChange={(event) =>
              onChange({
                theme: event.target.value as SettingsChartSection['theme'],
              })
            }
            className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
          >
            <option value="light">라이트</option>
            <option value="dark">다크</option>
          </select>
        </label>

      </div>

      <label className="mt-4 flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
        <input
          type="checkbox"
          disabled={disabled}
          checked={value.show_volume}
          onChange={(event) =>
            onChange({
              show_volume: event.target.checked,
            })
          }
          className="h-4 w-4 rounded border-slate-300"
        />
        거래량 표시
      </label>

      {error ? (
        <p className="mt-4 rounded-2xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      ) : null}
    </section>
  )
}
