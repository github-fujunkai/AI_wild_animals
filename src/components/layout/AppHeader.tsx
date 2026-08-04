import {
  BellOutlined,
  CheckOutlined,
  DownOutlined,
  KeyOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  PoweroffOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import { Avatar, Badge, Button, Drawer, Dropdown, Tag } from 'antd'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { alertApi, homeApi } from '@/services/api'
import wildlifeTrailCamera from '@/assets/wildlife-trail-camera.jpg'
import type { AlertItem } from '@/services/api'
import { useAuthStore } from '@/store/auth-store'
import { useLayoutStore } from '@/store/layout-store'
import { ChangePasswordModal } from '@/components/auth/ChangePasswordModal'

const levelColorMap: Record<string, string> = {
  danger: 'red',
  warning: 'orange',
  default: 'blue',
}

const alertColorMap: Record<string, string> = {
  告警: 'red',
  警告: 'orange',
  通知: 'blue',
}

const FALLBACK_ALERTS: AlertItem[] = [
  { id: '1', type: '告警', level: 'danger', title: '相机-003 产生入侵报警', message: '相机-003 检测到异常入侵信号', isRead: false, time: '2 分钟前' },
  { id: '2', type: '警告', level: 'warning', title: '相机-002 电量低于 15%', message: '相机-002 当前电量仅剩 15%', isRead: false, time: '5 分钟前' },
  { id: '3', type: '通知', level: 'default', title: '相机-004 离线超过 1 小时', message: '相机-004 已离线超过 1 小时', isRead: true, time: '30 分钟前' },
]

export function AppHeader() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const collapsed = useLayoutStore((state) => state.collapsed)
  const toggleCollapsed = useLayoutStore((state) => state.toggleCollapsed)

  const [now, setNow] = useState(new Date())
  const [alertOpen, setAlertOpen] = useState(false)
  const [alerts, setAlerts] = useState<AlertItem[]>(FALLBACK_ALERTS)
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)

  const unreadCount = alerts.filter((a) => !a.isRead).length

  const loadAlerts = async () => {
    try {
      const data = await homeApi.getAlerts()
      setAlerts(data)
    } catch {
      // fallback already set
    }
  }

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    void loadAlerts()
  }, [])

  const handleMarkRead = async (id: string) => {
    // Optimistic update: remove from list (backend won't return it after marking read)
    setAlerts((prev) => prev.filter((a) => a.id !== id))
    try {
      await alertApi.markRead(id)
    } catch {
      // Revert on failure - reload from server
      void loadAlerts()
    }
  }

  const handleMarkAllRead = async () => {
    // Optimistic update: clear all
    setAlerts([])
    try {
      await alertApi.markAllRead()
    } catch {
      // Revert on failure - reload from server
      void loadAlerts()
    }
  }

  const dateStr = now.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short' })
  const timeStr = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })

  return (
    <>
      <header className="z-20 flex h-[60px] shrink-0 items-center justify-between border-b border-white/[0.08] bg-[rgba(15,25,35,0.45)] px-6 backdrop-blur-[20px]">
        <div className="flex items-center gap-4">
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={toggleCollapsed}
            className="text-slate-200"
          />
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-2 xl:flex">
            <span className="text-xs text-slate-400">{dateStr}</span>
            <span className="text-sm font-medium tabular-nums tracking-wider text-emerald-400">{timeStr}</span>
          </div>
          <Badge count={unreadCount} size="small" hidden={unreadCount === 0}>
            <div
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 transition-colors hover:bg-white/10"
              onClick={() => setAlertOpen(true)}
            >
              <BellOutlined />
            </div>
          </Badge>
          <Dropdown
            menu={{
              items: [
                {
                  key: 'changePassword',
                  icon: <KeyOutlined />,
                  label: '修改密码',
                  onClick: () => setPasswordModalOpen(true),
                },
                {
                  key: 'logout',
                  icon: <PoweroffOutlined />,
                  label: '退出登录',
                  onClick: () => {
                    // Read tenantCode before clearing state
                    const tenantCode = useAuthStore.getState().user?.tenantCode
                      || localStorage.getItem('wild-guardian-tenant-code')
                      || ''
                    logout()
                    navigate(tenantCode ? `/${tenantCode}/login` : '/login')
                  },
                },
              ],
            }}
          >
            <div className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 transition-colors hover:bg-white/10">
              <Avatar size={36} src={wildlifeTrailCamera} />
              <div className="hidden sm:block">
                <div className="text-sm font-medium text-slate-200">{user?.displayName ?? '管理员'}</div>
              </div>
              <DownOutlined className="text-xs text-slate-400" />
            </div>
          </Dropdown>
        </div>
      </header>

      <Drawer
        title={<span className="flex items-center gap-2"><WarningOutlined className="text-amber-400" /> 最近告警</span>}
        placement="right"
        width={400}
        open={alertOpen}
        onClose={() => setAlertOpen(false)}
        styles={{ body: { background: 'rgba(15, 25, 36, 0.92)', padding: 0 }, header: { background: 'rgba(10, 15, 24, 0.8)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' } }}
        zIndex={10000}
        extra={unreadCount > 0 ? (
          <Button type="link" size="small" icon={<CheckOutlined />} onClick={handleMarkAllRead}>
            全部已读
          </Button>
        ) : undefined}
      >
        <div className="flex flex-col gap-3 p-4">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="rounded-xl border border-white/10 bg-white/5 p-4 transition-colors hover:bg-white/10"
            >
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-red-400" />
                  <Tag color={levelColorMap[alert.level] ?? alertColorMap[alert.type] ?? 'blue'} className="m-0">{alert.type}</Tag>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="text"
                    size="small"
                    className="text-xs text-slate-400 hover:text-emerald-400"
                    onClick={() => handleMarkRead(alert.id)}
                  >
                    已读
                  </Button>
                  <span className="text-xs text-slate-500">{alert.time}</span>
                </div>
              </div>
              <p className="m-0 text-sm font-medium text-slate-200">{alert.title}</p>
              {alert.message && alert.message !== alert.title && (
                <p className="m-0 mt-1 text-xs text-slate-400">{alert.message}</p>
              )}
            </div>
          ))}
          {alerts.length === 0 && (
            <div className="py-8 text-center text-sm text-slate-500">暂无告警</div>
          )}
        </div>
      </Drawer>

      <ChangePasswordModal open={passwordModalOpen} onClose={() => setPasswordModalOpen(false)} />
    </>
  )
}