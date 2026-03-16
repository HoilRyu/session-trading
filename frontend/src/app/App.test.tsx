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

    expect(
      await screen.findByRole('heading', { name: /session trading frontend/i }),
    ).toBeInTheDocument()
  })

  it('renders the not found page on unknown route', async () => {
    renderWithRoute(['/missing'])

    expect(
      await screen.findByRole('heading', { name: /page not found/i }),
    ).toBeInTheDocument()
  })
})
