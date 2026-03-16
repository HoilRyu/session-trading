import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { createMemoryRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { afterEach, vi } from 'vitest'

import { routes } from './router'

function renderWithRoute(initialEntries: string[]) {
  const router = createMemoryRouter(routes, { initialEntries })

  return render(<RouterProvider router={router} />)
}

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('App routing', () => {
  it('polls backend health every second and renders status indicators on the home page', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true })
    const setIntervalSpy = vi.spyOn(window, 'setInterval')
    vi.stubGlobal('fetch', fetchMock)

    renderWithRoute(['/'])

    const desktopSidebarMenu = screen.getByRole('navigation', {
      name: '데스크톱 사이드바 메뉴',
    })

    expect(within(desktopSidebarMenu).getAllByText('대시보드')).toHaveLength(2)
    expect(within(desktopSidebarMenu).getByText('투자')).toBeInTheDocument()
    expect(within(desktopSidebarMenu).getByText('기타')).toBeInTheDocument()
    expect(
      within(desktopSidebarMenu).getByRole('button', { name: '대시보드' }),
    ).toHaveAttribute('aria-current', 'page')
    expect(
      within(desktopSidebarMenu).getByRole('button', { name: '투자 현황' }),
    ).toBeInTheDocument()
    expect(
      within(desktopSidebarMenu).getByRole('button', { name: '시세 / 차트' }),
    ).toBeInTheDocument()
    expect(
      within(desktopSidebarMenu).getByRole('button', { name: '설정' }),
    ).toBeInTheDocument()
    expect(screen.getByText('상단 영역')).toBeInTheDocument()
    expect(screen.getByText('상단 앱바 영역')).toBeInTheDocument()
    expect(screen.getByText('하단 탭 영역')).toBeInTheDocument()
    expect(screen.getAllByText('콘텐츠 영역')).toHaveLength(2)
    expect(screen.getAllByText('콘텐츠 영역')[1]).toHaveClass('flex-1')
    expect(screen.getAllByText('콘텐츠 영역')[1]).not.toHaveClass(
      'min-h-[calc(100vh-10rem)]',
    )

    expect(screen.getByText('서버 상태')).toBeInTheDocument()
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    expect(fetchMock).toHaveBeenCalledWith('http://127.0.0.1:8000/health')
    expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 1000)
    expect(await screen.findAllByText('온라인')).not.toHaveLength(0)
    expect(screen.getByLabelText('모바일 서버 상태 점')).toHaveAttribute(
      'data-status',
      'online',
    )
  })

  it('opens the more panel and shows backend status details on mobile', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false })
    vi.stubGlobal('fetch', fetchMock)

    renderWithRoute(['/'])

    fireEvent.click(await screen.findByRole('button', { name: '더보기 열기' }))

    const morePanel = document.getElementById('mobile-more-panel')

    expect(morePanel).toHaveClass('absolute')
    expect(morePanel).toHaveClass('bottom-28')
    expect(screen.getByText('더보기 패널')).toBeInTheDocument()
    expect(screen.getAllByText('백엔드 대상')).not.toHaveLength(0)
    expect(await screen.findAllByText('오프라인')).not.toHaveLength(0)
  })

  it('closes the more panel when the mobile overlay is clicked', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', fetchMock)

    renderWithRoute(['/'])

    fireEvent.click(await screen.findByRole('button', { name: '더보기 열기' }))
    fireEvent.click(screen.getByRole('button', { name: '더보기 닫기 오버레이' }))

    expect(screen.queryByText('더보기 패널')).not.toBeInTheDocument()
  })

  it('closes the more panel when a bottom tab is clicked', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', fetchMock)

    renderWithRoute(['/'])

    fireEvent.click(await screen.findByRole('button', { name: '더보기 열기' }))
    fireEvent.click(
      within(screen.getByText('하단 탭 영역').parentElement as HTMLElement).getByRole(
        'button',
        { name: '대시보드' },
      ),
    )

    expect(screen.queryByText('더보기 패널')).not.toBeInTheDocument()
  })

  it('renders the not found page on unknown route', async () => {
    renderWithRoute(['/missing'])

    expect(
      await screen.findByRole('heading', { name: /page not found/i }),
    ).toBeInTheDocument()
  })
})
