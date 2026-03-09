import { useGameStore } from '../store/gameStore'

export function Notification() {
  const { notification } = useGameStore()

  if (!notification) return null

  const colors: Record<string, { bg: string; border: string; text: string }> = {
    success: { bg: 'rgba(34,197,94,0.15)', border: '#22c55e', text: '#22c55e' },
    error: { bg: 'rgba(239,68,68,0.15)', border: '#ef4444', text: '#ef4444' },
    warning: { bg: 'rgba(245,158,11,0.15)', border: '#f59e0b', text: '#f59e0b' },
    info: { bg: 'rgba(59,130,246,0.15)', border: '#3b82f6', text: '#3b82f6' },
  }

  const style = colors[notification.type]

  return (
    <div
      className="fixed top-6 left-1/2 z-[100] transform -translate-x-1/2 px-4 py-2 rounded-lg font-game text-xs"
      style={{
        background: style.bg,
        border: `1px solid ${style.border}`,
        color: style.text,
        boxShadow: `0 0 20px ${style.border}44`,
        animation: 'slam 0.3s ease-out',
        maxWidth: '90vw',
        textAlign: 'center',
      }}
    >
      {notification.text}
    </div>
  )
}
