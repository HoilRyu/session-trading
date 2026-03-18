export type DashboardWireframeTone =
  | 'header'
  | 'summary'
  | 'primary'
  | 'secondary'
  | 'wide'

export type DashboardWireframeCardId =
  | 'header'
  | 'summary-01'
  | 'summary-02'
  | 'summary-03'
  | 'summary-04'
  | 'primary'
  | 'side-a'
  | 'side-b'
  | 'compare-a'
  | 'compare-b'
  | 'compare-c'
  | 'wide-a'
  | 'wide-b'

export type DashboardWireframeCardDefinition = {
  id: DashboardWireframeCardId
  testId: string
  label: string
  sectionLabel: string
  footerLabel: string
  tone: DashboardWireframeTone
}

export type DashboardWireframeCardConfig = DashboardWireframeCardDefinition & {
  minHeightClass: string
}

export const DASHBOARD_CARD_IDS = {
  header: 'header',
  summaries: ['summary-01', 'summary-02', 'summary-03', 'summary-04'],
  primary: 'primary',
  sides: ['side-a', 'side-b'],
  compares: ['compare-a', 'compare-b', 'compare-c'],
  wides: ['wide-a', 'wide-b'],
} as const satisfies {
  header: DashboardWireframeCardId
  summaries: DashboardWireframeCardId[]
  primary: DashboardWireframeCardId
  sides: DashboardWireframeCardId[]
  compares: DashboardWireframeCardId[]
  wides: DashboardWireframeCardId[]
}

export const DASHBOARD_CARD_DEFINITIONS: Record<
  DashboardWireframeCardId,
  DashboardWireframeCardDefinition
> = {
  header: {
    id: 'header',
    testId: 'dashboard-card-header',
    label: 'Dashboard Header',
    sectionLabel: 'Header',
    footerLabel: 'Action Slot',
    tone: 'header',
  },
  'summary-01': {
    id: 'summary-01',
    testId: 'dashboard-card-summary-01',
    label: 'Summary 01',
    sectionLabel: 'Summary',
    footerLabel: 'Reserved Slot',
    tone: 'summary',
  },
  'summary-02': {
    id: 'summary-02',
    testId: 'dashboard-card-summary-02',
    label: 'Summary 02',
    sectionLabel: 'Summary',
    footerLabel: 'Reserved Slot',
    tone: 'summary',
  },
  'summary-03': {
    id: 'summary-03',
    testId: 'dashboard-card-summary-03',
    label: 'Summary 03',
    sectionLabel: 'Summary',
    footerLabel: 'Reserved Slot',
    tone: 'summary',
  },
  'summary-04': {
    id: 'summary-04',
    testId: 'dashboard-card-summary-04',
    label: 'Summary 04',
    sectionLabel: 'Summary',
    footerLabel: 'Reserved Slot',
    tone: 'summary',
  },
  primary: {
    id: 'primary',
    testId: 'dashboard-card-primary',
    label: 'Primary Panel',
    sectionLabel: 'Primary',
    footerLabel: 'Reserved Slot',
    tone: 'primary',
  },
  'side-a': {
    id: 'side-a',
    testId: 'dashboard-card-side-a',
    label: 'Side Panel A',
    sectionLabel: 'Secondary',
    footerLabel: 'Reserved Slot',
    tone: 'secondary',
  },
  'side-b': {
    id: 'side-b',
    testId: 'dashboard-card-side-b',
    label: 'Side Panel B',
    sectionLabel: 'Secondary',
    footerLabel: 'Reserved Slot',
    tone: 'secondary',
  },
  'compare-a': {
    id: 'compare-a',
    testId: 'dashboard-card-compare-a',
    label: 'Compare A',
    sectionLabel: 'Compare',
    footerLabel: 'Reserved Slot',
    tone: 'secondary',
  },
  'compare-b': {
    id: 'compare-b',
    testId: 'dashboard-card-compare-b',
    label: 'Compare B',
    sectionLabel: 'Compare',
    footerLabel: 'Reserved Slot',
    tone: 'secondary',
  },
  'compare-c': {
    id: 'compare-c',
    testId: 'dashboard-card-compare-c',
    label: 'Compare C',
    sectionLabel: 'Compare',
    footerLabel: 'Reserved Slot',
    tone: 'secondary',
  },
  'wide-a': {
    id: 'wide-a',
    testId: 'dashboard-card-wide-a',
    label: 'Wide Panel A',
    sectionLabel: 'Wide',
    footerLabel: 'Reserved Slot',
    tone: 'wide',
  },
  'wide-b': {
    id: 'wide-b',
    testId: 'dashboard-card-wide-b',
    label: 'Wide Panel B',
    sectionLabel: 'Wide',
    footerLabel: 'Reserved Slot',
    tone: 'wide',
  },
}

export function createDashboardWireframeCardConfig(
  id: DashboardWireframeCardId,
  minHeightClass: string,
): DashboardWireframeCardConfig {
  return {
    ...DASHBOARD_CARD_DEFINITIONS[id],
    minHeightClass,
  }
}
