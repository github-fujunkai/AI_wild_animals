import { Segmented } from 'antd'
import { useMemo, useState } from 'react'
import ImageLivePage from '@/pages/image/ImageLivePage'
import ImageQueryPage from '@/pages/image/ImageQueryPage'
import { useAuthStore } from '@/store/auth-store'
import { hasPermission, resolvePermissions } from '@/utils/permission'

type ImageTab = '实时点播' | '影像查询'

const tabPermissionMap: Record<ImageTab, string> = {
  '实时点播': 'images:live',
  '影像查询': 'images:query',
}

const EMPTY_PERMISSIONS: string[] = []

export default function ImagePage() {
  const user = useAuthStore((state) => state.user)
  const permissions = user ? resolvePermissions(user) : EMPTY_PERMISSIONS

  const availableTabs = useMemo<ImageTab[]>(() => {
    const allTabs: ImageTab[] = ['实时点播', '影像查询']
    return allTabs.filter((tab) => hasPermission(permissions, tabPermissionMap[tab]))
  }, [permissions])

  const [activeTab, setActiveTab] = useState<ImageTab>('实时点播')

  // If current tab is not available, switch to first available tab
  const currentTab = availableTabs.includes(activeTab) ? activeTab : availableTabs[0]

  if (availableTabs.length === 0) {
    return null
  }

  return (
    <div>
      {/* {availableTabs.length > 1 && (
        <div className="mb-4 flex items-center justify-between">
          <Segmented
            value={currentTab}
            onChange={(v) => setActiveTab(v as ImageTab)}
            options={[
              { value: '影像查询', label: '🖼️ 影像查询' },
              { value: '实时点播', label: '📹 实时点播' },
            ].filter((opt) => availableTabs.includes(opt.value as ImageTab))}
          />
        </div>
      )}
      {currentTab === '影像查询' && <ImageQueryPage />}
      {currentTab === '实时点播' && <ImageLivePage />} */}
      <ImageQueryPage />
    </div>
  )
}