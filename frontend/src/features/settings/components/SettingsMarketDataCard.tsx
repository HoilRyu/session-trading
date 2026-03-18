import type { MarketListExchange } from '../../market-chart/marketList.types'
import { getExchangeDisplayName } from '../../market-chart/marketList.types'
import type { SettingsMarketDataSection } from '../settings.types'

type SettingsMarketDataCardProps = {
  value: SettingsMarketDataSection
  error?: string | null
  disabled?: boolean
  onChange: (patch: Partial<SettingsMarketDataSection>) => void
  onReset: () => void
}

export function SettingsMarketDataCard({
  value,
  error,
  disabled = false,
  onChange,
  onReset,
}: SettingsMarketDataCardProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">마켓 데이터</h3>
          <p className="mt-1 text-sm text-slate-500">
            목록 기본값과 자동 새로고침 기준을 관리해요.
          </p>
        </div>
        <button
          type="button"
          onClick={onReset}
          disabled={disabled}
          className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700"
          aria-label="마켓 데이터 섹션 복원"
        >
          섹션 복원
        </button>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          기본 quote
          <select
            value={value.default_quote}
            disabled={disabled}
            onChange={(event) =>
              onChange({
                default_quote: event.target.value as SettingsMarketDataSection['default_quote'],
              })
            }
            className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
          >
            <option value="KRW">KRW</option>
            <option value="BTC">BTC</option>
            <option value="USDT">USDT</option>
          </select>
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          기본 정렬 기준
          <select
            value={value.default_order_by}
            disabled={disabled}
            onChange={(event) =>
              onChange({
                default_order_by: event.target.value as SettingsMarketDataSection['default_order_by'],
              })
            }
            className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
          >
            <option value="name">종목명</option>
            <option value="price">현재가</option>
            <option value="change_rate">전일대비</option>
            <option value="volume_24h">거래량</option>
            <option value="trade_amount_24h">거래대금</option>
          </select>
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          기본 정렬 방향
          <select
            value={value.default_order_dir}
            disabled={disabled}
            onChange={(event) =>
              onChange({
                default_order_dir: event.target.value as SettingsMarketDataSection['default_order_dir'],
              })
            }
            className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
          >
            <option value="asc">오름차순</option>
            <option value="desc">내림차순</option>
          </select>
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          폴링 주기(ms)
          <input
            type="number"
            disabled={disabled}
            min={1000}
            step={100}
            value={value.poll_interval_ms}
            onChange={(event) =>
              onChange({
                poll_interval_ms: Number(event.target.value) || 0,
              })
            }
            className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          기본 목록 개수
          <input
            type="number"
            disabled={disabled}
            min={20}
            step={10}
            value={value.page_size}
            onChange={(event) =>
              onChange({
                page_size: Number(event.target.value) || 0,
              })
            }
            className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
          />
        </label>
      </div>

      <label className="mt-4 flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
        <input
          type="checkbox"
          disabled={disabled}
          checked={value.auto_refresh_enabled}
          onChange={(event) =>
            onChange({
              auto_refresh_enabled: event.target.checked,
            })
          }
          className="h-4 w-4 rounded border-slate-300"
        />
        자동 새로고침 사용
      </label>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {(['upbit', 'bithumb', 'binance'] as MarketListExchange[]).map((exchange) => (
          <label
            key={exchange}
            className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700"
          >
            <input
              type="checkbox"
              disabled={disabled}
              checked={value.exchanges[exchange].enabled}
              onChange={(event) =>
                onChange({
                  exchanges: {
                    ...value.exchanges,
                    [exchange]: {
                      enabled: event.target.checked,
                    },
                  },
                })
              }
              className="h-4 w-4 rounded border-slate-300"
            />
            {getExchangeDisplayName(exchange)} 활성화
          </label>
        ))}
      </div>

      {error ? (
        <p className="mt-4 rounded-2xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      ) : null}
    </section>
  )
}
