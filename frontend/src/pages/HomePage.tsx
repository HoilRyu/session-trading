import { useState } from 'react'
import { NavLink, Outlet, useMatches } from 'react-router'

import {
  BackendStatusCard,
  BackendStatusDot,
  BackendStatusPanel,
} from '../features/backend-status/components/BackendStatus'
import { DesktopSidebarMenu } from '../features/navigation/DesktopSidebarMenu'
import {
  MOBILE_MORE_NAV_ITEMS,
  MOBILE_PRIMARY_NAV_ITEMS,
} from '../features/navigation/navigationItems'
import { useBackendHealth } from '../features/backend-status/useBackendHealth'

type MobileAreaBlockProps = {
  label: string
  className: string
}

function MobileAreaBlock({ label, className }: MobileAreaBlockProps) {
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
  const matches = useMatches()
  const closeMorePanel = () => setIsMoreOpen(false)
  const activeRouteMatch = [...matches].reverse().find((match) => {
    const handle = match.handle as { menuLabel?: unknown } | undefined

    return typeof handle?.menuLabel === 'string'
  })
  const activeMenuLabel =
    (activeRouteMatch?.handle as { menuLabel?: string } | undefined)?.menuLabel ??
    '대시보드'

  return (
    <main className="min-h-screen bg-slate-100">
      <h1 className="sr-only">레이아웃 영역 확인 화면</h1>

      <section className="hidden min-h-screen p-6 md:flex">
        <div className="flex w-full gap-6">
          <aside className="flex w-60 shrink-0 flex-col rounded-3xl bg-slate-800 p-4 text-white">
            <DesktopSidebarMenu />

            <BackendStatusCard status={status} target={target} />
          </aside>

          <Outlet />
        </div>
      </section>

      <section className="relative flex h-screen flex-col gap-4 overflow-hidden p-4 md:hidden">
        <div className="flex h-16 items-center justify-between rounded-3xl bg-slate-300 px-4 text-slate-900">
          <span className="text-base font-semibold">
            {`상단 앱바 영역 - ${activeMenuLabel}`}
          </span>
          <BackendStatusDot status={status} />
        </div>
        <MobileAreaBlock
          label={`콘텐츠 영역 - ${activeMenuLabel}`}
          className="min-h-0 flex-1 bg-sky-200 text-sky-900"
        />
        {isMoreOpen ? (
          <>
            <button
              type="button"
              aria-label="더보기 닫기 오버레이"
              onClick={closeMorePanel}
              className="absolute inset-x-4 top-4 bottom-28 z-10 rounded-[2rem] bg-slate-950/10"
            />

            <div
              id="mobile-more-panel"
              className="absolute right-4 bottom-28 left-4 z-20 rounded-3xl bg-slate-200 p-4 text-slate-900 shadow-lg"
            >
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-sm font-semibold">더보기 패널</h2>
                <button
                  type="button"
                  onClick={closeMorePanel}
                  className="rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-white"
                >
                  닫기
                </button>
              </div>

              <div className="mt-4 rounded-2xl bg-slate-900 px-4 py-3 text-white">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                  기타
                </p>
                <div className="mt-3 flex flex-col gap-2">
                  {MOBILE_MORE_NAV_ITEMS.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={closeMorePanel}
                      className={({ isActive }) =>
                        [
                          'rounded-2xl px-3 py-3 text-sm font-medium transition-colors',
                          isActive
                            ? 'bg-slate-100 text-slate-900'
                            : 'bg-slate-800 text-slate-100',
                        ].join(' ')
                      }
                    >
                      {item.label}
                    </NavLink>
                  ))}
                </div>
              </div>

              <BackendStatusPanel status={status} target={target} />
            </div>
          </>
        ) : null}
        <div className="relative z-30 rounded-3xl bg-slate-800 p-4 text-white">
          <div className="text-center text-sm font-semibold text-slate-300">
            하단 탭 영역
          </div>
          <div className="mt-3 grid grid-cols-4 gap-2 text-center text-sm font-medium">
            {MOBILE_PRIMARY_NAV_ITEMS.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={closeMorePanel}
                className={({ isActive }) =>
                  [
                    'rounded-2xl px-2 py-2',
                    isActive ? 'bg-slate-100 text-slate-900' : 'bg-slate-700',
                  ].join(' ')
                }
              >
                {item.label}
              </NavLink>
            ))}
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
