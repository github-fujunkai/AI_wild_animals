import { Button, Form, Image, Input, Modal, Popconfirm, Select, Tag, Upload, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { PlusOutlined } from '@ant-design/icons'
import { useEffect, useState } from 'react'
import { PagedTable } from '@/components/common/PagedTable'
import { PageToolbar } from '@/components/common/PageToolbar'
import { SectionCard } from '@/components/common/SectionCard'
import { agentApi } from '@/services/api'
import type { AgentWorkOrder } from '@/services/api'

const STATUS_MAP: Record<AgentWorkOrder['status'], { text: string; color: string }> = {
  pending: { text: '待处理', color: 'gold' },
  processing: { text: '处理中', color: 'blue' },
  done: { text: '已完成', color: 'green' },
}

const STATUS_OPTIONS = Object.entries(STATUS_MAP).map(([value, m]) => ({
  value: value as AgentWorkOrder['status'],
  label: m.text,
}))

// 现场图片上传（读取为 base64，配合 Form.Item 的 value/onChange 受控）
function OrderImageUpload({ value = [], onChange }: { value?: string[]; onChange?: (v: string[]) => void }) {
  const handleBeforeUpload = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => onChange?.([...value, String(reader.result)])
    reader.readAsDataURL(file)
    return false
  }
  return (
    <div className="flex flex-wrap items-start gap-2">
      {value.map((img, i) => (
        <div key={i} className="relative">
          <Image src={img} width={80} height={80} className="!rounded-md object-cover" />
          <button
            type="button"
            onClick={() => onChange?.(value.filter((_, idx) => idx !== i))}
            className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[11px] leading-none text-white hover:bg-red-600"
          >
            ×
          </button>
        </div>
      ))}
      <Upload listType="picture-card" showUploadList={false} beforeUpload={handleBeforeUpload} accept="image/*">
        <div>
          <PlusOutlined />
          <div style={{ marginTop: 8 }}>上传</div>
        </div>
      </Upload>
    </div>
  )
}

