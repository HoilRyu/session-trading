import { render, screen } from '@testing-library/react'
import { createMemoryRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'

import { routes } from './router'

function renderWithRoute(initialEntries: string[]) {
  const router = createMemoryRouter(routes, { initialEntries })

  return render(<RouterProvider router={router} />)
}

describe('App routing', () => {
  it('renders the home page on root route', async () => {
    renderWithRoute(['/'])

    expect(await screen.findByText('사이드바')).toBeInTheDocument()
    expect(screen.getByText('상단 영역')).toBeInTheDocument()
    expect(screen.getByText('상단 앱바 영역')).toBeInTheDocument()
    expect(screen.getByText('하단 탭 영역')).toBeInTheDocument()
    expect(screen.getAllByText('콘텐츠 영역')).toHaveLength(2)
  })

  it('renders the not found page on unknown route', async () => {
    renderWithRoute(['/missing'])

    expect(
      await screen.findByRole('heading', { name: /page not found/i }),
    ).toBeInTheDocument()
  })
})
