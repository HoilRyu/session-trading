import type { MarketListExchange } from '../../market-chart/marketList.types'
import { getExchangeDisplayName } from '../../market-chart/marketList.types'
import type {
  SettingsOperationStateMap,
  SettingsOpsSection,
} from '../settings.types'

type SettingsOpsCardProps = {
  value: SettingsOpsSection
  error?: string | null
  disabled?: boolean
  actionStates: SettingsOperationStateMap
  onChange: (patch: Partial<SettingsOpsSection>) => void
  onRunMarketSync: () => void
  onStartExchangeStream: (exchange: MarketListExchange) => void
  onStopExchangeStream: (exchange: MarketListExchange) => void
}

function renderActionMessage(message: string | null | undefined) {
  if (!message) {
    return null
  }

  return <p className="text-xs text-slate-500">{message}</p>
}

export function SettingsOpsCard({
  value,
  error,
  disabled = false,
  actionStates,
  onChange,
  onRunMarketSync,
  onStartExchangeStream,
  onStopExchangeStream,
}: SettingsOpsCardProps) {
  const marketSyncPending = actionStates['market-sync']?.status === 'pending'

  return (
    <section className="rounded-3xl border border-amber-200 bg-amber-50/70 p-5 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">운영 제어</h3>
          <p className="mt-1 text-sm text-slate-600">
            저장형 설정과 즉시 실행 액션을 분리해서 다뤄요.
          </p>
        </div>
        <button
          type="button"
          onClick={onRunMarketSync}
          disabled={disabled || marketSyncPending}
          className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
        >
          마켓 동기화 실행
        </button>
      </div>

      {renderActionMessage(actionStates['market-sync']?.message)}

      <label className="mt-4 flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-sm font-medium text-slate-700">
        <input
          type="checkbox"
          disabled={disabled}
          checked={value.market_sync_on_boot}
          onChange={(event) =>
            onChange({
              market_sync_on_boot: event.target.checked,
            })
          }
          className="h-4 w-4 rounded border-slate-300"
        />
        앱 시작 시 마켓 동기화 실행
      </label>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {(['upbit', 'bithumb', 'binance'] as MarketListExchange[]).map((exchange) => (
          <div
            key={exchange}
            className="rounded-2xl border border-white/80 bg-white p-4 shadow-sm"
          >
            <p className="text-sm font-semibold text-slate-900">
              {getExchangeDisplayName(exchange)}
            </p>

            <div className="mt-3 space-y-3">
              <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  disabled={disabled}
                  checked={value.exchanges[exchange].ticker_enabled}
                  onChange={(event) =>
                    onChange({
                      exchanges: {
                        ...value.exchanges,
                        [exchange]: {
                          ...value.exchanges[exchange],
                          ticker_enabled: event.target.checked,
                        },
                      },
                    })
                  }
                  className="h-4 w-4 rounded border-slate-300"
                />
                ticker 사용
              </label>

              <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  disabled={disabled}
                  checked={value.exchanges[exchange].auto_start}
                  onChange={(event) =>
                    onChange({
                      exchanges: {
                        ...value.exchanges,
                        [exchange]: {
                          ...value.exchanges[exchange],
                          auto_start: event.target.checked,
                        },
                      },
                    })
                  }
                  className="h-4 w-4 rounded border-slate-300"
                />
                자동 시작
              </label>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onStartExchangeStream(exchange)}
                disabled={disabled || actionStates[`start:${exchange}`]?.status === 'pending'}
                className="rounded-2xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white disabled:bg-emerald-300"
              >
                {getExchangeDisplayName(exchange)} 시작
              </button>
              <button
                type="button"
                onClick={() => onStopExchangeStream(exchange)}
                disabled={disabled || actionStates[`stop:${exchange}`]?.status === 'pending'}
                className="rounded-2xl bg-slate-700 px-3 py-2 text-sm font-semibold text-white disabled:bg-slate-300"
              >
                {getExchangeDisplayName(exchange)} 중지
              </button>
            </div>

            <div className="mt-3 space-y-1">
              {renderActionMessage(actionStates[`start:${exchange}`]?.message)}
              {renderActionMessage(actionStates[`stop:${exchange}`]?.message)}
            </div>
          </div>
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
