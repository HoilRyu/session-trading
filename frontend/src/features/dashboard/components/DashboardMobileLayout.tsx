import {
  DASHBOARD_MOBILE_COMPARE_GRID_CARDS,
  DASHBOARD_MOBILE_COMPARE_STACK_CARD,
  DASHBOARD_MOBILE_PRIMARY_PANEL,
  DASHBOARD_MOBILE_SIDE_PANELS,
  DASHBOARD_MOBILE_SUMMARY_CARDS,
  DASHBOARD_MOBILE_WIDE_PANELS,
} from '../constants/dashboardMobileWireframe'
import { DashboardWireframeCard } from './DashboardWireframeCard'

export function DashboardMobileLayout() {
  return (
    <section
      data-testid="dashboard-mobile-layout"
      className="min-h-0 flex flex-1 flex-col gap-4 overflow-y-auto"
    >
      <div data-testid="dashboard-mobile-summary-grid" className="grid grid-cols-2 gap-3">
        {DASHBOARD_MOBILE_SUMMARY_CARDS.map((card) => (
          <DashboardWireframeCard key={card.id} {...card} />
        ))}
      </div>

      <DashboardWireframeCard {...DASHBOARD_MOBILE_PRIMARY_PANEL} />

      <div data-testid="dashboard-mobile-side-stack" className="grid gap-3">
        {DASHBOARD_MOBILE_SIDE_PANELS.map((card) => (
          <DashboardWireframeCard key={card.id} {...card} />
        ))}
      </div>

      <div className="grid gap-3">
        <div
          data-testid="dashboard-mobile-compare-grid"
          className="grid grid-cols-2 gap-3"
        >
          {DASHBOARD_MOBILE_COMPARE_GRID_CARDS.map((card) => (
            <DashboardWireframeCard key={card.id} {...card} />
          ))}
        </div>

        <DashboardWireframeCard {...DASHBOARD_MOBILE_COMPARE_STACK_CARD} />
      </div>

      <div data-testid="dashboard-mobile-wide-stack" className="grid gap-3 pb-1">
        {DASHBOARD_MOBILE_WIDE_PANELS.map((card) => (
          <DashboardWireframeCard key={card.id} {...card} />
        ))}
      </div>
    </section>
  )
}
