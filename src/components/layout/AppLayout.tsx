import { Layout } from 'antd'
import { Outlet } from 'react-router-dom'
import { AppHeader } from '@/components/layout/AppHeader'
import { AppSider } from '@/components/layout/AppSider'
import { ChangePasswordModal } from '@/components/auth/ChangePasswordModal'
import { useAuthStore } from '@/store/auth-store'
import mainBg from '@/assets/main.jpg'

export function AppLayout() {
  const mustChangePassword = useAuthStore((state) => state.mustChangePassword)

  return (
    <Layout className="h-screen overflow-hidden">
      {/* Background image with overlay */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage: `linear-gradient(rgba(10, 15, 24, 0.45), rgba(10, 15, 24, 0.45)), url(${mainBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          backgroundRepeat: 'no-repeat',
        }}
      />
      <AppSider />
      <Layout className="relative z-10 flex flex-col">
        <AppHeader />
        <Layout.Content
          className="overflow-y-auto p-6"
          style={{ flex: '1 1 0%', minHeight: 0 }}
        >
          <Outlet />
        </Layout.Content>
      </Layout>
      <ChangePasswordModal
        open={mustChangePassword}
        forced
        onClose={() => {}}
      />
    </Layout>
  )
}