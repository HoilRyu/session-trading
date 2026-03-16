import { render, screen } from '@testing-library/react'

import {
  BackendStatusCard,
  BackendStatusDot,
  BackendStatusPanel,
} from './BackendStatus'

describe('BackendStatus components', () => {
  it('renders the desktop status card with status text and target', () => {
    render(<BackendStatusCard status="online" target="127.0.0.1:8000" />)

    expect(screen.getByText('서버 상태')).toBeInTheDocument()
    expect(screen.getByText('온라인')).toBeInTheDocument()
    expect(screen.getByText('백엔드 대상')).toBeInTheDocument()
    expect(screen.getByText('127.0.0.1:8000')).toBeInTheDocument()
  })

  it('renders the mobile status dot with the current status', () => {
    render(<BackendStatusDot status="checking" />)

    expect(screen.getByLabelText('모바일 서버 상태 점')).toHaveAttribute(
      'data-status',
      'checking',
    )
    expect(screen.getByText('확인 중')).toHaveClass('sr-only')
  })

  it('renders the mobile status panel content with target details', () => {
    render(<BackendStatusPanel status="offline" target="127.0.0.1:8000" />)

    expect(screen.getByText('서버 상태')).toBeInTheDocument()
    expect(screen.getByText('오프라인')).toBeInTheDocument()
    expect(screen.getByText('백엔드 대상')).toBeInTheDocument()
    expect(screen.getByText('127.0.0.1:8000')).toBeInTheDocument()
  })
})
