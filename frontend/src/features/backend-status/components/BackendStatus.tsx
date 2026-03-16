import type { BackendHealthStatus } from '../useBackendHealth'

const BACKEND_STATUS_META: Record<
  BackendHealthStatus,
  {
    label: string
    dotClassName: string
    textClassName: string
  }
> = {
  checking: {
    label: '확인 중',
    dotClassName: 'bg-amber-400',
    textClassName: 'text-amber-100',
  },
  online: {
    label: '온라인',
    dotClassName: 'bg-emerald-400',
    textClassName: 'text-emerald-100',
  },
  offline: {
    label: '오프라인',
    dotClassName: 'bg-rose-400',
    textClassName: 'text-rose-100',
  },
}

type BackendStatusProps = {
  status: BackendHealthStatus
  target: string
}

type BackendStatusDotProps = {
  status: BackendHealthStatus
}

function getStatusMeta(status: BackendHealthStatus) {
  return BACKEND_STATUS_META[status]
}

export function BackendStatusCard({ status, target }: BackendStatusProps) {
  const statusMeta = getStatusMeta(status)

  return (
    <div className="rounded-3xl bg-slate-700/80 p-4">
      <p className="text-sm font-semibold text-slate-100">서버 상태</p>
      <div className="mt-3 flex items-center gap-2">
        <span
          className={`h-3 w-3 rounded-full ${statusMeta.dotClassName}`}
          aria-hidden="true"
        />
        <span className={`text-sm font-medium ${statusMeta.textClassName}`}>
          {statusMeta.label}
        </span>
      </div>
      <p className="mt-3 text-xs font-medium text-slate-300">백엔드 대상</p>
      <p className="mt-1 text-xs text-slate-100">{target}</p>
    </div>
  )
}

export function BackendStatusDot({ status }: BackendStatusDotProps) {
  const statusMeta = getStatusMeta(status)

  return (
    <div
      className="flex items-center gap-2"
      aria-label="모바일 서버 상태 점"
      data-status={status}
    >
      <span
        className={`h-3 w-3 rounded-full ${statusMeta.dotClassName}`}
        aria-hidden="true"
      />
      <span className="sr-only">{statusMeta.label}</span>
    </div>
  )
}

export function BackendStatusPanel({ status, target }: BackendStatusProps) {
  const statusMeta = getStatusMeta(status)

  return (
    <div className="mt-4 rounded-2xl bg-white p-4 shadow-sm">
      <p className="text-sm font-semibold text-slate-900">서버 상태</p>
      <div className="mt-3 flex items-center gap-2">
        <span
          className={`h-3 w-3 rounded-full ${statusMeta.dotClassName}`}
          aria-hidden="true"
        />
        <span className="text-sm font-medium text-slate-800">
          {statusMeta.label}
        </span>
      </div>
      <p className="mt-3 text-xs font-medium text-slate-500">백엔드 대상</p>
      <p className="mt-1 text-xs text-slate-700">{target}</p>
    </div>
  )
}
