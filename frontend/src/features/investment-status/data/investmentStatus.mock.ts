import type { RunningJobItem, StrategyItem } from '../investmentStatus.types'

export const mockRunningJobs: RunningJobItem[] = [
  {
    id: 'job-rebalance',
    label: '리밸런싱 세션 실행 중',
    status: '진행 중',
    progressText: '남은 단계 2/7',
  },
  {
    id: 'job-trend',
    label: '추세 추종 전략 시그널 수집',
    status: '정상',
    progressText: '정상 동작',
  },
  {
    id: 'job-backtest',
    label: '단기 매매 전략 백테스트 준비',
    status: '대기 중',
    progressText: '다음 세션 대기',
  },
]

export const mockStrategies: StrategyItem[] = [
  {
    id: 'strategy-momentum',
    label: '단기 모멘텀',
    summary: '실행 세션 1개',
    description: '단기 추세 진입 전략',
  },
  {
    id: 'strategy-trend',
    label: '추세 추종',
    summary: '실행 세션 2개',
    description: '중기 추세 추종 전략',
  },
  {
    id: 'strategy-dca',
    label: '장기 적립',
    summary: '보유 상태 유지',
    description: '정기 분할 매수 전략',
  },
]
