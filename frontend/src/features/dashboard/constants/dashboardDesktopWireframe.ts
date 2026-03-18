import {
  DASHBOARD_CARD_IDS,
  createDashboardWireframeCardConfig,
} from './dashboardWireframe'

export const DASHBOARD_DESKTOP_HEADER_CARD = createDashboardWireframeCardConfig(
  DASHBOARD_CARD_IDS.header,
  'min-h-[5rem]',
)

export const DASHBOARD_DESKTOP_SUMMARY_CARDS = DASHBOARD_CARD_IDS.summaries.map((id) =>
  createDashboardWireframeCardConfig(id, 'min-h-[7rem]'),
)

export const DASHBOARD_DESKTOP_PRIMARY_PANEL = createDashboardWireframeCardConfig(
  DASHBOARD_CARD_IDS.primary,
  'min-h-[16rem]',
)

export const DASHBOARD_DESKTOP_SIDE_PANELS = DASHBOARD_CARD_IDS.sides.map((id) =>
  createDashboardWireframeCardConfig(id, 'min-h-[7.5rem]'),
)

export const DASHBOARD_DESKTOP_COMPARE_CARDS = DASHBOARD_CARD_IDS.compares.map((id) =>
  createDashboardWireframeCardConfig(id, 'min-h-[9.5rem]'),
)

export const DASHBOARD_DESKTOP_WIDE_PANELS = DASHBOARD_CARD_IDS.wides.map((id) =>
  createDashboardWireframeCardConfig(id, 'min-h-[9rem]'),
)
