type SidebarMenuItem = {
  label: string
  isActive?: boolean
}

type SidebarMenuSection = {
  title: string
  items: SidebarMenuItem[]
}

const SIDEBAR_MENU_SECTIONS: SidebarMenuSection[] = [
  {
    title: '대시보드',
    items: [{ label: '대시보드', isActive: true }],
  },
  {
    title: '투자',
    items: [{ label: '투자 현황' }, { label: '시세 / 차트' }],
  },
  {
    title: '기타',
    items: [{ label: '설정' }],
  },
]

export function DesktopSidebarMenu() {
  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-4 shadow-[0_16px_40px_rgba(15,23,42,0.24)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
          Navigation
        </p>
        <p className="mt-2 text-lg font-semibold text-slate-50">Session Trading</p>
        <p className="mt-1 text-sm text-slate-400">
          데스크톱 메뉴 골격을 먼저 확인하는 단계예요.
        </p>
      </div>

      <nav aria-label="데스크톱 사이드바 메뉴" className="flex flex-1 flex-col gap-5">
        {SIDEBAR_MENU_SECTIONS.map((section) => (
          <div key={section.title}>
            <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400/85">
              {section.title}
            </p>

            <div className="mt-2 flex flex-col gap-2">
              {section.items.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  aria-current={item.isActive ? 'page' : undefined}
                  className={[
                    'flex w-full items-center justify-between rounded-2xl border px-3 py-3 text-left text-sm font-medium transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/60',
                    item.isActive
                      ? 'border-slate-100/80 bg-slate-100 text-slate-900 shadow-[0_14px_32px_rgba(241,245,249,0.2)]'
                      : 'border-white/6 bg-slate-700/35 text-slate-100 hover:bg-slate-700/55',
                  ].join(' ')}
                >
                  <span>{item.label}</span>
                  <span
                    aria-hidden="true"
                    className={[
                      'h-2.5 w-2.5 rounded-full',
                      item.isActive ? 'bg-sky-500' : 'bg-slate-500',
                    ].join(' ')}
                  />
                </button>
              ))}
            </div>
          </div>
        ))}
      </nav>
    </div>
  )
}
