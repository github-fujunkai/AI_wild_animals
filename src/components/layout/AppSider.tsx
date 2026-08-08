import {
  ApartmentOutlined,
  BarChartOutlined,
  CameraOutlined,
  DashboardOutlined,
  EnvironmentOutlined,
  MessageOutlined,
  RobotOutlined,
  SettingOutlined,
  ToolOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons'
import { Layout, Menu } from 'antd'
import type { MenuProps } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth-store'
import { useLayoutStore } from '@/store/layout-store'
import { hasPermission, resolvePermissions } from '@/utils/permission'
import { versionApi } from '@/services/api'

const items = [
  { key: '/home', icon: <DashboardOutlined />, label: '首页', permission: 'home:view', module: '首页' },
  { key: '/image', icon: <VideoCameraOutlined />, label: '影像数据', permission: 'images:view', module: '影像数据' },
  { key: '/data', icon: <BarChartOutlined />, label: '数据展示', permission: 'data:view', module: '数据展示' },
  { key: '/devices', icon: <CameraOutlined />, label: '设备管理', permission: 'devices:view', module: '设备管理' },
  { key: '/species', icon: <RobotOutlined />, label: 'AI物种分析', permission: 'species:view', module: 'AI物种分析' },
  { key: '/agent', icon: <MessageOutlined />, label: '生态AI助手', permission: 'agent:view', module: '生态AI助手' },
  { key: '/patrol', icon: <ApartmentOutlined />, label: '巡护工单', permission: 'patrol:view', module: '巡护工单' },
  { key: '/ops', icon: <ToolOutlined />, label: '设备运维中心', permission: 'ops:view', module: '设备运维中心' },
  { key: '/env', icon: <EnvironmentOutlined />, label: '环境监测', permission: 'env:view', module: '环境监测' },
  { key: '/system', icon: <SettingOutlined />, label: '用户管理', permission: 'users:view', module: '用户管理' },
  { key: '/orgs', icon: <ApartmentOutlined />, label: '组织机构', permission: 'orgs:view', module: '组织机构' },
]

const EMPTY_PERMISSIONS: string[] = []

export function AppSider() {
  const navigate = useNavigate()
  const location = useLocation()
  const collapsed = useLayoutStore((state) => state.collapsed)
  const user = useAuthStore((state) => state.user)
  const permissions = user ? resolvePermissions(user) : EMPTY_PERMISSIONS
  const [versionInfo, setVersionInfo] = useState<{ version: string; buildTime: string } | null>(null)

  useEffect(() => {
    versionApi.getVersion().then(setVersionInfo).catch(() => {})
  }, [])

  const menuItems = useMemo<MenuProps['items']>(
    () => items.filter((item) => {
      // Platform-level: tenant modules control which menus are visible
      // If user has tenantModules (even empty array), enforce module filtering
      if (user?.tenantModules !== undefined) {
        if (user.tenantModules.length === 0) return false // no modules = no menu
        if (!user.tenantModules.includes(item.module)) return false
      }
      // Role-level: user must have the required permission
      if (!hasPermission(permissions, item.permission)) return false
      return true
    }),
    [permissions, user?.tenantModules],
  )

  const selectedKeys = useMemo(() => {
    const path = location.pathname
    // /image 下的子路由统一高亮 /image 菜单项
    if (path.startsWith('/image')) {
      return ['/image']
    }
    // /data 下的子路由统一高亮 /data 菜单项
    if (path.startsWith('/data')) {
      return ['/data']
    }
    // /species 下的子路由统一高亮 /species 菜单项
    if (path.startsWith('/species')) {
      return ['/species']
    }
    // /system 统一高亮
    if (path.startsWith('/system')) {
      return ['/system']
    }
    return [path]
  }, [location.pathname])

  return (
    <Layout.Sider
      collapsible
      trigger={null}
      collapsed={collapsed}
      width={220}
      className="!border-r !border-white/[0.06] !bg-[rgba(10,15,24,0.25)] !shadow-[0_0_32px_rgba(0,0,0,0.24)] backdrop-blur-[16px]"
    >
      <div className="flex h-[60px] items-center border-b border-white/[0.08] px-10">
        {!collapsed ? (
          <div>
            <div className="text-sm font-semibold text-slate-50">野外守望者 2.0</div>
          </div>
        ) : null}
      </div>
      <Menu
        mode="inline"
        selectedKeys={selectedKeys}
        items={menuItems}
        onClick={({ key }) => navigate(key)}
        className="min-h-0 flex-1 overflow-y-auto border-none bg-transparent px-3 py-4 text-slate-300"
        theme="dark"
      />
      {versionInfo && (
        <div className="flex h-8 items-center justify-center text-[10px] text-slate-600">
          {collapsed ? `v${versionInfo.version}` : `v${versionInfo.version} · ${versionInfo.buildTime}`}
        </div>
      )}
    </Layout.Sider>
  )
}