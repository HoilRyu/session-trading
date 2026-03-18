import { act, renderHook } from '@testing-library/react'

import { useMarketChartDefaults } from './useMarketChartDefaults'

type HookSettings = Parameters<typeof useMarketChartDefaults>[0]
type HookProps = { settings: HookSettings }

describe('useMarketChartDefaults', () => {
  it('초기 settings가 있으면 첫 렌더부터 해당 값을 사용한다', () => {
    const { result } = renderHook(() => {
      return useMarketChartDefaults({
        general: {
          default_exchange: 'binance',
        },
        market_data: {
          default_quote: 'BTC',
          default_order_by: 'trade_amount_24h',
          default_order_dir: 'desc',
          poll_interval_ms: 2500,
          auto_refresh_enabled: false,
          page_size: 20,
          exchanges: {
            upbit: { enabled: false },
            bithumb: { enabled: false },
            binance: { enabled: true },
          },
        },
        chart: {
          default_exchange: 'binance',
          default_symbol: 'BTCUSDT',
          default_interval: '240',
          theme: 'dark',
          show_volume: false,
        },
      })
    })

    expect(result.current.activeExchange).toBe('binance')
    expect(result.current.activeQuote).toBe('BTC')
    expect(result.current.sortState).toEqual({
      orderBy: 'trade_amount_24h',
      orderDir: 'desc',
    })
    expect(result.current.pageSize).toBe(20)
    expect(result.current.enabledExchanges).toEqual(['binance'])
    expect(result.current.pollIntervalMs).toBe(2500)
    expect(result.current.autoRefreshEnabled).toBe(false)
    expect(result.current.chartInterval).toBe('240')
    expect(result.current.chartTheme).toBe('dark')
    expect(result.current.showVolume).toBe(false)
    expect(result.current.defaultChartSymbol).toBe('BINANCE:BTCUSDT')
  })

  it('settings 문서가 늦게 와도 기본값을 최초 1회 적용한다', () => {
    const { result, rerender } = renderHook(
      ({ settings }: HookProps) => useMarketChartDefaults(settings),
      {
        initialProps: {
          settings: null as HookSettings,
        } satisfies HookProps,
      },
    )

    expect(result.current.activeExchange).toBe('upbit')
    expect(result.current.activeQuote).toBe('KRW')
    expect(result.current.sortState).toEqual({ orderBy: 'name', orderDir: 'asc' })
    expect(result.current.pageSize).toBe(50)
    expect(result.current.enabledExchanges).toEqual(['upbit', 'bithumb', 'binance'])
    expect(result.current.pollIntervalMs).toBe(1000)
    expect(result.current.autoRefreshEnabled).toBe(true)
    expect(result.current.chartInterval).toBe('60')
    expect(result.current.chartTheme).toBe('light')
    expect(result.current.showVolume).toBe(true)

    rerender({
      settings: {
        general: {
          default_exchange: 'binance',
        },
        market_data: {
          default_quote: 'BTC',
          default_order_by: 'trade_amount_24h',
          default_order_dir: 'desc',
          poll_interval_ms: 2500,
          auto_refresh_enabled: false,
          page_size: 20,
          exchanges: {
            upbit: { enabled: false },
            bithumb: { enabled: false },
            binance: { enabled: true },
          },
        },
        chart: {
          default_interval: '240',
          theme: 'dark',
          show_volume: false,
        },
      } satisfies NonNullable<HookSettings>,
    })

    expect(result.current.activeExchange).toBe('binance')
    expect(result.current.activeQuote).toBe('BTC')
    expect(result.current.sortState).toEqual({
      orderBy: 'trade_amount_24h',
      orderDir: 'desc',
    })
    expect(result.current.pageSize).toBe(20)
    expect(result.current.enabledExchanges).toEqual(['binance'])
    expect(result.current.pollIntervalMs).toBe(2500)
    expect(result.current.autoRefreshEnabled).toBe(false)
    expect(result.current.chartInterval).toBe('240')
    expect(result.current.chartTheme).toBe('dark')
    expect(result.current.showVolume).toBe(false)
  })

  it('사용자가 먼저 바꾼 거래소와 quote는 늦은 settings 응답이 덮어쓰지 않는다', () => {
    const { result, rerender } = renderHook(
      ({ settings }: HookProps) => useMarketChartDefaults(settings),
      {
        initialProps: {
          settings: null as HookSettings,
        } satisfies HookProps,
      },
    )

    act(() => {
      result.current.setActiveExchange('binance')
    })
    act(() => {
      result.current.setActiveQuote('BTC')
    })

    rerender({
      settings: {
        general: {
          default_exchange: 'bithumb',
        },
        market_data: {
          default_quote: 'KRW',
          default_order_by: 'change_rate',
          default_order_dir: 'desc',
          poll_interval_ms: 3000,
          auto_refresh_enabled: false,
          page_size: 30,
          exchanges: {
            upbit: { enabled: false },
            bithumb: { enabled: false },
            binance: { enabled: true },
          },
        },
        chart: {
          default_interval: '15',
          theme: 'dark',
          show_volume: false,
        },
      } satisfies NonNullable<HookSettings>,
    })

    expect(result.current.activeExchange).toBe('binance')
    expect(result.current.activeQuote).toBe('BTC')
    expect(result.current.sortState).toEqual({
      orderBy: 'change_rate',
      orderDir: 'desc',
    })
    expect(result.current.pageSize).toBe(30)
    expect(result.current.enabledExchanges).toEqual(['binance'])
    expect(result.current.pollIntervalMs).toBe(3000)
    expect(result.current.autoRefreshEnabled).toBe(false)
    expect(result.current.chartInterval).toBe('15')
    expect(result.current.chartTheme).toBe('dark')
    expect(result.current.showVolume).toBe(false)
  })

  it('처음 적용된 settings 이후에 들어온 새 문서는 현재 값을 다시 바꾸지 않는다', () => {
    const initialSettings: NonNullable<HookSettings> = {
      general: {
        default_exchange: 'bithumb',
      },
      market_data: {
        default_quote: 'BTC',
        default_order_by: 'price',
        default_order_dir: 'desc',
        poll_interval_ms: 4000,
        auto_refresh_enabled: false,
        page_size: 40,
        exchanges: {
          upbit: { enabled: false },
          bithumb: { enabled: true },
          binance: { enabled: true },
        },
      },
      chart: {
        default_interval: '30',
        theme: 'dark',
          show_volume: false,
        },
    }

    const { result, rerender } = renderHook(
      ({ settings }: HookProps) => useMarketChartDefaults(settings),
      {
        initialProps: {
          settings: initialSettings,
        },
      },
    )

    rerender({
      settings: {
        general: {
          default_exchange: 'binance',
        },
        market_data: {
          default_quote: 'USDT',
          default_order_by: 'trade_amount_24h',
          default_order_dir: 'desc',
          poll_interval_ms: 1500,
          auto_refresh_enabled: true,
          page_size: 25,
          exchanges: {
            upbit: { enabled: true },
            bithumb: { enabled: true },
            binance: { enabled: true },
          },
        },
        chart: {
          default_interval: '240',
          theme: 'light',
          show_volume: true,
        },
      } satisfies NonNullable<HookSettings>,
    })

    expect(result.current.activeExchange).toBe('bithumb')
    expect(result.current.activeQuote).toBe('BTC')
    expect(result.current.sortState).toEqual({
      orderBy: 'price',
      orderDir: 'desc',
    })
    expect(result.current.pageSize).toBe(40)
    expect(result.current.enabledExchanges).toEqual(['bithumb', 'binance'])
    expect(result.current.pollIntervalMs).toBe(4000)
    expect(result.current.autoRefreshEnabled).toBe(false)
    expect(result.current.chartInterval).toBe('30')
    expect(result.current.chartTheme).toBe('dark')
    expect(result.current.showVolume).toBe(false)
  })

  it('사용자가 거래소를 바꾸면 차트 기본 심볼도 해당 거래소 기준으로 초기화한다', () => {
    const { result } = renderHook(() => {
      return useMarketChartDefaults({
        general: {
          default_exchange: 'upbit',
        },
        market_data: {
          default_quote: 'KRW',
          poll_interval_ms: 1000,
          auto_refresh_enabled: true,
        },
        chart: {
          default_exchange: 'upbit',
          default_symbol: 'KRW-BTC',
          default_interval: '60',
          theme: 'light',
          show_volume: true,
        },
      })
    })

    expect(result.current.defaultChartSymbol).toBe('UPBIT:BTCKRW')

    act(() => {
      result.current.setActiveExchange('bithumb')
    })

    expect(result.current.activeExchange).toBe('bithumb')
    expect(result.current.defaultChartSymbol).toBe('BITHUMB:BTCKRW')

    act(() => {
      result.current.setActiveExchange('binance')
    })

    expect(result.current.activeExchange).toBe('binance')
    expect(result.current.defaultChartSymbol).toBe('BINANCE:BTCUSDT')
  })
})
