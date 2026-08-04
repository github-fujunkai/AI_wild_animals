import { Button, Result } from 'antd'
import { Navigate, Outlet, Route, Routes, useLocation, useParams } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { EcoAgentPage } from '@/pages/agent/EcoAgentPage'
import DevicesPage from '@/pages/devices/DevicesPage'
import DeviceOpsPage from '@/pages/ops/DeviceOpsPage'
import EnvMonitorPage from '@/pages/env/EnvMonitorPage'
import HomePage from '@/pages/home/HomePage'
import ImageDataPage from '@/pages/image/ImageDataPage'
import ImagePage from '@/pages/image/ImagePage'
import LoginPage from '@/pages/login/LoginPage'
import OrgsPage from '@/pages/orgs/OrgsPage'
import SpeciesAnalysisPage from '@/pages/species/SpeciesAnalysisPage'
import SystemPage from '@/pages/system/SystemPage'
import { useAuthStore } from '@/store/auth-store'
import { hasPermission, resolvePermissions } from '@/utils/permission'

const EMPTY_PERMISSIONS: string[] = []

function RequireAuth() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const location = useLocation()

  if (!isAuthenticated) {
    // Redirect to tenant-specific login if we have a saved tenantCode
    const tenantCode = useAuthStore.getState().user?.tenantCode
      || localStorage.getItem('wild-guardian-tenant-code')
      || ''
    const loginPath = tenantCode ? `/${tenantCode}/login` : '/login'
    return <Navigate to={loginPath} replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}

function AppNotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0b141d]">
      <Result
        status="404"
        title="页面不存在"
        subTitle="请返回有效的一期模块页面。"
        extra={
          <Button type="primary" href="/home">
            返回首页
          </Button>
        }
      />
    </div>
  )
}

function RequirePermission({ permission, children }: { permission: string; children: JSX.Element }) {
  const user = useAuthStore((state) => state.user)
  const permissions = user ? resolvePermissions(user) : EMPTY_PERMISSIONS

  if (!hasPermission(permissions, permission)) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Result status="403" title="无权限访问" subTitle="当前账号没有访问该页面的权限。" />
      </div>
    )
  }

  return children
}

// Tenant-specific login page that extracts tenantCode from URL
function TenantLoginPage() {
  const { tenantCode } = useParams()
  return <LoginPage tenantCode={tenantCode ?? ''} />
}

export function AppRouter() {
  return (
    <Routes>
      {/* Tenant-specific login: /qinghe-wetland/login */}
      <Route path="/:tenantCode/login" element={<TenantLoginPage />} />
      {/* Default login (no tenant, for super admin) */}
      <Route path="/login" element={<LoginPage tenantCode="" />} />
      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<RequirePermission permission="home:view"><HomePage /></RequirePermission>} />
          <Route path="/image" element={<RequirePermission permission="images:view"><ImagePage /></RequirePermission>} />
          <Route path="/data" element={<RequirePermission permission="data:view"><ImageDataPage /></RequirePermission>} />
          <Route path="/devices" element={<RequirePermission permission="devices:view"><DevicesPage /></RequirePermission>} />
          <Route path="/species" element={<RequirePermission permission="species:view"><SpeciesAnalysisPage /></RequirePermission>} />
          <Route path="/agent" element={<RequirePermission permission="agent:view"><EcoAgentPage /></RequirePermission>} />
          <Route path="/system" element={<RequirePermission permission="users:view"><SystemPage /></RequirePermission>} />
          <Route path="/orgs" element={<RequirePermission permission="orgs:view"><OrgsPage /></RequirePermission>} />
          <Route path="/ops" element={<RequirePermission permission="ops:view"><DeviceOpsPage /></RequirePermission>} />
          <Route path="/env" element={<RequirePermission permission="env:view"><EnvMonitorPage /></RequirePermission>} />
        </Route>
      </Route>
      <Route path="*" element={<AppNotFound />} />
    </Routes>
  )
}