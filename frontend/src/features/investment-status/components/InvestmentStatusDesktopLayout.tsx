import { useEffect, useState } from 'react'

import {
  mockRunningJobs,
  mockStrategies,
} from '../data/investmentStatus.mock'
import type { RunningJobItem, StrategyItem } from '../investmentStatus.types'
import { RunningJobsSection } from './RunningJobsSection'
import { StrategyBoardSection } from './StrategyBoardSection'
import { StrategyDetailPanel } from './StrategyDetailPanel'

type InvestmentStatusDesktopLayoutProps = {
  runningJobs?: RunningJobItem[]
  strategies?: StrategyItem[]
}

type SelectionResetSynchronizerProps = {
  selectedStrategyId: string | null
  strategies: StrategyItem[]
  onSelectionInvalidated: () => void
}

function SelectionResetSynchronizer({
  selectedStrategyId,
  strategies,
  onSelectionInvalidated,
}: SelectionResetSynchronizerProps) {
  useEffect(() => {
    if (selectedStrategyId === null) {
      return
    }

    const hasSelectedStrategy = strategies.some((strategy) => {
      return strategy.id === selectedStrategyId
    })

    if (!hasSelectedStrategy) {
      onSelectionInvalidated()
    }
  }, [onSelectionInvalidated, selectedStrategyId, strategies])

  return null
}

export function InvestmentStatusDesktopLayout({
  runningJobs = mockRunningJobs,
  strategies = mockStrategies,
}: InvestmentStatusDesktopLayoutProps) {
  const [selectedStrategyId, setSelectedStrategyId] = useState<string | null>(null)
  const selectedStrategy =
    strategies.find((strategy) => {
      return strategy.id === selectedStrategyId
    }) ?? null

  return (
    <div
      data-testid="investment-status-desktop-layout"
      className="flex h-[calc(100vh-3rem)] min-h-0 flex-1 flex-col gap-6"
    >
      <SelectionResetSynchronizer
        selectedStrategyId={selectedStrategyId}
        strategies={strategies}
        onSelectionInvalidated={() => {
          setSelectedStrategyId(null)
        }}
      />

      <RunningJobsSection items={runningJobs} />

      <div
        data-testid="investment-status-lower-grid"
        className="grid min-h-0 flex-1 gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.72fr)]"
      >
        <StrategyBoardSection
          items={strategies}
          selectedStrategyId={selectedStrategyId}
          onSelectStrategy={setSelectedStrategyId}
        />
        <StrategyDetailPanel item={selectedStrategy} />
      </div>
    </div>
  )
}
