import {
  DASHBOARD_CARD_IDS,
  createDashboardWireframeCardConfig,
} from './dashboardWireframe'

export const DASHBOARD_MOBILE_SUMMARY_CARDS = DASHBOARD_CARD_IDS.summaries.map((id) =>
  createDashboardWireframeCardConfig(id, 'min-h-[5.5rem]'),
)

export const DASHBOARD_MOBILE_PRIMARY_PANEL = createDashboardWireframeCardConfig(
  DASHBOARD_CARD_IDS.primary,
  'min-h-[11rem]',
)

export const DASHBOARD_MOBILE_SIDE_PANELS = DASHBOARD_CARD_IDS.sides.map((id) =>
  createDashboardWireframeCardConfig(id, 'min-h-[6.5rem]'),
)

export const DASHBOARD_MOBILE_COMPARE_GRID_CARDS = DASHBOARD_CARD_IDS.compares
  .slice(0, 2)
  .map((id) => createDashboardWireframeCardConfig(id, 'min-h-[6rem]'))

export const DASHBOARD_MOBILE_COMPARE_STACK_CARD = createDashboardWireframeCardConfig(
  DASHBOARD_CARD_IDS.compares[2],
  'min-h-[6rem]',
)

export const DASHBOARD_MOBILE_WIDE_PANELS = DASHBOARD_CARD_IDS.wides.map((id) =>
  createDashboardWireframeCardConfig(id, 'min-h-[6.5rem]'),
)
