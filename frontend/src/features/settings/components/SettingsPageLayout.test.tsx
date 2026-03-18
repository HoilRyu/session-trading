import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type {
  ServerSettingsDocument,
  SettingsOperationStateMap,
  SettingsRuntimeDocument,
} from '../settings.types'
import { SettingsPageLayout } from './SettingsPageLayout'

const settingsFixture: ServerSettingsDocument = {
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

const runtimeFixture: SettingsRuntimeDocument = {
  environment: 'local',
  backend_status: 'online',
  target: '127.0.0.1:8000',
  exchanges: {
    upbit: {
      status: 'running',
      subscribed_market_count: 3,
      buffered_event_count: 1,
      last_error: null,
      last_received_at: '2026-03-18T03:59:59Z',
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
      last_received_at: '2026-03-18T03:59:58Z',
      last_flushed_at: '2026-03-18T04:00:00Z',
    },
  },
}

const actionStates: SettingsOperationStateMap = {
  'market-sync': {
    status: 'success',
    message: '동기화 완료',
  },
  'start:upbit': {
    status: 'pending',
    message: null,
  },
}

describe('SettingsPageLayout', () => {
  it('데스크톱에서 모든 카드와 섹션 복원 버튼을 렌더링한다', () => {
    render(
      <SettingsPageLayout
        variant="desktop"
        draft={settingsFixture}
        dirtySections={{ general: true }}
        sectionErrors={{ general: '저장 실패' }}
        saveStatus="error"
        saveMessage="설정을 저장하지 못했어요."
        lastSavedAt="2026-03-18T04:10:00Z"
        runtime={runtimeFixture}
        runtimeLoading={false}
        runtimeRefreshing={false}
        runtimeError={null}
        actionStates={actionStates}
        onGeneralChange={vi.fn()}
        onMarketDataChange={vi.fn()}
        onChartChange={vi.fn()}
        onOpsChange={vi.fn()}
        onSave={vi.fn()}
        onResetSection={vi.fn()}
        onRefreshRuntime={vi.fn()}
        onRunMarketSync={vi.fn()}
        onStartExchangeStream={vi.fn()}
        onStopExchangeStream={vi.fn()}
      />,
    )

    expect(screen.getByRole('heading', { name: '설정' })).toBeInTheDocument()
    expect(screen.getByText('일반')).toBeInTheDocument()
    expect(screen.getByText('마켓 데이터')).toBeInTheDocument()
    expect(screen.getByText('차트')).toBeInTheDocument()
    expect(screen.getByText('운영 제어')).toBeInTheDocument()
    expect(screen.getByText('진단')).toBeInTheDocument()
    expect(screen.getByText('설정을 저장하지 못했어요.')).toBeInTheDocument()
    expect(screen.getByText('동기화 완료')).toBeInTheDocument()

    const resetButtons = screen.getAllByRole('button', { name: /섹션 복원/ })
    expect(resetButtons).toHaveLength(3)
    expect(screen.queryByRole('button', { name: '운영 제어 섹션 복원' })).not.toBeInTheDocument()
  })

  it('모바일에서는 아코디언 구조와 운영 제어 분리 블록을 렌더링한다', () => {
    render(
      <SettingsPageLayout
        variant="mobile"
        draft={settingsFixture}
        dirtySections={{}}
        sectionErrors={{}}
        saveStatus="idle"
        saveMessage={null}
        lastSavedAt={null}
        runtime={runtimeFixture}
        runtimeLoading={false}
        runtimeRefreshing={true}
        runtimeError={null}
        actionStates={{}}
        settingsLoading
        settingsReady={false}
        onGeneralChange={vi.fn()}
        onMarketDataChange={vi.fn()}
        onChartChange={vi.fn()}
        onOpsChange={vi.fn()}
        onSave={vi.fn()}
        onResetSection={vi.fn()}
        onRefreshRuntime={vi.fn()}
        onRunMarketSync={vi.fn()}
        onStartExchangeStream={vi.fn()}
        onStopExchangeStream={vi.fn()}
      />,
    )

    const accordion = screen.getByTestId('settings-mobile-accordion')

    expect(within(accordion).getByRole('button', { name: '일반 펼치기' })).toBeInTheDocument()
    expect(within(accordion).getByRole('button', { name: '마켓 데이터 펼치기' })).toBeInTheDocument()
    expect(within(accordion).getByRole('button', { name: '차트 펼치기' })).toBeInTheDocument()
    expect(screen.getByTestId('settings-ops-section')).toHaveClass('border-amber-200')
    expect(screen.getByRole('button', { name: '진단 새로고침' })).toBeDisabled()
    const exchangeComboboxes = screen.getAllByRole('combobox', { name: '기본 거래소' })
    expect(exchangeComboboxes).toHaveLength(2)
    exchangeComboboxes.forEach((element) => {
      expect(element).toBeDisabled()
    })
    expect(screen.getByRole('button', { name: '마켓 동기화 실행' })).toBeDisabled()
  })

  it('저장 버튼과 런타임 새로고침, 운영 액션을 각각 호출한다', () => {
    const onSave = vi.fn()
    const onRefreshRuntime = vi.fn()
    const onRunMarketSync = vi.fn()

    render(
      <SettingsPageLayout
        variant="desktop"
        draft={settingsFixture}
        dirtySections={{ general: true }}
        sectionErrors={{}}
        saveStatus="idle"
        saveMessage={null}
        lastSavedAt={null}
        runtime={runtimeFixture}
        runtimeLoading={false}
        runtimeRefreshing={false}
        runtimeError={null}
        actionStates={{}}
        onGeneralChange={vi.fn()}
        onMarketDataChange={vi.fn()}
        onChartChange={vi.fn()}
        onOpsChange={vi.fn()}
        onSave={onSave}
        onResetSection={vi.fn()}
        onRefreshRuntime={onRefreshRuntime}
        onRunMarketSync={onRunMarketSync}
        onStartExchangeStream={vi.fn()}
        onStopExchangeStream={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: '설정 저장' }))
    fireEvent.click(screen.getByRole('button', { name: '진단 새로고침' }))
    fireEvent.click(screen.getByRole('button', { name: '마켓 동기화 실행' }))

    expect(onSave).toHaveBeenCalledTimes(1)
    expect(onRefreshRuntime).toHaveBeenCalledTimes(1)
    expect(onRunMarketSync).toHaveBeenCalledTimes(1)
  })

  it('마켓 동기화가 진행 중이면 중복 실행 버튼을 비활성화한다', () => {
    render(
      <SettingsPageLayout
        variant="desktop"
        draft={settingsFixture}
        dirtySections={{}}
        sectionErrors={{}}
        saveStatus="idle"
        saveMessage={null}
        lastSavedAt={null}
        runtime={runtimeFixture}
        runtimeLoading={false}
        runtimeRefreshing={false}
        runtimeError={null}
        actionStates={{
          'market-sync': {
            status: 'pending',
            message: null,
          },
        }}
        onGeneralChange={vi.fn()}
        onMarketDataChange={vi.fn()}
        onChartChange={vi.fn()}
        onOpsChange={vi.fn()}
        onSave={vi.fn()}
        onResetSection={vi.fn()}
        onRefreshRuntime={vi.fn()}
        onRunMarketSync={vi.fn()}
        onStartExchangeStream={vi.fn()}
        onStopExchangeStream={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: '마켓 동기화 실행' })).toBeDisabled()
  })

  it('마켓 데이터 입력 최소값을 백엔드 제약과 맞춘다', () => {
    render(
      <SettingsPageLayout
        variant="desktop"
        draft={settingsFixture}
        dirtySections={{}}
        sectionErrors={{}}
        saveStatus="idle"
        saveMessage={null}
        lastSavedAt={null}
        runtime={runtimeFixture}
        runtimeLoading={false}
        runtimeRefreshing={false}
        runtimeError={null}
        actionStates={{}}
        onGeneralChange={vi.fn()}
        onMarketDataChange={vi.fn()}
        onChartChange={vi.fn()}
        onOpsChange={vi.fn()}
        onSave={vi.fn()}
        onResetSection={vi.fn()}
        onRefreshRuntime={vi.fn()}
        onRunMarketSync={vi.fn()}
        onStartExchangeStream={vi.fn()}
        onStopExchangeStream={vi.fn()}
      />,
    )

    expect(screen.getByRole('spinbutton', { name: '폴링 주기(ms)' })).toHaveAttribute(
      'min',
      '1000',
    )
    expect(screen.getByRole('spinbutton', { name: '기본 목록 개수' })).toHaveAttribute(
      'min',
      '20',
    )
  })
})
