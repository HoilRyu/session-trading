import { useEffect, useMemo, useState } from 'react'

import type {
  ResettableSettingsSection,
  ServerSettingsDocument,
  SettingsFormSectionKey,
  SettingsUpdatePayload,
} from '../settings.types'
import { cloneSettingsDocument } from '../settings.types'

type UseSettingsPageStateOptions = {
  settings: ServerSettingsDocument
  onSave: (payload: SettingsUpdatePayload) => Promise<ServerSettingsDocument>
  onResetSection: (
    section: ResettableSettingsSection,
  ) => Promise<ServerSettingsDocument>
}

type SectionErrorState = Partial<Record<SettingsFormSectionKey, string | null>>
type DirtySectionState = Partial<Record<SettingsFormSectionKey, boolean>>

function areEqualSections<T>(left: T, right: T) {
  return JSON.stringify(left) === JSON.stringify(right)
}

function buildEmptySectionErrors(): SectionErrorState {
  return {
    general: null,
    market_data: null,
    chart: null,
    ops: null,
  }
}

function buildDirtySections(
  source: ServerSettingsDocument,
  draft: ServerSettingsDocument,
): DirtySectionState {
  return {
    general: !areEqualSections(source.general, draft.general),
    market_data: !areEqualSections(source.market_data, draft.market_data),
    chart: !areEqualSections(source.chart, draft.chart),
    ops: !areEqualSections(source.ops, draft.ops),
  }
}

function buildSavePayload(
  source: ServerSettingsDocument,
  draft: ServerSettingsDocument,
): SettingsUpdatePayload {
  const payload: SettingsUpdatePayload = {}

  if (!areEqualSections(source.general, draft.general)) {
    payload.general = draft.general
  }

  if (!areEqualSections(source.market_data, draft.market_data)) {
    payload.market_data = draft.market_data
  }

  if (!areEqualSections(source.chart, draft.chart)) {
    payload.chart = draft.chart
  }

  if (!areEqualSections(source.ops, draft.ops)) {
    payload.ops = draft.ops
  }

  return payload
}

function replaceSectionInDocument(
  current: ServerSettingsDocument,
  section: ResettableSettingsSection,
  nextSettings: ServerSettingsDocument,
) {
  return {
    ...current,
    [section]: structuredClone(nextSettings[section]),
  }
}

export function useSettingsPageState({
  settings,
  onSave,
  onResetSection,
}: UseSettingsPageStateOptions) {
  const [draft, setDraft] = useState(() => cloneSettingsDocument(settings))
  const [source, setSource] = useState(() => cloneSettingsDocument(settings))
  const [sectionErrors, setSectionErrors] = useState<SectionErrorState>(
    buildEmptySectionErrors(),
  )
  const [saveStatus, setSaveStatus] = useState<
    'idle' | 'saving' | 'success' | 'error'
  >('idle')
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null)

  useEffect(() => {
    setSource(cloneSettingsDocument(settings))
    setDraft(cloneSettingsDocument(settings))
    setSectionErrors(buildEmptySectionErrors())
  }, [settings])

  const dirtySections = useMemo(
    () => buildDirtySections(source, draft),
    [draft, source],
  )
  const hasDirtyChanges = Object.values(dirtySections).some(Boolean)

  const clearSaveFeedback = () => {
    setSaveStatus('idle')
    setSaveMessage(null)
  }

  const updateSectionError = (
    nextSections: SettingsFormSectionKey[],
    message: string | null,
  ) => {
    setSectionErrors((current) => {
      const nextErrors = { ...current }

      nextSections.forEach((section) => {
        nextErrors[section] = message
      })

      return nextErrors
    })
  }

  const updateGeneral = (patch: Partial<ServerSettingsDocument['general']>) => {
    clearSaveFeedback()
    setSectionErrors((current) => ({ ...current, general: null }))
    setDraft((current) => ({
      ...current,
      general: {
        ...current.general,
        ...patch,
      },
    }))
  }

  const updateMarketData = (
    patch: Partial<ServerSettingsDocument['market_data']>,
  ) => {
    clearSaveFeedback()
    setSectionErrors((current) => ({ ...current, market_data: null }))
    setDraft((current) => ({
      ...current,
      market_data: {
        ...current.market_data,
        ...patch,
      },
    }))
  }

  const updateChart = (patch: Partial<ServerSettingsDocument['chart']>) => {
    clearSaveFeedback()
    setSectionErrors((current) => ({ ...current, chart: null }))
    setDraft((current) => ({
      ...current,
      chart: {
        ...current.chart,
        ...patch,
      },
    }))
  }

  const updateOps = (patch: Partial<ServerSettingsDocument['ops']>) => {
    clearSaveFeedback()
    setSectionErrors((current) => ({ ...current, ops: null }))
    setDraft((current) => ({
      ...current,
      ops: {
        ...current.ops,
        ...patch,
      },
    }))
  }

  const save = async () => {
    if (!hasDirtyChanges) {
      return source
    }

    setSaveStatus('saving')
    setSaveMessage(null)

    const payload = buildSavePayload(source, draft)

    try {
      const nextSettings = await onSave(payload)
      const nextDraft = cloneSettingsDocument(nextSettings)

      setSource(nextDraft)
      setDraft(nextDraft)
      setSectionErrors(buildEmptySectionErrors())
      setSaveStatus('success')
      setSaveMessage('설정을 저장했어요.')
      setLastSavedAt(new Date().toISOString())

      return nextSettings
    } catch (nextError) {
      const nextMessage =
        nextError instanceof Error ? nextError.message : '설정 저장에 실패했어요.'
      const changedSections = (Object.entries(dirtySections) as Array<
        [SettingsFormSectionKey, boolean | undefined]
      >)
        .filter(([, isDirty]) => Boolean(isDirty))
        .map(([section]) => section)

      updateSectionError(changedSections, nextMessage)
      setSaveStatus('error')
      setSaveMessage('설정을 저장하지 못했어요.')

      return source
    }
  }

  const resetSection = async (section: ResettableSettingsSection) => {
    clearSaveFeedback()

    try {
      const nextSettings = await onResetSection(section)

      setSource((current) => replaceSectionInDocument(current, section, nextSettings))
      setDraft((current) => replaceSectionInDocument(current, section, nextSettings))
      setSectionErrors((current) => ({
        ...current,
        [section]: null,
      }))

      return nextSettings
    } catch (nextError) {
      setSectionErrors((current) => ({
        ...current,
        [section]:
          nextError instanceof Error
            ? nextError.message
            : '섹션 복원에 실패했어요.',
      }))

      return draft
    }
  }

  return {
    draft,
    dirtySections,
    hasDirtyChanges,
    sectionErrors,
    saveStatus,
    saveMessage,
    lastSavedAt,
    updateGeneral,
    updateMarketData,
    updateChart,
    updateOps,
    save,
    resetSection,
  }
}
