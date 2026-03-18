import {
  DASHBOARD_DESKTOP_COMPARE_CARDS,
  DASHBOARD_DESKTOP_HEADER_CARD,
  DASHBOARD_DESKTOP_PRIMARY_PANEL,
  DASHBOARD_DESKTOP_SIDE_PANELS,
  DASHBOARD_DESKTOP_SUMMARY_CARDS,
  DASHBOARD_DESKTOP_WIDE_PANELS,
} from '../constants/dashboardDesktopWireframe'
import { DashboardWireframeCard } from './DashboardWireframeCard'

export function DashboardDesktopLayout() {
  return (
    <section data-testid="dashboard-desktop-layout" className="flex flex-1 flex-col gap-6">
      <DashboardWireframeCard {...DASHBOARD_DESKTOP_HEADER_CARD} />

      <div className="grid grid-cols-4 gap-4">
        {DASHBOARD_DESKTOP_SUMMARY_CARDS.map((card) => (
          <DashboardWireframeCard key={card.id} {...card} />
        ))}
      </div>

      <div
        data-testid="dashboard-main-grid"
        className="grid gap-4 grid-cols-[minmax(0,1.6fr)_minmax(18rem,0.9fr)]"
      >
        <DashboardWireframeCard {...DASHBOARD_DESKTOP_PRIMARY_PANEL} />

        <div className="grid grid-rows-2 gap-4">
          {DASHBOARD_DESKTOP_SIDE_PANELS.map((card) => (
            <DashboardWireframeCard key={card.id} {...card} />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {DASHBOARD_DESKTOP_COMPARE_CARDS.map((card) => (
          <DashboardWireframeCard key={card.id} {...card} />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {DASHBOARD_DESKTOP_WIDE_PANELS.map((card) => (
          <DashboardWireframeCard key={card.id} {...card} />
        ))}
      </div>
    </section>
  )
}
