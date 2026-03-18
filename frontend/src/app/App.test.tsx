import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, beforeEach, vi } from 'vitest'

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
  settingsOk = true,
  runtimeOk = true,
  settingsDocument = null,
}: {
  healthOk?: boolean
  marketOk?: boolean
  marketItems?: Array<Record<string, unknown>>
  settingsOk?: boolean
  runtimeOk?: boolean
  settingsDocument?: Record<string, unknown> | null
} = {}) {
  const effectiveSettingsDocument =
    settingsDocument ?? {
      general: {
        default_exchange: 'upbit',
        default_route: '/market-chart',
      },
      market_data: {
        default_quote: 'KRW',
        default_order_by: 'trade_amount_24h',
        default_order_dir: 'desc',
        poll_interval_ms: 1000,
        auto_refresh_enabled: true,
        page_size: 50,
        exchanges: {
          upbit: { enabled: true },
          bithumb: { enabled: true },
          binance: { enabled: true },
        },
      },
      chart: {
        default_exchange: 'upbit',
        default_symbol: 'KRW-BTC',
        default_interval: '60',
        theme: 'light',
        show_volume: true,
        price_format_mode: 'auto',
      },
      ops: {
        market_sync_on_boot: false,
        exchanges: {
          upbit: { auto_start: false, ticker_enabled: true },
          bithumb: { auto_start: false, ticker_enabled: true },
          binance: { auto_start: false, ticker_enabled: true },
        },
      },
    }

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

    if (input.endsWith('/api/v1/settings')) {
      if (!settingsOk) {
        return { ok: false }
      }

      return {
        ok: true,
        json: async () => effectiveSettingsDocument,
      }
    }

    if (input.endsWith('/api/v1/settings/runtime')) {
      if (!runtimeOk) {
        return { ok: false }
      }

      return {
        ok: true,
        json: async () => ({
          environment: 'local',
          backend_status: healthOk ? 'online' : 'offline',
          target: '127.0.0.1:8000',
          exchanges: {
            upbit: {
              status: 'running',
              subscribed_market_count: 3,
              buffered_event_count: 1,
              last_error: null,
              last_received_at: '2026-03-18T04:00:00Z',
              last_flushed_at: '2026-03-18T04:00:00Z',
            },
            bithumb: {
              status: 'stopped',
              subscribed_market_count: 0,
              buffered_event_count: 0,
              last_error: 'not started',
              last_received_at: null,
              last_flushed_at: null,
            },
            binance: {
              status: 'running',
              subscribed_market_count: 3,
              buffered_event_count: 1,
              last_error: null,
              last_received_at: '2026-03-18T04:00:00Z',
              last_flushed_at: '2026-03-18T04:00:00Z',
            },
          },
        }),
      }
    }

    return { ok: true, json: async () => ({}) }
  })
}

function renderWithRoute(initialEntries: string[]) {
  const router = createMemoryRouter(routes, { initialEntries })

  return render(<RouterProvider router={router} />)
}

function setViewportWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    writable: true,
    value: width,
  })
  window.dispatchEvent(new Event('resize'))
}

