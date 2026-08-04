import { Alert, Button, Card, Descriptions, Drawer, Form, Input, InputNumber, Modal, Popconfirm, Select, Space, Tag, Typography, Upload, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { TableRowSelection } from 'antd/es/table/interface'
import { useEffect, useState } from 'react'
import DeviceConfigForm from '@/components/devices/DeviceConfigForm'
import { DEVICE_TYPE_OPTIONS } from '@/types/device-params'
import type { DeviceModelType } from '@/types/device-params'
import { PagedTable } from '@/components/common/PagedTable'
import { SectionCard } from '@/components/common/SectionCard'
import { deviceApi, orgApi } from '@/services/api'
import type { DeviceConfig, DeviceItem, OrgTreeNode } from '@/types/models'
import { useOrgFilter } from '@/hooks/useOrgFilter'

const statusColorMap: Record<string, string> = {
  在线: 'green',
  离线: 'default',
  告警: 'red',
  低电量: 'gold',
}

type QueryFormValues = {
  keyword?: string
  status?: string
  type?: string
  orgId?: string | number
}

type DeviceFormValues = {
  imei?: string
  type: string
  name: string
  serialNumber: string
  orgId: string | number
  longitude?: number | null
  latitude?: number | null
}

export default function DevicesPage() {
  const [queryForm] = Form.useForm<QueryFormValues>()
  const [createForm] = Form.useForm<DeviceFormValues>()
  const [editForm] = Form.useForm<DeviceFormValues>()
  const [configForm] = Form.useForm()
  const [devices, setDevices] = useState<DeviceItem[]>([])
  const [detailDevice, setDetailDevice] = useState<DeviceItem | null>(null)
  const [editingDevice, setEditingDevice] = useState<DeviceItem | null>(null)
  const [configDevice, setConfigDevice] = useState<DeviceItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [configOpen, setConfigOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [importing, setImporting] = useState(false)
  const [rawOrgTree, setRawOrgTree] = useState<OrgTreeNode[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [filters, setFilters] = useState<QueryFormValues>({})
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [selectedRows, setSelectedRows] = useState<DeviceItem[]>([])

  const { orgOptions, orgOnlyOptions, isSuperAdmin } = useOrgFilter(rawOrgTree)

  useEffect(() => {
    void loadDevices()
    void loadOrgTree()
  }, [])

  async function loadOrgTree() {
    try {
      const tree = await orgApi.tree()
      setRawOrgTree(tree)
    } catch {
      setRawOrgTree([])
    }
  }

  async function loadDevices(options?: {
    page?: number
    pageSize?: number
    filters?: QueryFormValues
  }) {
    const nextFilters = options?.filters ?? filters
    const nextPage = options?.page ?? currentPage
    const nextPageSize = options?.pageSize ?? pageSize

    setLoading(true)
    try {
      const result = await deviceApi.query({
        page: nextPage,
        pageSize: nextPageSize,
        keyword: nextFilters.keyword,
        status: nextFilters.status,
        type: nextFilters.type,
        orgId: nextFilters.orgId ? Number(nextFilters.orgId) : undefined,
      })
      setDevices(result.list)
      setTotal(result.total)
      setCurrentPage(result.page)
      setPageSize(result.pageSize)
      setFilters(nextFilters)
    } catch (err) {
      showRequestError(err, '查询设备列表失败')
    } finally {
      setLoading(false)
    }
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

  function normalizeDeviceFormValues(values: DeviceFormValues) {
    return {
      imei: values.imei?.trim() || values.serialNumber.trim(),
      serialNumber: values.serialNumber.trim(),
      name: values.name.trim(),
      type: values.type?.trim() || undefined,
      orgId: values.orgId,
      longitude: values.longitude ?? undefined,
      latitude: values.latitude ?? undefined,
    }
  }

  async function handleSearch() {
    const values = queryForm.getFieldsValue()
    await loadDevices({
      page: 1,
      pageSize,
      filters: {
        keyword: values.keyword?.trim() || undefined,
        status: values.status || undefined,
        type: values.type || undefined,
        orgId: values.orgId || undefined,
      },
    })
  }

  async function handleReset() {
    queryForm.resetFields()
    await loadDevices({
      page: 1,
      pageSize,
      filters: {},
    })
  }

  async function openDetail(record: DeviceItem) {
    try {
      const detail = await deviceApi.detail(record.id)
      setDetailDevice(detail)
      setDetailOpen(true)
    } catch (err) {
      showRequestError(err, '查询设备详情失败')
    }
  }

  async function openEdit(record: DeviceItem) {
    try {
      const detail = await deviceApi.detail(record.id)
      setEditingDevice(detail)
      editForm.setFieldsValue({
        imei: detail.imei || '',
        name: detail.name,
        type: detail.type,
        serialNumber: detail.serialNumber || undefined,
        orgId: detail.orgId ?? undefined,
        longitude: detail.longitude ? Number(detail.longitude) : undefined,
        latitude: detail.latitude ? Number(detail.latitude) : undefined,
      })
      setEditOpen(true)
    } catch (err) {
      showRequestError(err, '查询设备详情失败')
    }
  }

  async function openConfig(record: DeviceItem) {
    try {
      const [detail, cfg] = await Promise.all([deviceApi.detail(record.id), deviceApi.getConfig(record.id)])
      setConfigDevice(detail)
      configForm.setFieldsValue(cfg)
      setConfigOpen(true)
    } catch (err) {
      showRequestError(err, '查询设备配置失败')
    }
  }

  async function handleCreate() {
    try {
      const values = await createForm.validateFields()
      setSubmitting(true)
      await deviceApi.create(normalizeDeviceFormValues(values))
      message.success('新增设备成功')
      setCreateOpen(false)
      createForm.resetFields()
      await loadDevices({ page: 1, pageSize, filters })
    } catch (err) {
      if ((err as any)?.errorFields) {
        return
      }
      showRequestError(err, '新增设备失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleEdit() {
    if (!editingDevice) return
    try {
      const values = await editForm.validateFields()
      setSubmitting(true)
      await deviceApi.update(editingDevice.id, normalizeDeviceFormValues(values))
      message.success('编辑设备成功')
      setEditOpen(false)
      setEditingDevice(null)
      editForm.resetFields()
      await loadDevices({ page: currentPage, pageSize, filters })
    } catch (err) {
      if ((err as any)?.errorFields) {
        return
      }
      showRequestError(err, '编辑设备失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(record: DeviceItem) {
    try {
      setSubmitting(true)
      await deviceApi.remove(record.id)
      message.success('删除设备成功')
      const nextPage = devices.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage
      await loadDevices({ page: nextPage, pageSize, filters })
    } catch (err) {
      showRequestError(err, '删除设备失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleConfigSave() {
    if (!configDevice) return
    try {
      const values = await configForm.validateFields()
      setSubmitting(true)
      await deviceApi.updateConfig(configDevice.id, values as DeviceConfig)
      message.success('设备配置已保存')
      setConfigOpen(false)
      setConfigDevice(null)
      configForm.resetFields()
    } catch (err) {
      if ((err as any)?.errorFields) {
        return
      }
      showRequestError(err, '设备配置保存失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleBatchImport(file: File) {
    setImporting(true)
    try {
      const text = await file.text()
      const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
      if (lines.length < 2) {
        message.error('文件内容为空或格式不正确')
        return
      }
      // 解析表头，确定各列索引
      const header = lines[0].split(',').map((c) => c.trim().replace(/^"|"$/g, ''))
      const colIdx: Record<string, number> = {}
      header.forEach((h, i) => {
        const lh = h.toLowerCase()
        if (lh === 'sn' || lh === 'serial_number' || lh === 'serialnumber' || lh === '设备编号' || lh === '序列号') colIdx.sn = i
        else if (lh === 'name' || lh === '设备名称' || lh === '名称') colIdx.name = i
        else if (lh === 'type' || lh === '设备类型' || lh === '类型') colIdx.type = i
        else if (lh === 'longitude' || lh === '经度' || lh === '安装经度') colIdx.longitude = i
        else if (lh === 'latitude' || lh === '纬度' || lh === '安装纬度') colIdx.latitude = i
      })

      // 设备编号列必填
      if (colIdx.sn === undefined) {
        message.error('表头缺少必填列：SN（设备编号）')
        return
      }

      // 获取顶级组织ID作为默认值
      const rootOrgId = rawOrgTree.length > 0 ? rawOrgTree[0].key : undefined

      const items: { serialNumber: string; name: string; type: string; orgId?: string | number; longitude?: number; latitude?: number }[] = []
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map((c) => c.trim().replace(/^"|"$/g, ''))
        const sn = colIdx.sn !== undefined ? (cols[colIdx.sn] || '') : ''
        if (!sn) continue
        const name = colIdx.name !== undefined ? (cols[colIdx.name] || '') : ''
        const type = colIdx.type !== undefined ? (cols[colIdx.type] || '') : ''
        const lon = colIdx.longitude !== undefined ? parseFloat(cols[colIdx.longitude]) : NaN
        const lat = colIdx.latitude !== undefined ? parseFloat(cols[colIdx.latitude]) : NaN
        items.push({
          serialNumber: sn,
          name: name || `设备-${sn}`,
          type: type || '500W',
          orgId: rootOrgId,
          longitude: isNaN(lon) ? undefined : lon,
          latitude: isNaN(lat) ? undefined : lat,
        })
      }

      if (items.length === 0) {
        message.error('未在文件中找到有效的设备数据')
        return
      }

      const result = await deviceApi.importDevices(items)
      message.success(`导入完成：新增 ${result.created} 台，跳过 ${result.skipped} 台`)
      setImportOpen(false)
      await loadDevices({ page: 1, pageSize, filters })
    } catch (err) {
      showRequestError(err, '批量导入失败')
    } finally {
      setImporting(false)
    }
  }

  function exportDevices(list: DeviceItem[]) {
    const header = 'IMEI,SN,设备名称,设备类型,固件版本,所属组织,状态,电量,安装时间\n'
    const rows = list.map((d) =>
      [d.imei, d.serialNumber, d.name, d.type, d.firmwareVersion, d.orgName, d.status, d.battery, d.installedAt].join(','),
    )
    const csv = header + rows.join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `设备列表_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleExport() {
    if (selectedRows.length > 0) {
      exportDevices(selectedRows)
      message.success(`已导出选中的 ${selectedRows.length} 台设备`)
      return
    }
    message.info('正在导出全部设备列表...')
    try {
      const result = await deviceApi.query({ page: 1, pageSize: 9999, ...filters })
      exportDevices(result.list)
      message.success('导出完成')
    } catch {
      message.error('导出失败')
    }
  }

  const columns: ColumnsType<DeviceItem> = [
    { title: '序号', dataIndex: 'index', key: 'index', width: 60, align: 'center', render: (_, record, index) => index + 1 },
    { title: '设备名称', dataIndex: 'name', key: 'name', width: 140, ellipsis: { showTitle: true } },
    // { title: 'IMEI', dataIndex: 'imei', key: 'imei', width: 160, ellipsis: { showTitle: true } },
    { title: 'SN', dataIndex: 'serialNumber', key: 'serialNumber', width: 140, ellipsis: { showTitle: true }, render: (value: string) => value || '-' },
    { title: '设备类型', dataIndex: 'type', key: 'type', width: 100, ellipsis: { showTitle: true } },
    { title: '固件版本', dataIndex: 'firmwareVersion', key: 'firmwareVersion', width: 120, ellipsis: { showTitle: true }, render: (value: string) => value || '-' },
    { title: '所属组织', dataIndex: 'orgName', key: 'orgName', width: 140, ellipsis: { showTitle: true }, render: (value: string) => value || '-' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (value: string) => <Tag color={statusColorMap[value] ?? 'default'}>{value}</Tag>,
    },
    {
      title: '电量',
      dataIndex: 'battery',
      key: 'battery',
      width: 80,
      render: (value: number) => <span className={value < 20 ? 'text-red-400' : 'text-emerald-300'}>{`${value}%`}</span>,
    },
    { title: '最近心跳', dataIndex: 'lastHeartbeatAt', key: 'lastHeartbeatAt', width: 180, ellipsis: { showTitle: true }, render: (value: string) => value || '-' },
    {
      title: '操作',
      key: 'action',
      width: 220,
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => void openDetail(record)}>
            详情
          </Button>
          <Button size="small" onClick={() => void openEdit(record)}>
            编辑
          </Button>
          <Button size="small" onClick={() => void openConfig(record)}>
            配置
          </Button>
          <Popconfirm title="确认删除该设备？" okText="删除" cancelText="取消" onConfirm={() => void handleDelete(record)}>
            <Button size="small" danger>
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
        title=""
      >
        <Form form={queryForm} layout="vertical">
          <div className="mb-4 grid grid-cols-1 gap-4 xl:grid-cols-5">
            <Form.Item label="关键字" name="keyword" className="mb-0">
              <Input placeholder="设备名称 / SN / IMEI" />
            </Form.Item>
            <Form.Item label="设备状态" name="status" className="mb-0">
              <Select
                allowClear
                placeholder="全部"
                options={[
                  { value: '在线', label: '在线' },
                  { value: '离线', label: '离线' },
                  { value: '告警', label: '告警' },
                  { value: '低电量', label: '低电量' },
                ]}
              />
            </Form.Item>
            <Form.Item label="设备类型" name="type" className="mb-0">
              <Select
                allowClear
                placeholder="全部"
                options={DEVICE_TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
              />
            </Form.Item>
            <Form.Item label="所属组织" name="orgId" className="mb-0">
              <Select
                allowClear
                placeholder="全部组织"
                options={orgOptions}
                showSearch
                optionFilterProp="label"
              />
            </Form.Item>
            <div className="flex items-end gap-3">
              <Button type="primary" onClick={() => void handleSearch()}>
                查询
              </Button>
              <Button onClick={() => void handleReset()}>重置</Button>
            </div>
          </div>
        </Form>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <Button
            type="primary"
            onClick={() => {
              createForm.resetFields()
              setCreateOpen(true)
            }}
          >
            + 新增设备
          </Button>
          <Button className="bg-slate-600/60 text-slate-100 hover:bg-slate-500/60 border-slate-500/40" onClick={() => setImportOpen(true)}>批量导入</Button>
          <Button className="bg-slate-600/60 text-slate-100 hover:bg-slate-500/60 border-slate-500/40" onClick={() => void handleExport()}>
            {selectedRowKeys.length > 0 ? `导出选中 (${selectedRowKeys.length})` : '批量导出'}
          </Button>
          {selectedRowKeys.length > 0 && (
            <Button onClick={() => { setSelectedRowKeys([]); setSelectedRows([]) }}>取消选择</Button>
          )}
        </div>
        <PagedTable
          rowKey="id"
          columns={columns}
          dataSource={devices}
          loading={loading}
          current={currentPage}
          pageSize={pageSize}
          total={total}
          scroll={{ x: 'max-content' }}
          rowSelection={{
            selectedRowKeys,
            onChange: (keys: React.Key[], rows: DeviceItem[]) => {
              setSelectedRowKeys(keys)
              setSelectedRows(rows)
            },
          }}
          onPageChange={(page, nextPageSize) => {
            void loadDevices({ page, pageSize: nextPageSize, filters })
          }}
        />
      </SectionCard>

      {/* 新增设备 */}
      <Modal
        title="新增设备"
        open={createOpen}
        okText="保存"
        confirmLoading={submitting}
        destroyOnHidden
        onCancel={() => {
          setCreateOpen(false)
          createForm.resetFields()
        }}
        onOk={() => void handleCreate()}
      >
        <Form form={createForm} layout="vertical" initialValues={{ type: '500W' }}>
          <div className="grid grid-cols-1 gap-x-5 xl:grid-cols-2">
            <Form.Item
              label="设备编号(SN)"
              name="serialNumber"
              rules={[{ required: true, message: '请输入设备编号(SN)' }]}
            >
              <Input placeholder="设备编号" />
            </Form.Item>
            <Form.Item label="设备类型" name="type" rules={[{ required: true, message: '请选择设备类型' }]}>
              <Select
                placeholder="请选择"
                options={DEVICE_TYPE_OPTIONS}
              />
            </Form.Item>
          </div>
          <div className="grid grid-cols-1 gap-x-5 xl:grid-cols-2">
            <Form.Item
              label="设备名称"
              name="name"
              rules={[{ required: true, message: '请输入设备名称' }]}
            >
              <Input placeholder="设备名称" />
            </Form.Item>
            <Form.Item label="设备 IMEI" name="imei">
              <Input placeholder="15位IMEI（选填）" maxLength={15} />
            </Form.Item>
          </div>
          <Form.Item
            label="所属组织"
            name="orgId"
            rules={[{ required: true, message: '请选择组织' }]}
          >
            <Select placeholder="请选择组织" options={orgOnlyOptions} showSearch optionFilterProp="label" />
          </Form.Item>
          <div className="grid grid-cols-1 gap-x-5 xl:grid-cols-2">
            <Form.Item label="安装经度" name="longitude" rules={[{ type: 'number', min: -180, max: 180, message: '经度范围 -180 ~ 180' }]}>
              <InputNumber className="w-full" placeholder="经度（选填，-180~180）" />
            </Form.Item>
            <Form.Item label="安装纬度" name="latitude" rules={[{ type: 'number', min: -90, max: 90, message: '纬度范围 -90 ~ 90' }]}>
              <InputNumber className="w-full" placeholder="纬度（选填，-90~90）" />
            </Form.Item>
          </div>
        </Form>
      </Modal>

      {/* 编辑设备 */}
      <Modal
        title="编辑设备"
        open={editOpen}
        okText="保存"
        confirmLoading={submitting}
        destroyOnHidden
        onCancel={() => {
          setEditOpen(false)
          setEditingDevice(null)
          editForm.resetFields()
        }}
        onOk={() => void handleEdit()}
      >
        <Form form={editForm} layout="vertical">
          <Form.Item label="设备 IMEI">
            <Input value={editingDevice?.imei || ''} readOnly />
          </Form.Item>
          <Alert message="IMEI为设备唯一标识，不可修改" type="warning" showIcon className="mb-4" />
          <Form.Item
            label="设备名称"
            name="name"
            rules={[{ required: true, message: '请输入设备名称' }]}
          >
            <Input placeholder="设备名称" />
          </Form.Item>
          <Form.Item
            label="所属组织"
            name="orgId"
            rules={[{ required: true, message: '请选择组织' }]}
          >
            <Select placeholder="请选择组织" options={orgOnlyOptions} showSearch optionFilterProp="label" />
          </Form.Item>
          <div className="grid grid-cols-1 gap-x-5 xl:grid-cols-2">
            <Form.Item label="安装经度" name="longitude" rules={[{ type: 'number', min: -180, max: 180, message: '经度范围 -180 ~ 180' }]}>
              <InputNumber className="w-full" placeholder="经度（选填，-180~180）" />
            </Form.Item>
            <Form.Item label="安装纬度" name="latitude" rules={[{ type: 'number', min: -90, max: 90, message: '纬度范围 -90 ~ 90' }]}>
              <InputNumber className="w-full" placeholder="纬度（选填，-90~90）" />
            </Form.Item>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <Typography.Text className="block text-slate-400">设备编号</Typography.Text>
            <Typography.Text className="mt-1 block text-slate-100">
              {editingDevice?.serialNumber || '-'}
            </Typography.Text>
          </div>
        </Form>
      </Modal>

      {/* 设备配置 - 使用新的分组表单组件 */}
      <Modal
        title={`设备配置${configDevice ? ` - ${configDevice.name}` : ''}`}
        open={configOpen}
        confirmLoading={submitting}
        destroyOnHidden
        centered
        styles={{ body: { maxHeight: '80vh', overflowY: 'auto' } }}
        onCancel={() => {
          setConfigOpen(false)
          setConfigDevice(null)
          configForm.resetFields()
        }}
        okText="保存"
        onOk={() => void handleConfigSave()}
        width={1200}
      >
        <DeviceConfigForm form={configForm} deviceType={configDevice?.type as DeviceModelType | undefined} />
      </Modal>

      {/* 批量导入 */}
      <Modal
        title="批量导入设备"
        open={importOpen}
        footer={null}
        destroyOnHidden
        onCancel={() => setImportOpen(false)}
        width={480}
      >
        <Upload
          accept=".csv,.xlsx,.xls"
          maxCount={1}
          beforeUpload={() => false}
          onChange={async (info) => {
            const file = info.fileList[0]?.originFileObj
            if (!file) return
            await handleBatchImport(file)
          }}
          disabled={importing}
        >
          <div className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/10 bg-white/5 py-10 transition-colors hover:border-sky-500/50 hover:bg-white/10">
            <span className="text-5xl">📁</span>
            <p className="mt-3 text-sm text-slate-300">点击或拖拽文件到此处上传</p>
            <p className="mt-1 text-xs text-slate-500">支持 .csv / .xlsx 格式，表头须含 SN（设备编号）列</p>
          </div>
        </Upload>
        <div className="mt-4">
          <Button onClick={() => {
            const header = 'SN,设备名称,设备类型,安装经度,安装纬度\n'
              + 'SN001,狩猎相机1,500W,121.47,31.23\n'
              + 'SN002,红外相机2,800W,,\n'
            const blob = new Blob(['\uFEFF' + header], { type: 'text/csv;charset=utf-8' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = '设备导入模板.csv'
            a.click()
            URL.revokeObjectURL(url)
            message.success('模板下载成功')
          }}>
            下载CSV模板
          </Button>
          <p className="mt-2 text-xs text-slate-500">
            必填列：SN（设备编号）；选填列：设备名称、设备类型、安装经度、安装纬度；所属组织默认顶级组织
          </p>
        </div>
      </Modal>

      {/* 设备详情 */}
      <Drawer
        title={detailDevice?.name ?? '设备详情'}
        width={560}
        open={detailOpen}
        onClose={() => {
          setDetailOpen(false)
          setDetailDevice(null)
        }}
        styles={{ body: { background: '#111827' }, header: { background: '#0f1924' } }}
      >
        {detailDevice ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <Typography.Text className="block text-slate-400">在线状态</Typography.Text>
                <div className="mt-2">
                  <Tag color={statusColorMap[detailDevice.status] ?? 'default'}>{detailDevice.status || '-'}</Tag>
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <Typography.Text className="block text-slate-400">当前电量</Typography.Text>
                <Typography.Text className="mt-2 block text-lg font-medium text-slate-100">
                  {detailDevice.battery}%
                </Typography.Text>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <Typography.Text className="block text-slate-400">最近心跳</Typography.Text>
                <Typography.Text className="mt-2 block text-slate-100">
                  {detailDevice.lastHeartbeatAt || '-'}
                </Typography.Text>
              </div>
            </div>

            <Card size="small" className="detail-info-card">
              <Descriptions column={2} size="small" items={[
                { key: 'imei', label: '设备 IMEI', children: detailDevice.imei || '-' },
                { key: 'serialNumber', label: '设备编号(SN)', children: detailDevice.serialNumber || '-' },
                { key: 'type', label: '设备类型', children: detailDevice.type || '-' },
                { key: 'name', label: '设备名称', children: detailDevice.name || '-' },
                { key: 'firmwareVersion', label: '固件版本', children: detailDevice.firmwareVersion || '-' },
                { key: 'orgName', label: '所属组织', children: detailDevice.orgName || '-' },
                { key: 'longitude', label: '安装经度', children: detailDevice.longitude || '-' },
                { key: 'latitude', label: '安装纬度', children: detailDevice.latitude || '-' },
                { key: 'installedAt', label: '安装时间', children: detailDevice.installedAt || '-' },
              ]} />
            </Card>
          </div>
        ) : null}
      </Drawer>
    </div>
  )
}


