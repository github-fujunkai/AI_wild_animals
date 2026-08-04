import { Tabs } from 'antd'
import { UserOutlined, SafetyOutlined } from '@ant-design/icons'
import { useState } from 'react'
import UsersPage from '@/pages/users/UsersPage'
import RolesPage from '@/pages/roles/RolesPage'

export default function SystemPage() {
  const [activeKey, setActiveKey] = useState('users')

  return (
    <div className="flex h-full flex-col">
      <Tabs
        activeKey={activeKey}
        onChange={setActiveKey}
        className="mb-0 px-2 pt-2"
        items={[
          {
            key: 'users',
            label: (
              <span>
                <UserOutlined className="mr-1" />
                用户管理
              </span>
            ),
            children: <UsersPage hideTitle />,
          },
          {
            key: 'roles',
            label: (
              <span>
                <SafetyOutlined className="mr-1" />
                角色权限
              </span>
            ),
            children: <RolesPage hideTitle />,
          },
        ]}
      />
    </div>
  )
}