export default function PatrolOrdersPage() {
  const [orders, setOrders] = useState<AgentWorkOrder[]>([])
  const [total, setTotal] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [loading, setLoading] = useState(false)

  const [createOpen, setCreateOpen] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [createForm] = Form.useForm()

  const [editOpen, setEditOpen] = useState(false)
  const [editLoading, setEditLoading] = useState(false)
  const [editId, setEditId] = useState<string>()
  const [editForm] = Form.useForm()

  async function loadOrders(page = currentPage, ps = pageSize) {
    setLoading(true)
    try {
      const result = await agentApi.getWorkOrders({ page, pageSize: ps })
      setOrders(result.list)
      setTotal(result.total)
    } catch (err) {
      message.error(err instanceof Error ? err.message : '加载工单失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleStatusChange(id: string, status: AgentWorkOrder['status']) {
    try {
      await agentApi.updateWorkOrderStatus(id, status)
      message.success('工单状态已更新')
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)))
    } catch (err) {
      message.error(err instanceof Error ? err.message : '更新状态失败')
    }
  }

  async function handleCreate() {
    const values = await createForm.validateFields()
    setCreateLoading(true)
    try {
      await agentApi.createWorkOrderManual({
        title: values.title,
        status: values.status,
        assignee: values.assignee,
        remark: values.remark,
        images: values.images,
      })
      message.success('工单已创建')
      setCreateOpen(false)
      createForm.resetFields()
      loadOrders(1, pageSize)
      setCurrentPage(1)
    } catch (err) {
      message.error(err instanceof Error ? err.message : '创建失败')
    } finally {
      setCreateLoading(false)
    }
  }

  function openEdit(record: AgentWorkOrder) {
    setEditId(record.id)
    editForm.setFieldsValue({
      title: record.title,
      assignee: record.assignee,
      remark: record.remark,
      images: record.images ?? [],
    })
    setEditOpen(true)
  }

  async function handleEdit() {
    if (!editId) return
    const values = await editForm.validateFields()
    setEditLoading(true)
    try {
      await agentApi.updateWorkOrder(editId, {
        title: values.title,
        assignee: values.assignee,
        remark: values.remark,
        images: values.images,
      })
      message.success('工单已更新')
      setEditOpen(false)
      loadOrders()
    } catch (err) {
      message.error(err instanceof Error ? err.message : '更新失败')
    } finally {
      setEditLoading(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      await agentApi.deleteWorkOrder(id)
      message.success('工单已删除')
      loadOrders()
    } catch (err) {
      message.error(err instanceof Error ? err.message : '删除失败')
    }
  }

  const columns: ColumnsType<AgentWorkOrder> = [
    { title: '工单编号', dataIndex: 'id', width: 130 },
    { title: '工单标题', dataIndex: 'title', width: 260 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (s: AgentWorkOrder['status']) => {
        const m = STATUS_MAP[s]
        return <Tag color={m.color}>{m.text}</Tag>
      },
    },
    { title: '派发人', dataIndex: 'assignee', width: 110, render: (v: string) => v || '—' },
    {
      title: '现场图',
      key: 'images',
      width: 90,
      render: (_, record) =>
        record.images?.length ? (
          <Image src={record.images[0]} width={56} height={40} className="!rounded object-cover" />
        ) : (
          <span className="text-slate-500">—</span>
        ),
    },
    { title: '备注', dataIndex: 'remark', ellipsis: true },
    { title: '创建时间', dataIndex: 'createdAt', width: 170 },
    {
      title: '操作',
      key: 'action',
      width: 240,
      render: (_, record) => (
        <div className="flex items-center gap-2">
          <Select
            size="small"
            value={record.status}
            style={{ width: 100 }}
            onChange={(v: AgentWorkOrder['status']) => handleStatusChange(record.id, v)}
            options={STATUS_OPTIONS}
          />
          <Button size="small" onClick={() => openEdit(record)}>编辑</Button>
          <Popconfirm title="确认删除该工单？" onConfirm={() => handleDelete(record.id)}>
            <Button size="small" danger>删除</Button>
          </Popconfirm>
        </div>
      ),
    },
  ]

  return (
    <div className="flex h-full flex-col gap-4">
      <PageToolbar
        title="巡护工单"
        description="工单支持 AI 建议确认生成，也支持人工直接创建，统一在此派发、跟踪与处置。"
        actions={
          <Button type="primary" onClick={() => setCreateOpen(true)}>
            新建工单
          </Button>
        }
      />
      <SectionCard title="工单列表">
        <PagedTable<AgentWorkOrder>
          rowKey="id"
          columns={columns}
          dataSource={orders}
          loading={loading}
          current={currentPage}
          pageSize={pageSize}
          total={total}
          onPageChange={(page, ps) => {
            setCurrentPage(page)
            setPageSize(ps)
            loadOrders(page, ps)
          }}
          scroll={{ x: 1000 }}
        />
      </SectionCard>

      {/* 人工新建工单 */}
      <Modal
        title="新建工单"
        open={createOpen}
        onOk={handleCreate}
        confirmLoading={createLoading}
        onCancel={() => setCreateOpen(false)}
        destroyOnClose
      >
        <Form form={createForm} layout="vertical" initialValues={{ status: 'pending' }}>
          <Form.Item name="title" label="工单标题" rules={[{ required: true, message: '请输入工单标题' }]}>
            <Input placeholder="如：相机-005 低电量更换电池" />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select options={STATUS_OPTIONS} />
          </Form.Item>
          <Form.Item name="assignee" label="派发人">
            <Input placeholder="如：张巡护" />
          </Form.Item>
          <Form.Item name="images" label="现场图片" valuePropName="value">
            <OrderImageUpload />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} placeholder="工单说明、处置要求等" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 编辑工单 */}
      <Modal
        title="编辑工单"
        open={editOpen}
        onOk={handleEdit}
        confirmLoading={editLoading}
        onCancel={() => setEditOpen(false)}
        destroyOnClose
      >
        <Form form={editForm} layout="vertical">
          <Form.Item name="title" label="工单标题" rules={[{ required: true, message: '请输入工单标题' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="assignee" label="派发人">
            <Input placeholder="如：张巡护" />
          </Form.Item>
          <Form.Item name="images" label="现场图片" valuePropName="value">
            <OrderImageUpload />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
