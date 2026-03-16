import { useState } from 'react'

import {
  BackendStatusCard,
  BackendStatusDot,
  BackendStatusPanel,
} from '../features/backend-status/components/BackendStatus'
import { useBackendHealth } from '../features/backend-status/useBackendHealth'

type AreaBlockProps = {
  label: string
  className: string
}

function AreaBlock({ label, className }: AreaBlockProps) {
  return (
    <div
      className={`flex items-center justify-center rounded-3xl text-center text-lg font-semibold md:text-xl ${className}`}
    >
      {label}
    </div>
  )
}

export function HomePage() {
  const [isMoreOpen, setIsMoreOpen] = useState(false)
  const { status, target } = useBackendHealth()

  return (
    <main className="min-h-screen bg-slate-100">
      <h1 className="sr-only">레이아웃 영역 확인 화면</h1>

      <section className="hidden min-h-screen p-6 md:flex">
        <div className="flex w-full gap-6">
          <aside className="flex w-60 shrink-0 flex-col rounded-3xl bg-slate-800 p-4 text-white">
            <div className="flex flex-1 items-center justify-center text-center text-lg font-semibold md:text-xl">
              사이드바
            </div>

            <BackendStatusCard status={status} target={target} />
          </aside>

          <div className="flex min-h-[calc(100vh-3rem)] flex-1 flex-col gap-6">
            <AreaBlock label="상단 영역" className="h-20 bg-slate-300 text-slate-900" />
            <AreaBlock
              label="콘텐츠 영역"
              className="min-h-[24rem] flex-1 bg-sky-200 text-sky-900"
            />
          </div>
        </div>
      </section>

      <section className="flex h-screen flex-col gap-4 overflow-hidden p-4 md:hidden">
        <div className="flex h-16 items-center justify-between rounded-3xl bg-slate-300 px-4 text-slate-900">
          <span className="text-base font-semibold">상단 앱바 영역</span>
          <BackendStatusDot status={status} />
        </div>
        <AreaBlock
          label="콘텐츠 영역"
          className="min-h-0 flex-1 bg-sky-200 text-sky-900"
        />
        {isMoreOpen ? (
          <div
            id="mobile-more-panel"
            className="rounded-3xl bg-slate-200 p-4 text-slate-900"
          >
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-sm font-semibold">더보기 패널</h2>
              <button
                type="button"
                onClick={() => setIsMoreOpen(false)}
                className="rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-white"
              >
                닫기
              </button>
            </div>

            <BackendStatusPanel status={status} target={target} />
          </div>
        ) : null}
        <div className="rounded-3xl bg-slate-800 p-4 text-white">
          <div className="text-center text-sm font-semibold text-slate-300">
            하단 탭 영역
          </div>
          <div className="mt-3 grid grid-cols-4 gap-2 text-center text-sm font-medium">
            <div className="rounded-2xl bg-slate-700 px-2 py-2">대시보드</div>
            <div className="rounded-2xl bg-slate-700 px-2 py-2">투자 현황</div>
            <div className="rounded-2xl bg-slate-700 px-2 py-2">시세 / 차트</div>
            <button
              type="button"
              aria-label="더보기 열기"
              aria-controls="mobile-more-panel"
              aria-expanded={isMoreOpen}
              onClick={() => setIsMoreOpen((current) => !current)}
              className="rounded-2xl bg-slate-600 px-2 py-2"
            >
              더보기
            </button>
          </div>
        </div>
      </section>
    </main>
  )
}
