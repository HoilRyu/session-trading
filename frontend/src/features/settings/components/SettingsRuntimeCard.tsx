import { getExchangeDisplayName } from '../../market-chart/marketList.types'
import type { SettingsRuntimeDocument } from '../settings.types'

type SettingsRuntimeCardProps = {
  runtime: SettingsRuntimeDocument | null
  loading: boolean
  refreshing: boolean
  error?: string | null
  onRefresh: () => void
}

function formatOptionalTimestamp(value: string | null) {
  if (!value) {
    return '기록 없음'
  }

  return value
}

export function SettingsRuntimeCard({
  runtime,
  loading,
  refreshing,
  error,
  onRefresh,
}: SettingsRuntimeCardProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">진단</h3>
          <p className="mt-1 text-sm text-slate-500">
            연결 대상과 거래소별 수집 상태를 확인해요.
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading || refreshing}
          className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 disabled:border-slate-100 disabled:text-slate-400"
        >
          진단 새로고침
        </button>
      </div>

      {runtime ? (
        <>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                환경
              </p>
              <p className="mt-2 text-sm font-medium text-slate-900">
                {runtime.environment}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                백엔드 상태
              </p>
              <p className="mt-2 text-sm font-medium text-slate-900">
                {runtime.backend_status}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                연결 대상
              </p>
              <p className="mt-2 text-sm font-medium text-slate-900">
                {runtime.target}
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            {Object.entries(runtime.exchanges).map(([exchange, status]) => (
              <div
                key={exchange}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
              >
                <p className="text-sm font-semibold text-slate-900">
                  {getExchangeDisplayName(exchange as keyof SettingsRuntimeDocument['exchanges'])}
                </p>
                <dl className="mt-3 space-y-2 text-sm text-slate-600">
                  <div className="flex items-start justify-between gap-3">
                    <dt>stream</dt>
                    <dd className="font-medium text-slate-900">
                      {status.status}
                    </dd>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <dt>구독 마켓</dt>
                    <dd className="font-medium text-slate-900">
                      {status.subscribed_market_count}
                    </dd>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <dt>버퍼 이벤트</dt>
                    <dd className="font-medium text-slate-900">
                      {status.buffered_event_count}
                    </dd>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <dt>마지막 수신</dt>
                    <dd className="text-right">
                      {formatOptionalTimestamp(status.last_received_at)}
                    </dd>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <dt>마지막 flush</dt>
                    <dd className="text-right">
                      {formatOptionalTimestamp(status.last_flushed_at)}
                    </dd>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <dt>오류</dt>
                    <dd className="text-right">
                      {status.last_error ?? '없음'}
                    </dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>
        </>
      ) : null}

      {loading && !runtime ? (
        <p className="mt-4 text-sm text-slate-500">진단 정보를 불러오는 중이에요.</p>
      ) : null}

      {error ? (
        <p className="mt-4 rounded-2xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      ) : null}
    </section>
  )
}
