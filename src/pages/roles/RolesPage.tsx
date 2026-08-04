import { Button, Form, Input, Modal, Popconfirm, Space, Table, Tag, Tree, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useEffect, useMemo, useState } from 'react'
import { SectionCard } from '@/components/common/SectionCard'
import { roleApi } from '@/services/api'
import type { PermissionNode, RoleItem } from '@/types/models'
import { filterCheckedPermissions } from '@/utils/permission'

type TreeNode = {
  key: string
  title: string
  checkable?: boolean
  selectable?: boolean
  children?: TreeNode[]
}

export default function RolesPage({ hideTitle }: { hideTitle?: boolean }) {
  const [roles, setRoles] = useState<RoleItem[]>([])
  const [permissionTree, setPermissionTree] = useState<PermissionNode[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<RoleItem | null>(null)
  const [checkedPermissions, setCheckedPermissions] = useState<string[]>([])
  const [form] = Form.useForm()

  const treeData = useMemo(
    () =>
      permissionTree.map(function mapNode(item: PermissionNode): TreeNode {
        const isGroup = item.type === 'menu-group'
        return {
          key: item.key,
          title: item.label,
          checkable: !isGroup,
          selectable: !isGroup,
          children: item.children?.map(mapNode),
        }
      }),
    [permissionTree],
  )

  const columns: ColumnsType<RoleItem> = [
    {
      title: '角色名称',
      dataIndex: 'name',
      key: 'name',
      render: (value: string) => <Tag color={value === '超级管理员' ? 'red' : 'blue'}>{value}</Tag>,
    },
    { title: '角色编码', dataIndex: 'roleCode', key: 'roleCode' },
    { title: '权限说明', dataIndex: 'description', key: 'description' },
    { title: '绑定用户数', dataIndex: 'userCount', key: 'userCount' },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt' },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            disabled={record.roleCode === 'SUPER_ADMIN'}
            onClick={() => {
              setEditingRole(record)
              form.setFieldsValue({
                name: record.name,
                roleCode: record.roleCode,
                description: record.description,
              })
              setCheckedPermissions(record.permissions)
              setOpen(true)
            }}
          >
            编辑
          </Button>
          <Popconfirm
            title="确认删除该角色吗？"
            onConfirm={async () => {
              await roleApi.remove(record.id)
              message.success('删除角色成功')
              await loadRoles()
            }}
            disabled={record.roleCode === 'SUPER_ADMIN'}
          >
            <Button size="small" danger disabled={record.roleCode === 'SUPER_ADMIN'}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const loadRoles = async () => {
    setLoading(true)
    try {
      const result = await roleApi.query()
      setRoles(result.list)
      setPermissionTree(result.permissions)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadRoles()
  }, [])

  return (
    <div>
      <SectionCard
        title={hideTitle ? '' : '角色列表'}
        extra={
          <Button
            type="primary"
            onClick={() => {
              setEditingRole(null)
              form.resetFields()
              setCheckedPermissions([])
              setOpen(true)
            }}
          >
            新增角色
          </Button>
        }
      >
        <Table rowKey="id" columns={columns} dataSource={roles} loading={loading} pagination={false} />
      </SectionCard>

      <Modal
        title={editingRole ? '编辑角色' : '新增角色'}
        open={open}
        width={640}
        centered
        styles={{ body: { maxHeight: '65vh', overflowY: 'auto' } }}
        onCancel={() => setOpen(false)}
        onOk={async () => {
          const values = await form.validateFields()
          const payload = {
            name: values.name,
            roleCode: values.roleCode,
            description: values.description,
            permissions: filterCheckedPermissions(checkedPermissions),
          }
          if (!payload.permissions.length) {
            message.error('请至少选择一个权限')
            return
          }
          if (editingRole) {
            await roleApi.update(editingRole.id, payload)
            message.success('编辑角色成功')
          } else {
            await roleApi.create(payload)
            message.success('新增角色成功')
          }
          setOpen(false)
          await loadRoles()
        }}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="角色名称" rules={[{ required: true, message: '请输入角色名称' }]}>
            <Input placeholder="请输入角色名称" />
          </Form.Item>
          <Form.Item name="roleCode" label="角色编码">
            <Input placeholder="留空时自动生成" disabled={Boolean(editingRole?.isSystem)} />
          </Form.Item>
          <Form.Item name="description" label="权限说明" rules={[{ required: true, message: '请输入权限说明' }]}>
            <Input.TextArea rows={3} placeholder="请输入权限说明" />
          </Form.Item>
          <Form.Item label="权限配置" required>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-[10px]">
              <Tree
                checkable
                defaultExpandAll
                treeData={treeData}
                checkedKeys={checkedPermissions}
                onCheck={(keys) => setCheckedPermissions(keys as string[])}
              />
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}