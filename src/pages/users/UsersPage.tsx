import { Button, Form, Input, Modal, Popconfirm, Select, Space, Switch, Tag, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useEffect, useState } from 'react'
import { PagedTable } from '@/components/common/PagedTable'
import { SectionCard } from '@/components/common/SectionCard'
import { orgApi, roleApi, userApi } from '@/services/api'
import type { OrgTreeNode, RoleItem, UserItem } from '@/types/models'
import { useOrgFilter } from '@/hooks/useOrgFilter'

export default function UsersPage({ hideTitle }: { hideTitle?: boolean }) {
  const [users, setUsers] = useState<UserItem[]>([])
  const [roles, setRoles] = useState<RoleItem[]>([])
  const [rawOrgTree, setRawOrgTree] = useState<OrgTreeNode[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | undefined>()
  const [editingUser, setEditingUser] = useState<UserItem | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [passwordOpen, setPasswordOpen] = useState(false)
  const [passwordUser, setPasswordUser] = useState<UserItem | null>(null)
  const [form] = Form.useForm()
  const [passwordForm] = Form.useForm()

  const { orgOnlyOptions: orgOptions } = useOrgFilter(rawOrgTree)

  const loadUsers = async (nextPage = page, nextPageSize = pageSize, nextKeyword = keyword, nextStatus = statusFilter) => {
    setLoading(true)
    try {
      const result = await userApi.query({
        page: nextPage,
        pageSize: nextPageSize,
        keyword: nextKeyword,
        status: nextStatus,
      })
      setUsers(result.list)
      setTotal(result.total)
      setPage(result.page)
      setPageSize(result.pageSize)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [userResult, roleResult, tree] = await Promise.all([
          userApi.query({ page: 1, pageSize: 10 }),
          roleApi.query(),
          orgApi.tree(),
        ])
        setUsers(userResult.list)
        setTotal(userResult.total)
        setPage(userResult.page)
        setPageSize(userResult.pageSize)
        setRoles(roleResult.list)
        setRawOrgTree(tree)
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [])

  const columns: ColumnsType<UserItem> = [
    { title: '账号', dataIndex: 'username', key: 'username' },
    { title: '显示名称', dataIndex: 'displayName', key: 'displayName' },
    {
      title: '角色',
      dataIndex: 'roleName',
      key: 'roleName',
      render: (value: string, record: UserItem) => (
        <Tag color={record.isTenantAdmin ? 'gold' : value.includes('管理员') ? 'red' : 'blue'}>
          {record.isTenantAdmin ? '租户管理员' : value}
        </Tag>
      ),
    },
    { title: '所属组织', dataIndex: 'orgName', key: 'orgName', render: (value: string) => value || '-' },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (value: string) => <Tag color={value === '启用' ? 'green' : 'default'}>{value}</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space wrap>
          <Button
            size="small"
            disabled={record.isTenantAdmin}
            onClick={() => {
              setEditingUser(record)
              form.setFieldsValue({
                username: record.username,
                displayName: record.displayName,
                roleId: record.roleId,
                orgId: record.orgId ?? undefined,
                status: record.status === '启用' ? 1 : 0,
              })
              setEditOpen(true)
            }}
          >
            编辑
          </Button>
          <Button
            size="small"
            onClick={() => {
              setPasswordUser(record)
              passwordForm.resetFields()
              setPasswordOpen(true)
            }}
          >
            重置密码
          </Button>
          <Switch
            size="small"
            checked={record.status === '启用'}
            disabled={record.isTenantAdmin}
            onChange={async (checked) => {
              try {
                await userApi.updateStatus(record.id, checked)
                message.success('状态更新成功')
                await loadUsers()
              } catch (err: unknown) {
                message.error(err instanceof Error ? err.message : '操作失败')
              }
            }}
          />
          <Popconfirm
            title="确认删除该用户吗？"
            onConfirm={async () => {
              try {
                await userApi.remove(record.id)
                message.success('删除成功')
                await loadUsers()
              } catch (err: unknown) {
                message.error(err instanceof Error ? err.message : '删除失败')
              }
            }}
            disabled={record.isTenantAdmin}
          >
            <Button size="small" danger disabled={record.isTenantAdmin}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <SectionCard
        title={hideTitle ? '' : '用户列表'}
        extra={
          <Button
            type="primary"
            onClick={() => {
              setEditingUser(null)
              form.resetFields()
              form.setFieldsValue({ status: 1 })
              setEditOpen(true)
            }}
          >
            新增用户
          </Button>
        }
      >
        <div className="mb-4 flex flex-wrap gap-3">
          <Input.Search
            allowClear
            placeholder="搜索账号/显示名称/组织"
            className="max-w-sm"
            onSearch={async (value) => {
              setKeyword(value)
              await loadUsers(1, pageSize, value, statusFilter)
            }}
          />
          <Select
            allowClear
            placeholder="按状态筛选"
            className="w-40"
            options={[
              { label: '启用', value: '启用' },
              { label: '禁用', value: '禁用' },
            ]}
            onChange={async (value) => {
              setStatusFilter(value)
              await loadUsers(1, pageSize, keyword, value)
            }}
          />
        </div>
        <PagedTable
          rowKey="id"
          columns={columns}
          dataSource={users}
          loading={loading}
          current={page}
          pageSize={pageSize}
          total={total}
          onPageChange={(nextPage, nextPageSize) => {
            void loadUsers(nextPage, nextPageSize)
          }}
        />
      </SectionCard>

      <Modal
        title={editingUser ? '编辑用户' : '新增用户'}
        open={editOpen}
        destroyOnHidden
        onCancel={() => setEditOpen(false)}
        onOk={async () => {
          try {
            const values = await form.validateFields()
            const payload = {
              username: values.username,
              password: values.password,
              displayName: values.displayName,
              roleId: values.roleId,
              orgId: values.orgId ?? null,
              status: values.status,
            }
            if (editingUser) {
              await userApi.update(editingUser.id, payload)
              message.success('编辑用户成功')
            } else {
              await userApi.create(payload)
              message.success('新增用户成功')
            }
            setEditOpen(false)
            await loadUsers()
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : '操作失败'
            message.error(msg)
          }
        }}
      >
        <Form form={form} layout="vertical" initialValues={{ status: 1 }}>
          <Form.Item name="username" label="账号" rules={[{ required: true, message: '请输入账号' }]}>
            <Input disabled={Boolean(editingUser)} placeholder="请输入账号" />
          </Form.Item>
          {!editingUser ? (
            <Form.Item name="password" label="密码" rules={[{ required: true, message: '请输入初始密码' }]}>
              <Input.Password placeholder="请输入初始密码" />
            </Form.Item>
          ) : null}
          <Form.Item name="displayName" label="显示名称" rules={[{ required: true, message: '请输入显示名称' }]}>
            <Input placeholder="请输入显示名称" />
          </Form.Item>
          <Form.Item name="roleId" label="绑定角色" rules={[{ required: true, message: '请选择角色' }]}>
            <Select options={roles.map((item) => ({ label: item.name, value: item.id }))} />
          </Form.Item>
          <Form.Item name="orgId" label="所属组织">
            <Select allowClear options={orgOptions} placeholder="请选择所属组织" />
          </Form.Item>
          <Form.Item name="status" label="状态" rules={[{ required: true, message: '请选择状态' }]}>
            <Select
              options={[
                { label: '启用', value: 1 },
                { label: '禁用', value: 0 },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`重置密码${passwordUser ? ` - ${passwordUser.displayName}` : ''}`}
        open={passwordOpen}
        destroyOnHidden
        onCancel={() => setPasswordOpen(false)}
        onOk={async () => {
          try {
            const values = await passwordForm.validateFields()
            if (!passwordUser) return
            await userApi.resetPassword(passwordUser.id, values.password)
            message.success('重置密码成功')
            setPasswordOpen(false)
          } catch (err: unknown) {
            message.error(err instanceof Error ? err.message : '重置密码失败')
          }
        }}
      >
        <Form form={passwordForm} layout="vertical">
          <Form.Item name="password" label="新密码" rules={[{ required: true, message: '请输入新密码' }]}>
            <Input.Password placeholder="请输入新密码" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
