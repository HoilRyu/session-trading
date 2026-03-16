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
  return (
    <main className="min-h-screen bg-slate-100">
      <h1 className="sr-only">레이아웃 영역 확인 화면</h1>

      <section className="hidden min-h-screen p-6 md:flex">
        <div className="flex w-full gap-6">
          <AreaBlock
            label="사이드바"
            className="w-60 shrink-0 bg-slate-800 text-white"
          />

          <div className="flex min-h-[calc(100vh-3rem)] flex-1 flex-col gap-6">
            <AreaBlock label="상단 영역" className="h-20 bg-slate-300 text-slate-900" />
            <AreaBlock
              label="콘텐츠 영역"
              className="min-h-[24rem] flex-1 bg-sky-200 text-sky-900"
            />
          </div>
        </div>
      </section>

      <section className="flex min-h-screen flex-col gap-4 p-4 md:hidden">
        <AreaBlock
          label="상단 앱바 영역"
          className="h-16 bg-slate-300 text-slate-900"
        />
        <AreaBlock
          label="콘텐츠 영역"
          className="min-h-[calc(100vh-10rem)] flex-1 bg-sky-200 text-sky-900"
        />
        <AreaBlock
          label="하단 탭 영역"
          className="h-20 bg-slate-800 text-white"
        />
      </section>
    </main>
  )
}
