import { Button, Form, Input, Modal, Popconfirm, Select, Space, Table, Tabs, Tag, Tree, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useEffect, useMemo, useState } from 'react'
import { SectionCard } from '@/components/common/SectionCard'
import { orgApi } from '@/services/api'
import type { DeviceItem, OrgDetail, OrgTreeNode } from '@/types/models'

const statusColorMap: Record<string, string> = {
  '在线': 'green',
  '离线': 'default',
  '告警': 'red',
  '低电量': 'gold',
}

function showRequestError(err: unknown, fallback: string) {
  const anyErr = err as any
  const backendMessage = anyErr?.response?.data?.message
  if (backendMessage) {
    message.error(String(backendMessage))
    return
  }
  const basicMessage = anyErr?.message
  if (basicMessage) {
    message.error(String(basicMessage))
    return
  }
  message.error(fallback)
}

export default function OrgsPage() {
  const [selectedOrgId, setSelectedOrgId] = useState<string>('')
  const [selectedOrg, setSelectedOrg] = useState('')
  const [treeData, setTreeData] = useState<OrgTreeNode[]>([])
  const [summary, setSummary] = useState<OrgDetail | null>(null)
  const [orgDevices, setOrgDevices] = useState<DeviceItem[]>([])
  const [deviceTotal, setDeviceTotal] = useState(0)
  const [devicePage, setDevicePage] = useState(1)
  const [devicePageSize, setDevicePageSize] = useState(10)
  const [loading, setLoading] = useState(true)
  const [deviceLoading, setDeviceLoading] = useState(false)
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([])

  // 收集树所有节点的 key，用于默认全部展开
  const getAllKeys = (nodes: OrgTreeNode[]): React.Key[] => {
    const keys: React.Key[] = []
    const walk = (list: OrgTreeNode[]) => {
      for (const node of list) {
        keys.push(node.key)
        if (node.children?.length) walk(node.children)
      }
    }
    walk(nodes)
    return keys
  }
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<string[]>([])
  const [orgModalOpen, setOrgModalOpen] = useState(false)
  const [orgEditing, setOrgEditing] = useState(false)
  const [moveModalOpen, setMoveModalOpen] = useState(false)
  const [orgForm] = Form.useForm()
  const [moveForm] = Form.useForm()

  // orgOptions value 保持字符串，避免 int64 精度丢失
  const orgOptions = useMemo(() => {
    const result: Array<{ label: string; value: string }> = []
    const walk = (nodes: OrgTreeNode[], parents: string[] = []) => {
      nodes.forEach((node) => {
        const nextParents = [...parents, node.title]
        result.push({ label: nextParents.join(' / '), value: node.key })
        if (node.children?.length) {
          walk(node.children, nextParents)
        }
      })
    }
    walk(treeData)
    return result
  }, [treeData])

  const orgNameMap = useMemo(() => {
    const result = new Map<string, string>()
    const walk = (nodes: OrgTreeNode[]) => {
      nodes.forEach((node) => {
        result.set(node.key, node.title)
        if (node.children?.length) {
          walk(node.children)
        }
      })
    }
    walk(treeData)
    return result
  }, [treeData])

  const resolveOrgName = (orgId?: string | null, orgName?: string) => {
    if (orgName?.trim()) return orgName.trim()
    if (orgId) return orgNameMap.get(orgId) ?? '-'
    return '-'
  }

  const parentOrgOptions = useMemo(
    () => (orgEditing ? orgOptions.filter((item) => item.value !== selectedOrgId) : orgOptions),
    [orgEditing, orgOptions, selectedOrgId],
  )

  const deviceColumns: ColumnsType<DeviceItem> = [
    { title: '设备名称', dataIndex: 'name', key: 'name' },
    { title: 'IMEI', dataIndex: 'imei', key: 'imei' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (value: string) => <Tag color={statusColorMap[value] ?? 'default'}>{value}</Tag>,
    },
    { title: '电量', dataIndex: 'battery', key: 'battery', render: (value: number) => `${value}%` },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button
          size="small"
          onClick={() => {
            setSelectedDeviceIds([record.id])
            moveForm.setFieldsValue({ targetOrgId: undefined })
            setMoveModalOpen(true)
          }}
        >
          移动
        </Button>
      ),
    },
  ]

  const loadOrgTree = async () => {
    const tree = await orgApi.tree()
    setTreeData(tree)
    setExpandedKeys(getAllKeys(tree))
  }

  const loadOrgDevices = async (orgId: string, nextPage = devicePage, nextPageSize = devicePageSize) => {
    setDeviceLoading(true)
    try {
      const result = await orgApi.devices(orgId, { page: nextPage, pageSize: nextPageSize })
      setOrgDevices(result.list)
      setDeviceTotal(result.total)
      setDevicePage(result.page)
      setDevicePageSize(result.pageSize)
    } finally {
      setDeviceLoading(false)
    }
  }

  const loadOrgDetail = async (orgId: string) => {
    try {
      const detail = await orgApi.detail(orgId)
      setSummary(detail)
      setSelectedOrg(detail.name)
    } catch {
      message.error('组织不存在或已被删除')
      if (treeData.length > 0) {
        const firstKey = treeData[0].key
        setSelectedOrgId(firstKey)
        setSelectedOrg(treeData[0].title)
        await loadOrgDetail(firstKey)
      }
    }
  }

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const tree = await orgApi.tree()
          setTreeData(tree)
          setExpandedKeys(getAllKeys(tree))
          const firstOrgId = tree.length > 0 ? tree[0].key : ''
        if (firstOrgId) {
          const [detail, deviceResult] = await Promise.all([
            orgApi.detail(firstOrgId),
            orgApi.devices(firstOrgId, { page: 1, pageSize: 10 }),
          ])
          setSelectedOrgId(firstOrgId)
          setSelectedOrg(detail.name)
          setSummary(detail)
          setOrgDevices(deviceResult.list)
          setDeviceTotal(deviceResult.total)
        }
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [])

  const refreshOrgData = async (orgId?: string) => {
    const id = orgId ?? selectedOrgId
    if (!id) return
    await loadOrgTree()
    await Promise.all([loadOrgDetail(id), loadOrgDevices(id, 1, devicePageSize)])
  }

  return (
    <>
    <div className="flex h-full gap-4">
      {/* 左侧：组织树 */}
      <div className="w-[350px] shrink-0">
        <SectionCard title="" className="!mb-0 flex h-full flex-col">
            <h3 className="text-base font-semibold text-slate-200 mb-4">组织机构树</h3>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex gap-2">
              <Button
                size="small"
                onClick={() => {
                  if (!summary) return
                  setOrgEditing(true)
                  orgForm.setFieldsValue({
                    name: summary.name,
                    parentId: summary.parentId != null ? String(summary.parentId) : undefined,
                    orgCode: summary.orgCode,
                    description: summary.description === '-' ? '' : summary.description,
                  })
                  setOrgModalOpen(true)
                }}
              >
                ✏️ 编辑
              </Button>
              <Popconfirm
                title="确认删除该组织吗？删除后不可恢复。"
                onConfirm={async () => {
                  try {
                    await orgApi.remove(selectedOrgId)
                    message.success('删除组织成功')
                    const newTree = await orgApi.tree()
                    setTreeData(newTree)
                    setExpandedKeys(getAllKeys(newTree))
                    const firstId = newTree.length > 0 ? newTree[0].key : ''
                    setSelectedOrgId(firstId)
                    setSelectedOrg(newTree[0]?.title ?? '')
                    if (firstId) {
                      await refreshOrgData(firstId)
                    }
                  } catch (err) {
                    showRequestError(err, '删除组织失败')
                  }
                }}
              >
                <Button size="small" danger>
                  🗑️ 删除
                </Button>
              </Popconfirm>
              <Button
                size="small"
                type="primary"
                onClick={() => {
                  setOrgEditing(false)
                  orgForm.resetFields()
                  orgForm.setFieldsValue({ parentId: selectedOrgId || undefined })
                  setOrgModalOpen(true)
                }}
              >
                + 新增
              </Button>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <Tree
              treeData={treeData}
              expandedKeys={expandedKeys}
              onExpand={(keys) => setExpandedKeys(keys)}
              selectedKeys={[selectedOrgId]}
              onSelect={async (keys, info) => {
                if (keys.length === 0) return
                const orgId = String(keys[0])
                if (!orgId) return
                setSelectedOrgId(orgId)
                setSelectedOrg(String(info.node.title))
                await Promise.all([loadOrgDetail(orgId), loadOrgDevices(orgId, 1, devicePageSize)])
              }}
              className="rounded-2xl border border-white/[0.06] bg-white/[0.04] p-3 backdrop-blur-[10px]"
            />
          </div>
        </SectionCard>
      </div>

      {/* 右侧：组织详情 */}
      <div className="min-w-0 flex-1">
        <SectionCard title="" className="!mb-0 flex h-full flex-col overflow-y-auto">
          {/* 组织名称 + 编辑按钮 */}
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-semibold text-slate-100">{summary?.name ?? selectedOrg}</h3>
            <Button
              size="small"
              onClick={() => {
                if (!summary) return
                setOrgEditing(true)
                orgForm.setFieldsValue({
                  name: summary.name,
                  parentId: summary.parentId != null ? String(summary.parentId) : undefined,
                  orgCode: summary.orgCode,
                  description: summary.description === '-' ? '' : summary.description,
                })
                setOrgModalOpen(true)
              }}
            >
              ✏️ 编辑
            </Button>
          </div>

          {/* 统计卡片 */}
          <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 p-4">
              <div className="text-xs uppercase tracking-[0.15em] text-slate-500">下属设备</div>
              <div className="mt-2 text-3xl font-bold text-slate-100">{summary?.deviceCount ?? 0}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-blue-500/10 to-blue-500/5 p-4">
              <div className="text-xs uppercase tracking-[0.15em] text-slate-500">成员数量</div>
              <div className="mt-2 text-3xl font-bold text-slate-100">{summary?.memberCount ?? 0}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-purple-500/10 to-purple-500/5 p-4">
              <div className="text-xs uppercase tracking-[0.15em] text-slate-500">下级组织</div>
              <div className="mt-2 text-3xl font-bold text-slate-100">{summary?.childCount ?? 0}</div>
            </div>
          </div>

          {/* 标签页 */}
          <Tabs
            items={[
              {
                key: 'info',
                label: '📋 基本信息',
                children: (
                  <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="mb-1 text-xs text-slate-500">组织编码</div>
                      <div className="text-sm text-slate-200">{summary?.orgCode ?? '-'}</div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="mb-1 text-xs text-slate-500">上级组织</div>
                      <div className="text-sm text-slate-200">{resolveOrgName(String(summary?.parentId), summary?.parentName)}</div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="mb-1 text-xs text-slate-500">创建时间</div>
                      <div className="text-sm text-slate-200">{summary?.createdAt ?? '-'}</div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="mb-1 text-xs text-slate-500">组织描述</div>
                      <div className="text-sm text-slate-200">{summary?.description ?? '-'}</div>
                    </div>
                  </div>
                ),
              },
              {
                key: 'devices',
                label: '📹 设备列表',
                children: (
                  <>
                    <div className="mb-4 flex items-center justify-between">
                      <span className="text-sm text-slate-400">组织下设备列表</span>
                      <Button
                        size="small"
                        disabled={selectedDeviceIds.length === 0}
                        onClick={() => {
                          moveForm.resetFields()
                          setMoveModalOpen(true)
                        }}
                      >
                        批量移动
                      </Button>
                    </div>
                    <Table
                      rowKey="id"
                      rowSelection={{
                          selectedRowKeys: selectedDeviceIds,
                          onChange: (keys) => setSelectedDeviceIds(keys as string[]),
                        }}
                      columns={deviceColumns}
                      dataSource={orgDevices}
                      pagination={{
                        current: devicePage,
                        pageSize: devicePageSize,
                        total: deviceTotal,
                        onChange: (page, pageSize) => {
                          void loadOrgDevices(selectedOrgId, page, pageSize)
                        },
                        showSizeChanger: true,
                        showTotal: (total) => `共 ${total} 条`,
                      }}
                      loading={deviceLoading}
                      size="small"
                    />
                  </>
                ),
              },
            ]}
          />
        </SectionCard>
      </div>
    </div>

      <Modal
        title={orgEditing ? '编辑组织' : '新增组织机构'}
        open={orgModalOpen}
        destroyOnHidden
        onCancel={() => setOrgModalOpen(false)}
        onOk={async () => {
          try {
            const values = await orgForm.validateFields()
            const payload = {
              name: values.name,
              parentId: values.parentId ?? null,
              orgCode: values.orgCode?.trim() || `ORG-${Date.now()}`,
              description: values.description ?? '',
            }
            if (orgEditing) {
              await orgApi.update(selectedOrgId, payload)
              message.success('编辑组织成功')
            } else {
              await orgApi.create(payload)
              message.success('新增组织成功')
            }
            setOrgModalOpen(false)
            await refreshOrgData()
          } catch (err) {
            if ((err as any)?.errorFields) return
            showRequestError(err, orgEditing ? '编辑组织失败' : '新增组织失败')
          }
        }}
      >
        <Form form={orgForm} layout="vertical">
          <Form.Item name="name" label="组织名称" rules={[{ required: true, message: '请输入组织名称' }]}>
            <Input placeholder="请输入组织名称" />
          </Form.Item>
          <Form.Item name="parentId" label="上级组织">
            <Select
              allowClear
              options={parentOrgOptions}
              showSearch
              optionFilterProp="label"
              placeholder="不选则为顶级组织"
            />
          </Form.Item>
          <Form.Item name="orgCode" label="组织编码">
            <Input placeholder="自动生成或手动输入" disabled={orgEditing} />
          </Form.Item>
          <Form.Item name="description" label="组织描述">
            <Input.TextArea rows={3} placeholder="组织描述信息" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="移动设备"
        open={moveModalOpen}
        onCancel={() => setMoveModalOpen(false)}
        onOk={async () => {
          try {
            const values = await moveForm.validateFields()
            await orgApi.moveDevices(selectedDeviceIds, values.targetOrgId)
            message.success('设备移动成功')
            setMoveModalOpen(false)
            setSelectedDeviceIds([])
            await loadOrgDevices(selectedOrgId)
          } catch (err) {
            if ((err as any)?.errorFields) return
            showRequestError(err, '设备移动失败')
          }
        }}
      >
        <Form form={moveForm} layout="vertical">
          <Form.Item name="targetOrgId" label="目标组织" rules={[{ required: true, message: '请选择目标组织' }]}>
            <Select options={orgOptions.filter((item) => item.value !== selectedOrgId)} showSearch optionFilterProp="label" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}