beforeEach(() => {
  setViewportWidth(1280)
})

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
    expect(screen.queryByText('상단 영역 - 대시보드')).not.toBeInTheDocument()
    const desktopLayout = screen.getByTestId('dashboard-desktop-layout')

    expect(within(desktopLayout).getByText('Dashboard Header')).toBeInTheDocument()
    expect(within(desktopLayout).getByText('Summary 01')).toBeInTheDocument()
    expect(within(desktopLayout).getByText('Primary Panel')).toBeInTheDocument()
    const mobileAppBar = screen.getByText('상단 앱바 영역 - 대시보드')
    const mobileSection = mobileAppBar.closest('section') as HTMLElement

    expect(mobileAppBar).toBeInTheDocument()
    expect(screen.getByText('하단 탭 영역')).toBeInTheDocument()
    expect(within(mobileSection).getByText('콘텐츠 영역 - 대시보드')).toBeInTheDocument()
    expect(
      within(mobileSection).queryByTestId('dashboard-mobile-layout'),
    ).not.toBeInTheDocument()
    expect(within(mobileSection).queryByText('Summary 01')).not.toBeInTheDocument()
    expect(within(mobileSection).queryByText('Wide Panel B')).not.toBeInTheDocument()

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

  it('applies saved settings to the desktop market chart route', async () => {
    const fetchMock = createFetchMock({
      settingsDocument: {
        general: {
          default_exchange: 'binance',
          default_route: '/market-chart',
        },
        market_data: {
          default_quote: 'BTC',
          default_order_by: 'trade_amount_24h',
          default_order_dir: 'desc',
          poll_interval_ms: 1500,
          auto_refresh_enabled: false,
          page_size: 50,
          exchanges: {
            upbit: { enabled: true },
            bithumb: { enabled: true },
            binance: { enabled: true },
          },
        },
        chart: {
          default_exchange: 'binance',
          default_symbol: 'BTCUSDT',
          default_interval: '240',
          theme: 'dark',
          show_volume: false,
          price_format_mode: 'auto',
        },
        ops: {
          market_sync_on_boot: false,
          exchanges: {
            upbit: { auto_start: false, ticker_enabled: true },
            bithumb: { auto_start: false, ticker_enabled: true },
            binance: { auto_start: false, ticker_enabled: true },
          },
        },
      },
      marketItems: [
        {
          market_listing_id: 7,
          exchange: 'binance',
          raw_symbol: 'ETHBTC',
          base_asset: 'ETH',
          quote_asset: 'BTC',
          display_name_ko: '이더리움',
          display_name_en: 'Ethereum',
          has_warning: false,
          trade_price: '0.05230000',
          signed_change_rate: '0.0123',
          acc_trade_volume_24h: '1111.11110000',
          acc_trade_price_24h: '4321.12340000',
          event_time: null,
        },
      ],
    })
    vi.stubGlobal('fetch', fetchMock)

    renderWithRoute(['/market-chart'])

    const desktopSection = (await screen.findByText('상단 영역 - 시세 / 차트')).closest(
      'section',
    ) as HTMLElement

    await waitFor(() => {
      expect(
        within(desktopSection).getByRole('tab', { name: '바이낸스' }),
      ).toHaveAttribute('aria-selected', 'true')
      expect(within(desktopSection).getByRole('tab', { name: 'BTC' })).toHaveAttribute(
        'aria-selected',
        'true',
      )
    })

    const marketRequests = fetchMock.mock.calls
      .map(([input]) => String(input))
      .filter((input) => input.includes('/api/v1/markets'))
    const settingsRequests = fetchMock.mock.calls
      .map(([input]) => String(input))
      .filter((input) => input.endsWith('/api/v1/settings'))

    expect(settingsRequests).toHaveLength(1)
    expect(marketRequests).toHaveLength(1)
    marketRequests.forEach((requestUrl) => {
      expect(requestUrl).toContain('exchange=binance')
      expect(requestUrl).toContain('quote=BTC')
      expect(requestUrl).toContain('order_by=trade_amount_24h')
      expect(requestUrl).toContain('order_dir=desc')
      expect(requestUrl).toContain('limit=50')
    })
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
    setViewportWidth(375)

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

  it('applies saved settings to the mobile market chart route', async () => {
    setViewportWidth(375)

    const fetchMock = createFetchMock({
      settingsDocument: {
        general: {
          default_exchange: 'binance',
          default_route: '/market-chart',
        },
        market_data: {
          default_quote: 'BTC',
          default_order_by: 'trade_amount_24h',
          default_order_dir: 'desc',
          poll_interval_ms: 2000,
          auto_refresh_enabled: false,
          page_size: 50,
          exchanges: {
            upbit: { enabled: true },
            bithumb: { enabled: true },
            binance: { enabled: true },
          },
        },
        chart: {
          default_exchange: 'binance',
          default_symbol: 'BTCUSDT',
          default_interval: '60',
          theme: 'light',
          show_volume: true,
          price_format_mode: 'auto',
        },
        ops: {
          market_sync_on_boot: false,
          exchanges: {
            upbit: { auto_start: false, ticker_enabled: true },
            bithumb: { auto_start: false, ticker_enabled: true },
            binance: { auto_start: false, ticker_enabled: true },
          },
        },
      },
      marketItems: [
        {
          market_listing_id: 11,
          exchange: 'binance',
          raw_symbol: 'SOLBTC',
          base_asset: 'SOL',
          quote_asset: 'BTC',
          display_name_ko: '솔라나',
          display_name_en: 'Solana',
          has_warning: false,
          trade_price: '0.00123000',
          signed_change_rate: '-0.0201',
          acc_trade_volume_24h: '8888.00000000',
          acc_trade_price_24h: '456.78000000',
          event_time: null,
        },
      ],
    })
    vi.stubGlobal('fetch', fetchMock)

    renderWithRoute(['/market-chart'])

    const mobileSection = (await screen.findByText('상단 앱바 영역 - 시세 / 차트')).closest(
      'section',
    ) as HTMLElement

    await waitFor(() =>
      expect(
        within(mobileSection).getByRole('tab', { name: '바이낸스' }),
      ).toHaveAttribute('aria-selected', 'true'),
    )
    await waitFor(() =>
      expect(within(mobileSection).getByRole('tab', { name: 'BTC' })).toHaveAttribute(
        'aria-selected',
        'true',
      ),
    )

    const marketRequests = fetchMock.mock.calls
      .map(([input]) => String(input))
      .filter((input) => input.includes('/api/v1/markets'))
    const settingsRequests = fetchMock.mock.calls
      .map(([input]) => String(input))
      .filter((input) => input.endsWith('/api/v1/settings'))

    expect(settingsRequests).toHaveLength(1)
    expect(marketRequests).toHaveLength(1)
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
    setViewportWidth(375)

    const fetchMock = createFetchMock()
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
    expect(await screen.findAllByText('일반')).not.toHaveLength(0)
    expect(screen.getAllByText('마켓 데이터')).not.toHaveLength(0)
    expect(screen.getAllByText('차트')).not.toHaveLength(0)
    expect(screen.getAllByText('운영 제어')).not.toHaveLength(0)
    expect(screen.getAllByText('진단')).not.toHaveLength(0)
    expect(screen.queryByText('더보기 패널')).not.toBeInTheDocument()

    const settingsRequests = fetchMock.mock.calls
      .map(([input]) => String(input))
      .filter((input) => input.endsWith('/api/v1/settings'))
    const runtimeRequests = fetchMock.mock.calls
      .map(([input]) => String(input))
      .filter((input) => input.endsWith('/api/v1/settings/runtime'))

    expect(settingsRequests).toHaveLength(1)
    expect(runtimeRequests).toHaveLength(1)
  })

  it('renders the settings cards on desktop route', async () => {
    const fetchMock = createFetchMock()
    vi.stubGlobal('fetch', fetchMock)

    renderWithRoute(['/settings'])

    expect(await screen.findByRole('heading', { name: '설정' })).toBeInTheDocument()
    expect(screen.getAllByText('일반')).not.toHaveLength(0)
    expect(screen.getAllByText('마켓 데이터')).not.toHaveLength(0)
    expect(screen.getAllByText('차트')).not.toHaveLength(0)
    expect(screen.getAllByText('운영 제어')).not.toHaveLength(0)
    expect(screen.getAllByText('진단')).not.toHaveLength(0)

    const settingsRequests = fetchMock.mock.calls
      .map(([input]) => String(input))
      .filter((input) => input.endsWith('/api/v1/settings'))
    const runtimeRequests = fetchMock.mock.calls
      .map(([input]) => String(input))
      .filter((input) => input.endsWith('/api/v1/settings/runtime'))

    expect(settingsRequests).toHaveLength(1)
    expect(runtimeRequests).toHaveLength(1)
  })

  it('redirects the root route to the saved default route', async () => {
    const fetchMock = createFetchMock({
      settingsDocument: {
        general: {
          default_exchange: 'upbit',
          default_route: '/settings',
        },
        market_data: {
          default_quote: 'KRW',
          default_order_by: 'trade_amount_24h',
          default_order_dir: 'desc',
          poll_interval_ms: 1000,
          auto_refresh_enabled: true,
          page_size: 50,
          exchanges: {
            upbit: { enabled: true },
            bithumb: { enabled: true },
            binance: { enabled: true },
          },
        },
        chart: {
          default_exchange: 'upbit',
          default_symbol: 'KRW-BTC',
          default_interval: '60',
          theme: 'light',
          show_volume: true,
          price_format_mode: 'auto',
        },
        ops: {
          market_sync_on_boot: false,
          exchanges: {
            upbit: { auto_start: false, ticker_enabled: true },
            bithumb: { auto_start: false, ticker_enabled: true },
            binance: { auto_start: false, ticker_enabled: true },
          },
        },
      },
    })
    vi.stubGlobal('fetch', fetchMock)

    renderWithRoute(['/'])

    expect(await screen.findByRole('heading', { name: '설정' })).toBeInTheDocument()
  })

  it('renders the not found page on unknown route', async () => {
    renderWithRoute(['/missing'])

    expect(
      await screen.findByRole('heading', { name: /page not found/i }),
    ).toBeInTheDocument()
  })
})
