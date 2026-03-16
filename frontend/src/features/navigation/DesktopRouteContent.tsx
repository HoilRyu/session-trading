type DesktopRouteContentProps = {
  menuLabel: string
}

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

export function DesktopRouteContent({ menuLabel }: DesktopRouteContentProps) {
  return (
    <div className="flex min-h-[calc(100vh-3rem)] flex-1 flex-col gap-6">
      <AreaBlock
        label={`상단 영역 - ${menuLabel}`}
        className="h-20 bg-slate-300 text-slate-900"
      />
      <AreaBlock
        label={`콘텐츠 영역 - ${menuLabel}`}
        className="min-h-[24rem] flex-1 bg-sky-200 text-sky-900"
      />
    </div>
  )
}
