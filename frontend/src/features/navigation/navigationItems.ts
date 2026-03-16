export type NavigationItem = {
  label: string
  path: string
}

export type NavigationSection = {
  title: string
  items: NavigationItem[]
}

export const DASHBOARD_NAV_ITEM: NavigationItem = {
  label: '대시보드',
  path: '/dashboard',
}

export const INVESTMENT_STATUS_NAV_ITEM: NavigationItem = {
  label: '투자 현황',
  path: '/investment-status',
}

export const MARKET_CHART_NAV_ITEM: NavigationItem = {
  label: '시세 / 차트',
  path: '/market-chart',
}

export const SETTINGS_NAV_ITEM: NavigationItem = {
  label: '설정',
  path: '/settings',
}

export const SIDEBAR_MENU_SECTIONS: NavigationSection[] = [
  {
    title: '대시보드',
    items: [DASHBOARD_NAV_ITEM],
  },
  {
    title: '투자',
    items: [INVESTMENT_STATUS_NAV_ITEM, MARKET_CHART_NAV_ITEM],
  },
  {
    title: '기타',
    items: [SETTINGS_NAV_ITEM],
  },
]

export const MOBILE_PRIMARY_NAV_ITEMS: NavigationItem[] = [
  DASHBOARD_NAV_ITEM,
  INVESTMENT_STATUS_NAV_ITEM,
  MARKET_CHART_NAV_ITEM,
]

export const MOBILE_MORE_NAV_ITEMS: NavigationItem[] = [SETTINGS_NAV_ITEM]
