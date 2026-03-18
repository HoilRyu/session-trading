import { useState, type ReactNode } from 'react'

import type {
  ResettableSettingsSection,
  ServerSettingsDocument,
  SettingsOperationStateMap,
  SettingsRuntimeDocument,
} from '../settings.types'
import { SettingsChartCard } from './SettingsChartCard'
import { SettingsGeneralCard } from './SettingsGeneralCard'
import { SettingsMarketDataCard } from './SettingsMarketDataCard'
import { SettingsOpsCard } from './SettingsOpsCard'
import { SettingsRuntimeCard } from './SettingsRuntimeCard'

type SettingsPageLayoutProps = {
  variant?: 'desktop' | 'mobile'
  draft: ServerSettingsDocument
  dirtySections: Partial<Record<keyof ServerSettingsDocument, boolean>>
  sectionErrors: Partial<Record<keyof ServerSettingsDocument, string | null>>
  saveStatus: 'idle' | 'saving' | 'success' | 'error'
  saveMessage: string | null
  lastSavedAt: string | null
  runtime: SettingsRuntimeDocument | null
  runtimeLoading: boolean
  runtimeRefreshing: boolean
  runtimeError: string | null
  actionStates: SettingsOperationStateMap
  settingsLoading?: boolean
  settingsReady?: boolean
  settingsError?: string | null
  onGeneralChange: (
    patch: Partial<ServerSettingsDocument['general']>,
  ) => void
  onMarketDataChange: (
    patch: Partial<ServerSettingsDocument['market_data']>,
  ) => void
  onChartChange: (patch: Partial<ServerSettingsDocument['chart']>) => void
  onOpsChange: (patch: Partial<ServerSettingsDocument['ops']>) => void
  onSave: () => void
  onResetSection: (section: ResettableSettingsSection) => void
  onRefreshRuntime: () => void
  onRunMarketSync: () => void
  onStartExchangeStream: (exchange: 'upbit' | 'bithumb' | 'binance') => void
  onStopExchangeStream: (exchange: 'upbit' | 'bithumb' | 'binance') => void
}

function SettingsSaveBanner({
  saveStatus,
  saveMessage,
  lastSavedAt,
}: Pick<SettingsPageLayoutProps, 'saveStatus' | 'saveMessage' | 'lastSavedAt'>) {
  if (!saveMessage && !lastSavedAt) {
    return null
  }

  return (
    <div className="space-y-1 text-right">
      {saveMessage ? (
        <p
          className={[
            'text-sm font-medium',
            saveStatus === 'error' ? 'text-rose-700' : 'text-emerald-700',
          ].join(' ')}
        >
          {saveMessage}
        </p>
      ) : null}
      {lastSavedAt ? (
        <p className="text-xs text-slate-500">{`마지막 저장 ${lastSavedAt}`}</p>
      ) : null}
    </div>
  )
}

