import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { createMemoryRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { afterEach, vi } from 'vitest'

import { routes } from './router'

function renderWithRoute(initialEntries: string[]) {
  const router = createMemoryRouter(routes, { initialEntries })

  return render(<RouterProvider router={router} />)
}

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('App routing', () => {
  it('polls backend health every second and renders status indicators on the home page', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true })
    const setIntervalSpy = vi.spyOn(window, 'setInterval')
    vi.stubGlobal('fetch', fetchMock)

    renderWithRoute(['/'])

    expect(screen.getByText('사이드바')).toBeInTheDocument()
    expect(screen.getByText('상단 영역')).toBeInTheDocument()
    expect(screen.getByText('상단 앱바 영역')).toBeInTheDocument()
    expect(screen.getByText('하단 탭 영역')).toBeInTheDocument()
    expect(screen.getAllByText('콘텐츠 영역')).toHaveLength(2)
    expect(screen.getAllByText('콘텐츠 영역')[1]).toHaveClass('flex-1')
    expect(screen.getAllByText('콘텐츠 영역')[1]).not.toHaveClass(
      'min-h-[calc(100vh-10rem)]',
    )

    expect(screen.getByText('서버 상태')).toBeInTheDocument()
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    expect(fetchMock).toHaveBeenCalledWith('http://127.0.0.1:8000/health')
    expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 1000)
    expect(await screen.findAllByText('온라인')).not.toHaveLength(0)
    expect(screen.getByLabelText('모바일 서버 상태 점')).toHaveAttribute(
      'data-status',
      'online',
    )
  })

  it('opens the more panel and shows backend status details on mobile', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false })
    vi.stubGlobal('fetch', fetchMock)

    renderWithRoute(['/'])

    fireEvent.click(await screen.findByRole('button', { name: '더보기 열기' }))

    expect(screen.getByText('더보기 패널')).toBeInTheDocument()
    expect(screen.getAllByText('백엔드 대상')).not.toHaveLength(0)
    expect(await screen.findAllByText('오프라인')).not.toHaveLength(0)
  })

  it('renders the not found page on unknown route', async () => {
    renderWithRoute(['/missing'])

    expect(
      await screen.findByRole('heading', { name: /page not found/i }),
    ).toBeInTheDocument()
  })
})
