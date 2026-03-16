import { createBrowserRouter, Navigate } from 'react-router'

import {
  DASHBOARD_NAV_ITEM,
  INVESTMENT_STATUS_NAV_ITEM,
  MARKET_CHART_NAV_ITEM,
  SETTINGS_NAV_ITEM,
} from '../features/navigation/navigationItems'
import { DashboardPage } from '../pages/DashboardPage'
import { HomePage } from '../pages/HomePage'
import { InvestmentStatusPage } from '../pages/InvestmentStatusPage'
import { MarketChartPage } from '../pages/MarketChartPage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { SettingsPage } from '../pages/SettingsPage'

export const routes = [
  {
    path: '/',
    element: <HomePage />,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <DashboardPage />,
        handle: { menuLabel: DASHBOARD_NAV_ITEM.label },
      },
      {
        path: 'investment-status',
        element: <InvestmentStatusPage />,
        handle: { menuLabel: INVESTMENT_STATUS_NAV_ITEM.label },
      },
      {
        path: 'market-chart',
        element: <MarketChartPage />,
        handle: { menuLabel: MARKET_CHART_NAV_ITEM.label },
      },
      {
        path: 'settings',
        element: <SettingsPage />,
        handle: { menuLabel: SETTINGS_NAV_ITEM.label },
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]

export const router = createBrowserRouter(routes)