function MobileAccordionSection({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  const [open, setOpen] = useState(true)

  return (
    <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-label={`${title} 펼치기`}
        className="flex w-full items-center justify-between px-4 py-4 text-left"
      >
        <span className="text-base font-semibold text-slate-900">{title}</span>
        <span className="text-sm font-medium text-slate-500">
          {open ? '접기' : '펼치기'}
        </span>
      </button>
      {open ? <div className="px-2 pb-2">{children}</div> : null}
    </section>
  )
}

export function SettingsPageLayout({
  variant = 'desktop',
  draft,
  dirtySections,
  sectionErrors,
  saveStatus,
  saveMessage,
  lastSavedAt,
  runtime,
  runtimeLoading,
  runtimeRefreshing,
  runtimeError,
  actionStates,
  settingsLoading = false,
  settingsReady = true,
  settingsError = null,
  onGeneralChange,
  onMarketDataChange,
  onChartChange,
  onOpsChange,
  onSave,
  onResetSection,
  onRefreshRuntime,
  onRunMarketSync,
  onStartExchangeStream,
  onStopExchangeStream,
}: SettingsPageLayoutProps) {
  const hasDirtyChanges = Object.values(dirtySections).some(Boolean)
  const formDisabled = settingsLoading || !settingsReady

  const generalCard = (
    <SettingsGeneralCard
      value={draft.general}
      error={sectionErrors.general}
      disabled={formDisabled}
      onChange={onGeneralChange}
      onReset={() => onResetSection('general')}
    />
  )
  const marketDataCard = (
    <SettingsMarketDataCard
      value={draft.market_data}
      error={sectionErrors.market_data}
      disabled={formDisabled}
      onChange={onMarketDataChange}
      onReset={() => onResetSection('market_data')}
    />
  )
  const chartCard = (
    <SettingsChartCard
      value={draft.chart}
      error={sectionErrors.chart}
      disabled={formDisabled}
      onChange={onChartChange}
      onReset={() => onResetSection('chart')}
    />
  )
  const opsCard = (
    <SettingsOpsCard
      value={draft.ops}
      error={sectionErrors.ops}
      disabled={formDisabled}
      actionStates={actionStates}
      onChange={onOpsChange}
      onRunMarketSync={onRunMarketSync}
      onStartExchangeStream={onStartExchangeStream}
      onStopExchangeStream={onStopExchangeStream}
    />
  )
  const runtimeCard = (
    <SettingsRuntimeCard
      runtime={runtime}
      loading={runtimeLoading}
      refreshing={runtimeRefreshing}
      error={runtimeError}
      onRefresh={onRefreshRuntime}
    />
  )

  if (variant === 'mobile') {
    return (
      <div
        data-testid="settings-page-mobile"
        className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pb-6"
      >
        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Settings
              </p>
              <p className="mt-2 text-sm text-slate-600">
                저장형 설정과 운영 액션을 한 화면에서 관리해요.
              </p>
            </div>
            <button
              type="button"
              onClick={onSave}
              disabled={!hasDirtyChanges || saveStatus === 'saving' || formDisabled}
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:bg-slate-300"
            >
              설정 저장
            </button>
          </div>
          <div className="mt-3">
            <SettingsSaveBanner
              saveStatus={saveStatus}
              saveMessage={saveMessage}
              lastSavedAt={lastSavedAt}
            />
          </div>
          {settingsError ? (
            <p className="mt-3 rounded-2xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {settingsError}
            </p>
          ) : null}
        </section>

        <div data-testid="settings-mobile-accordion" className="flex flex-col gap-3">
          <MobileAccordionSection title="일반">{generalCard}</MobileAccordionSection>
          <MobileAccordionSection title="마켓 데이터">
            {marketDataCard}
          </MobileAccordionSection>
          <MobileAccordionSection title="차트">{chartCard}</MobileAccordionSection>
        </div>

        <div data-testid="settings-ops-section" className="border-amber-200">
          {opsCard}
        </div>

        {runtimeCard}
      </div>
    )
  }

  return (
    <div className="flex min-h-[calc(100vh-3rem)] flex-1 flex-col gap-6">
      <section className="rounded-3xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              Settings
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">설정</h2>
            <p className="mt-2 text-sm text-slate-600">
              서버 저장 설정, 운영 제어, 진단 정보를 함께 관리해요.
            </p>
          </div>

          <div className="flex flex-col items-start gap-3 xl:items-end">
            <SettingsSaveBanner
              saveStatus={saveStatus}
              saveMessage={saveMessage}
              lastSavedAt={lastSavedAt}
            />
            <button
              type="button"
              onClick={onSave}
              disabled={!hasDirtyChanges || saveStatus === 'saving' || formDisabled}
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:bg-slate-300"
            >
              설정 저장
            </button>
          </div>
        </div>

        {settingsError ? (
          <p className="mt-4 rounded-2xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {settingsError}
          </p>
        ) : null}
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        {generalCard}
        {marketDataCard}
        {chartCard}
        <div className="xl:col-span-2">{opsCard}</div>
        <div className="xl:col-span-2">{runtimeCard}</div>
      </div>
    </div>
  )
}
