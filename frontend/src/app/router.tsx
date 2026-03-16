import { createBrowserRouter, Navigate } from 'react-router'

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
      },
      {
        path: 'investment-status',
        element: <InvestmentStatusPage />,
      },
      {
        path: 'market-chart',
        element: <MarketChartPage />,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]

export const router = createBrowserRouter(routes)
