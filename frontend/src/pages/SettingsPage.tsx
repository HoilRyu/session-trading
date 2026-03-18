import { SettingsPageLayout } from '../features/settings/components/SettingsPageLayout'
import { useServerSettings } from '../features/settings/hooks/useServerSettings'
import { useSettingsOperations } from '../features/settings/hooks/useSettingsOperations'
import { useSettingsPageState } from '../features/settings/hooks/useSettingsPageState'
import { useSettingsRuntime } from '../features/settings/hooks/useSettingsRuntime'
import { SETTINGS_DEFAULT_DOCUMENT } from '../features/settings/settings.types'

type SettingsPageProps = {
  variant?: 'desktop' | 'mobile'
}

export function SettingsPage({ variant = 'desktop' }: SettingsPageProps) {
  const {
    settings,
    loading: settingsLoading,
    error: settingsError,
    saveSettings,
    resetSection,
  } = useServerSettings()
  const {
    runtime,
    loading: runtimeLoading,
    refreshing: runtimeRefreshing,
    error: runtimeError,
    refresh: refreshRuntime,
  } = useSettingsRuntime()
  const pageState = useSettingsPageState({
    settings: settings ?? SETTINGS_DEFAULT_DOCUMENT,
    onSave: saveSettings,
    onResetSection: resetSection,
  })
  const operations = useSettingsOperations({
    onAfterAction: async () => {
      await refreshRuntime()
    },
  })

  return (
    <SettingsPageLayout
      variant={variant}
      draft={pageState.draft}
      dirtySections={pageState.dirtySections}
      sectionErrors={pageState.sectionErrors}
      saveStatus={pageState.saveStatus}
      saveMessage={pageState.saveMessage}
      lastSavedAt={pageState.lastSavedAt}
      runtime={runtime}
      runtimeLoading={runtimeLoading}
      runtimeRefreshing={runtimeRefreshing}
      runtimeError={runtimeError}
      actionStates={operations.actionStates}
      settingsLoading={settingsLoading}
      settingsReady={settings !== null}
      settingsError={settingsError}
      onGeneralChange={pageState.updateGeneral}
      onMarketDataChange={pageState.updateMarketData}
      onChartChange={pageState.updateChart}
      onOpsChange={pageState.updateOps}
      onSave={() => {
        void pageState.save().catch(() => {})
      }}
      onResetSection={(section) => {
        void pageState.resetSection(section).catch(() => {})
      }}
      onRefreshRuntime={() => {
        void refreshRuntime().catch(() => {})
      }}
      onRunMarketSync={() => {
        void operations.runMarketSync()
      }}
      onStartExchangeStream={(exchange) => {
        void operations.startExchangeStream(exchange)
      }}
      onStopExchangeStream={(exchange) => {
        void operations.stopExchangeStream(exchange)
      }}
    />
  )
}
