export type DashboardWireframeTone =
  | 'header'
  | 'summary'
  | 'primary'
  | 'secondary'
  | 'wide'

export type DashboardWireframeCardConfig = {
  id: string
  testId: string
  label: string
  sectionLabel: string
  footerLabel: string
  minHeightClass: string
  tone: DashboardWireframeTone
}

export const DASHBOARD_HEADER_CARD: DashboardWireframeCardConfig = {
  id: 'header',
  testId: 'dashboard-card-header',
  label: 'Dashboard Header',
  sectionLabel: 'Header',
  footerLabel: 'Action Slot',
  minHeightClass: 'min-h-[5rem]',
  tone: 'header',
}

export const DASHBOARD_SUMMARY_CARDS: DashboardWireframeCardConfig[] = [
  {
    id: 'summary-01',
    testId: 'dashboard-card-summary-01',
    label: 'Summary 01',
    sectionLabel: 'Summary',
    footerLabel: 'Reserved Slot',
    minHeightClass: 'min-h-[7rem]',
    tone: 'summary',
  },
  {
    id: 'summary-02',
    testId: 'dashboard-card-summary-02',
    label: 'Summary 02',
    sectionLabel: 'Summary',
    footerLabel: 'Reserved Slot',
    minHeightClass: 'min-h-[7rem]',
    tone: 'summary',
  },
  {
    id: 'summary-03',
    testId: 'dashboard-card-summary-03',
    label: 'Summary 03',
    sectionLabel: 'Summary',
    footerLabel: 'Reserved Slot',
    minHeightClass: 'min-h-[7rem]',
    tone: 'summary',
  },
  {
    id: 'summary-04',
    testId: 'dashboard-card-summary-04',
    label: 'Summary 04',
    sectionLabel: 'Summary',
    footerLabel: 'Reserved Slot',
    minHeightClass: 'min-h-[7rem]',
    tone: 'summary',
  },
]

export const DASHBOARD_PRIMARY_PANEL: DashboardWireframeCardConfig = {
  id: 'primary',
  testId: 'dashboard-card-primary',
  label: 'Primary Panel',
  sectionLabel: 'Primary',
  footerLabel: 'Reserved Slot',
  minHeightClass: 'min-h-[16rem]',
  tone: 'primary',
}

export const DASHBOARD_SIDE_PANELS: DashboardWireframeCardConfig[] = [
  {
    id: 'side-a',
    testId: 'dashboard-card-side-a',
    label: 'Side Panel A',
    sectionLabel: 'Secondary',
    footerLabel: 'Reserved Slot',
    minHeightClass: 'min-h-[7.5rem]',
    tone: 'secondary',
  },
  {
    id: 'side-b',
    testId: 'dashboard-card-side-b',
    label: 'Side Panel B',
    sectionLabel: 'Secondary',
    footerLabel: 'Reserved Slot',
    minHeightClass: 'min-h-[7.5rem]',
    tone: 'secondary',
  },
]

export const DASHBOARD_COMPARE_CARDS: DashboardWireframeCardConfig[] = [
  {
    id: 'compare-a',
    testId: 'dashboard-card-compare-a',
    label: 'Compare A',
    sectionLabel: 'Compare',
    footerLabel: 'Reserved Slot',
    minHeightClass: 'min-h-[9.5rem]',
    tone: 'secondary',
  },
  {
    id: 'compare-b',
    testId: 'dashboard-card-compare-b',
    label: 'Compare B',
    sectionLabel: 'Compare',
    footerLabel: 'Reserved Slot',
    minHeightClass: 'min-h-[9.5rem]',
    tone: 'secondary',
  },
  {
    id: 'compare-c',
    testId: 'dashboard-card-compare-c',
    label: 'Compare C',
    sectionLabel: 'Compare',
    footerLabel: 'Reserved Slot',
    minHeightClass: 'min-h-[9.5rem]',
    tone: 'secondary',
  },
]

export const DASHBOARD_WIDE_PANELS: DashboardWireframeCardConfig[] = [
  {
    id: 'wide-a',
    testId: 'dashboard-card-wide-a',
    label: 'Wide Panel A',
    sectionLabel: 'Wide',
    footerLabel: 'Reserved Slot',
    minHeightClass: 'min-h-[9rem]',
    tone: 'wide',
  },
  {
    id: 'wide-b',
    testId: 'dashboard-card-wide-b',
    label: 'Wide Panel B',
    sectionLabel: 'Wide',
    footerLabel: 'Reserved Slot',
    minHeightClass: 'min-h-[9rem]',
    tone: 'wide',
  },
]
