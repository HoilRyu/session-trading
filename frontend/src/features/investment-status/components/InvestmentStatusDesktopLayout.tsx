import {
  mockRunningJobs,
  mockStrategies,
} from '../data/investmentStatus.mock'
import { RunningJobsSection } from './RunningJobsSection'
import { StrategyBoardSection } from './StrategyBoardSection'
import { StrategyDetailPanel } from './StrategyDetailPanel'

export function InvestmentStatusDesktopLayout() {
  return (
    <div
      data-testid="investment-status-desktop-layout"
      className="flex h-[calc(100vh-3rem)] min-h-0 flex-1 flex-col gap-6"
    >
      <RunningJobsSection items={mockRunningJobs} />

      <div className="grid min-h-0 flex-1 gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.72fr)]">
        <StrategyBoardSection items={mockStrategies} />
        <StrategyDetailPanel />
      </div>
    </div>
  )
}
