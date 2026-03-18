import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, vi } from 'vitest'

import { routes } from './router'

function createMarketListResponse(items: Array<Record<string, unknown>>) {
  return {
    start: 0,
    limit: 50,
    total: items.length,
    refreshed_at: '2026-03-17T12:00:00Z',
    items,
  }
}

function createFetchMock({
  healthOk = true,
  marketOk = true,
  marketItems = [],
}: {
  healthOk?: boolean
  marketOk?: boolean
  marketItems?: Array<Record<string, unknown>>
} = {}) {
  return vi.fn().mockImplementation(async (input: string) => {
    if (input.endsWith('/health')) {
      return { ok: healthOk }
    }

    if (input.includes('/api/v1/markets')) {
      if (!marketOk) {
        return { ok: false }
      }

      return {
        ok: true,
        json: async () => createMarketListResponse(marketItems),
      }
    }

    return { ok: true, json: async () => ({}) }
  })
}

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

    renderWithRoute(['/dashboard'])

    const desktopSidebarMenu = screen.getByRole('navigation', {
      name: '데스크톱 사이드바 메뉴',
    })

    expect(
      within(desktopSidebarMenu).getByRole('link', { name: '대시보드' }),
    ).toHaveAttribute('aria-current', 'page')
    expect(within(desktopSidebarMenu).getByText('투자')).toBeInTheDocument()
    expect(within(desktopSidebarMenu).getByText('기타')).toBeInTheDocument()
    expect(
      within(desktopSidebarMenu).getByRole('link', { name: '투자 현황' }),
    ).toBeInTheDocument()
    expect(
      within(desktopSidebarMenu).getByRole('link', { name: '시세 / 차트' }),
    ).toBeInTheDocument()
    expect(
      within(desktopSidebarMenu).getByRole('link', { name: '설정' }),
    ).toBeInTheDocument()
    expect(screen.getByText('상단 영역 - 대시보드')).toBeInTheDocument()
    expect(screen.getByText('상단 앱바 영역 - 대시보드')).toBeInTheDocument()
    expect(screen.getByText('하단 탭 영역')).toBeInTheDocument()
    expect(screen.getAllByText('콘텐츠 영역 - 대시보드')).toHaveLength(2)
    expect(screen.getAllByText(/콘텐츠 영역/)).toHaveLength(2)
    expect(screen.getAllByText(/콘텐츠 영역/)[1]).toHaveClass('flex-1')
    expect(screen.getAllByText(/콘텐츠 영역/)[1]).not.toHaveClass(
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

  it('changes the desktop content area when a sidebar menu is clicked', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', fetchMock)

    renderWithRoute(['/dashboard'])

    const desktopSidebarMenu = screen.getByRole('navigation', {
      name: '데스크톱 사이드바 메뉴',
    })

    fireEvent.click(
      within(desktopSidebarMenu).getByRole('link', { name: '투자 현황' }),
    )

    const desktopLayout = await screen.findByTestId(
      'investment-status-desktop-layout',
    )

    expect(desktopLayout).toBeInTheDocument()
    expect(screen.queryByText('상단 영역 - 투자 현황')).not.toBeInTheDocument()
    expect(
      within(desktopLayout).queryByText('콘텐츠 영역 - 투자 현황'),
    ).not.toBeInTheDocument()
  })

  it('renders the market chart desktop layout when the sidebar menu is clicked', async () => {
    const fetchMock = createFetchMock({
      marketItems: [
        {
          market_listing_id: 1,
          exchange: 'upbit',
          raw_symbol: 'KRW-BTC',
          base_asset: 'BTC',
          quote_asset: 'KRW',
          display_name_ko: '비트코인',
          display_name_en: 'Bitcoin',
          has_warning: false,
          trade_price: '109131000.00000000',
          signed_change_rate: '-0.0084',
          acc_trade_volume_24h: '422181000.00000000',
          event_time: null,
        },
      ],
    })
    vi.stubGlobal('fetch', fetchMock)

    renderWithRoute(['/dashboard'])

    const desktopSidebarMenu = screen.getByRole('navigation', {
      name: '데스크톱 사이드바 메뉴',
    })

    fireEvent.click(
      within(desktopSidebarMenu).getByRole('link', { name: '시세 / 차트' }),
    )

    const desktopHeading = await screen.findByText('상단 영역 - 시세 / 차트')
    const desktopSection = desktopHeading.closest('section') as HTMLElement

    expect(within(desktopSection).getByRole('tab', { name: '업비트' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(within(desktopSection).getByRole('tab', { name: '빗썸' })).toBeInTheDocument()
    expect(within(desktopSection).getByRole('tab', { name: '바이낸스' })).toBeInTheDocument()
    expect(
      within(desktopSection).getByTestId('tradingview-chart-container'),
    ).toBeInTheDocument()
    expect(
      within(desktopSection).getByRole('tab', { name: '원화' }),
    ).toHaveAttribute('aria-selected', 'true')
    expect(within(desktopSection).getByRole('tab', { name: 'BTC' })).toBeInTheDocument()
    expect(
      within(desktopSection).getByRole('tab', { name: 'USDT' }),
    ).toBeInTheDocument()
    expect(within(desktopSection).getByText('종목명')).toBeInTheDocument()
    expect(within(desktopSection).getAllByText('현재가').length).toBeGreaterThan(0)
    expect(within(desktopSection).getAllByText('전일대비').length).toBeGreaterThan(0)
    expect(within(desktopSection).getAllByText('거래대금').length).toBeGreaterThan(0)
    expect(await within(desktopSection).findByText('비트코인')).toBeInTheDocument()
    expect(within(desktopSection).getByText('BTC/KRW')).toBeInTheDocument()
  })

  it('changes the mobile content area when a bottom tab is clicked', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', fetchMock)

    renderWithRoute(['/dashboard'])

    fireEvent.click(
      within(screen.getByText('하단 탭 영역').parentElement as HTMLElement).getByRole(
        'link',
        { name: '투자 현황' },
      ),
    )

    const mobileAppBar = await screen.findByText('상단 앱바 영역 - 투자 현황')
    const mobileSection = mobileAppBar.closest('section') as HTMLElement

    expect(within(mobileSection).getByText('콘텐츠 영역 - 투자 현황')).toBeInTheDocument()
    expect(
      within(mobileSection).queryByTestId('investment-status-desktop-layout'),
    ).not.toBeInTheDocument()
  })

  it('renders the market list area on mobile for the market chart route', async () => {
    const fetchMock = createFetchMock({
      marketItems: [
        {
          market_listing_id: 2,
          exchange: 'upbit',
          raw_symbol: 'KRW-ETH',
          base_asset: 'ETH',
          quote_asset: 'KRW',
          display_name_ko: '이더리움',
          display_name_en: 'Ethereum',
          has_warning: false,
          trade_price: '3426000.00000000',
          signed_change_rate: '-0.0101',
          acc_trade_volume_24h: '351296000.00000000',
          event_time: null,
        },
      ],
    })
    vi.stubGlobal('fetch', fetchMock)

    renderWithRoute(['/market-chart'])

    const mobileAppBar = await screen.findByText('상단 앱바 영역 - 시세 / 차트')
    const mobileSection = mobileAppBar.closest('section') as HTMLElement

    expect(await within(mobileSection).findByText('이더리움')).toBeInTheDocument()
    expect(within(mobileSection).getByText('ETH/KRW')).toBeInTheDocument()
    expect(
      within(mobileSection).queryByText('콘텐츠 영역 - 시세 / 차트'),
    ).not.toBeInTheDocument()
  })

  it('opens the more panel and shows backend status details on mobile', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false })
    vi.stubGlobal('fetch', fetchMock)

    renderWithRoute(['/dashboard'])

    fireEvent.click(await screen.findByRole('button', { name: '더보기 열기' }))

    const morePanel = document.getElementById('mobile-more-panel')

    expect(morePanel).toHaveClass('absolute')
    expect(morePanel).toHaveClass('bottom-28')
    expect(screen.getByText('더보기 패널')).toBeInTheDocument()
    expect(
      within(morePanel as HTMLElement).getByRole('link', { name: '설정' }),
    ).toBeInTheDocument()
    expect(screen.getAllByText('백엔드 대상')).not.toHaveLength(0)
    expect(await screen.findAllByText('오프라인')).not.toHaveLength(0)
  })

  it('closes the more panel when the mobile overlay is clicked', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', fetchMock)

    renderWithRoute(['/dashboard'])

    fireEvent.click(await screen.findByRole('button', { name: '더보기 열기' }))
    fireEvent.click(screen.getByRole('button', { name: '더보기 닫기 오버레이' }))

    expect(screen.queryByText('더보기 패널')).not.toBeInTheDocument()
  })

  it('closes the more panel when a bottom tab is clicked', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', fetchMock)

    renderWithRoute(['/dashboard'])

    fireEvent.click(await screen.findByRole('button', { name: '더보기 열기' }))
    fireEvent.click(
      within(screen.getByText('하단 탭 영역').parentElement as HTMLElement).getByRole(
        'link',
        { name: '대시보드' },
      ),
    )

    expect(screen.queryByText('더보기 패널')).not.toBeInTheDocument()
  })

  it('navigates to the settings page when the settings item in more is clicked', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', fetchMock)

    renderWithRoute(['/dashboard'])

    fireEvent.click(await screen.findByRole('button', { name: '더보기 열기' }))
    fireEvent.click(
      within(document.getElementById('mobile-more-panel') as HTMLElement).getByRole(
        'link',
        { name: '설정' },
      ),
    )

    expect(await screen.findByText('상단 앱바 영역 - 설정')).toBeInTheDocument()
    expect(screen.queryByText('더보기 패널')).not.toBeInTheDocument()
  })

  it('renders the not found page on unknown route', async () => {
    renderWithRoute(['/missing'])

    expect(
      await screen.findByRole('heading', { name: /page not found/i }),
    ).toBeInTheDocument()
  })
})
