import { AppstoreOutlined, BarsOutlined } from '@ant-design/icons'
import { Button, DatePicker, Form, Input, InputNumber, Modal, Select, Space, Tag, Upload, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useEffect, useMemo, useState } from 'react'
import dayjs from 'dayjs'
import { PagedTable } from '@/components/common/PagedTable'
import { SectionCard } from '@/components/common/SectionCard'
import { deviceApi, imageApi } from '@/services/api'
import type { DeviceItem, ImageRecord, OrgTreeNode } from '@/types/models'
import { useOrgFilter } from '@/hooks/useOrgFilter'

type ViewMode = 'list' | 'grid'

export default function ImageQueryPage() {
  const [rawOrgTree, setRawOrgTree] = useState<OrgTreeNode[]>([])
  const { orgOptions, filteredTree } = useOrgFilter(rawOrgTree)
  const [orgId, setOrgId] = useState<string | undefined>(undefined)
  const [devices, setDevices] = useState<DeviceItem[]>([])
  const [records, setRecords] = useState<ImageRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [deviceId, setDeviceId] = useState<string | undefined>(undefined)
  const [keyword, setKeyword] = useState('')
  const [fileType, setFileType] = useState('全部')
  const [eventType, setEventType] = useState('全部')
  const [smartCategory, setSmartCategory] = useState('全部')
  const [date, setDate] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [viewMode, setViewMode] = useState<ViewMode>('list')

  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [previewType, setPreviewType] = useState<'图片' | '视频'>('图片')
  const [previewTitle, setPreviewTitle] = useState<string>('')
  const [tagOpen, setTagOpen] = useState(false)
  const [taggingRecord, setTaggingRecord] = useState<ImageRecord | null>(null)
  const [tagForm] = Form.useForm()
  const [uploading, setUploading] = useState(false)
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [uploadDeviceId, setUploadDeviceId] = useState<string | undefined>(undefined)
  const [uploadEventType, setUploadEventType] = useState('')

  const orgDescendants = useMemo(() => {
    const result = new Map<string, string[]>()
    const walk = (node: OrgTreeNode): string[] => {
      const id = node.key
      const childIDs = (node.children ?? []).flatMap(walk)
      const all = [id, ...childIDs]
      result.set(id, all)
      return all
    }
    filteredTree.forEach(walk)
    return result
  }, [filteredTree])

  const filteredDevices = useMemo(() => {
    if (!orgId) {
      return devices
    }
    const allowed = new Set(orgDescendants.get(orgId) ?? [orgId])
    return devices.filter((item) => (item.orgId ? allowed.has(item.orgId) : false))
  }, [devices, orgDescendants, orgId])

  const deviceOptions = useMemo(
    () => [
      { label: '全部设备', value: '' },
      ...filteredDevices.map((item) => ({
        label: `${item.name} (${item.serialNumber || item.imei})`,
        value: item.id,
      })),
    ],
    [filteredDevices],
  )

  const columns = useMemo<ColumnsType<ImageRecord>>(
    () => [
      { title: '设备名称', dataIndex: 'deviceName', key: 'deviceName', ellipsis: { showTitle: true } },
      { title: '设备编号', dataIndex: 'deviceSerialNumber', key: 'deviceSerialNumber', ellipsis: { showTitle: true }, render: (value: string) => value || '-' },
      { title: '拍摄时间', dataIndex: 'capturedAt', key: 'capturedAt', ellipsis: { showTitle: true } },
      {
        title: '类型',
        dataIndex: 'fileType',
        key: 'fileType',
        render: (value: string) => <Tag color={value === '视频' ? 'purple' : 'blue'}>{value}</Tag>,
      },
      {
        title: '事件类型',
        dataIndex: 'eventType',
        key: 'eventType',
        width: 100,
        render: (value?: string) => {
          if (!value) return <Tag>无</Tag>
          const colorMap: Record<string, string> = { 'PIR触发': 'volcano', '定时拍摄': 'cyan', '定时触发': 'geekblue', '缩时录影': 'purple', '手动抓拍': 'gold' }
          return <Tag color={colorMap[value] || 'default'}>{value}</Tag>
        },
      },
      {
        title: '智能识别',
        dataIndex: 'smartCategory',
        key: 'smartCategory',
        render: (value?: string) => {
          if (!value) return <Tag>无</Tag>
          const colorMap: Record<string, string> = { '动物': 'green', '人': 'orange', '车辆/车牌': 'blue' }
          return <Tag color={colorMap[value] || 'default'}>{value}</Tag>
        },
      },
      { title: '文件名', dataIndex: 'fileName', key: 'fileName', ellipsis: { showTitle: true } },
      { title: '大小', dataIndex: 'size', key: 'size' },
      {
        title: '标记',
        dataIndex: 'speciesTag',
        key: 'speciesTag',
        render: (value?: string) => <Tag color="green">{value ? value : '未标记'}</Tag>,
      },
      {
        title: '操作',
        key: 'action',
        width: 200,
        render: (_, record) => (
          <Space size="small">
            <Button
              size="small"
              onClick={async () => {
                const result = await imageApi.download(record.id)
                setPreviewTitle(record.fileName || `影像-${record.id}`)
                setPreviewUrl(result.url)
                setPreviewType(record.fileType)
                setPreviewOpen(true)
              }}
            >
              查看
            </Button>
            <Button
              size="small"
              onClick={async () => {
                const result = await imageApi.download(record.id)
                window.open(result.url, '_blank')
              }}
            >
              下载
            </Button>
            <Button
              size="small"
              type="primary"
              onClick={() => {
                setTaggingRecord(record)
                const match = (record.speciesTag ?? '').match(/^(.+?)\s+(\d+)%$/)
                tagForm.setFieldsValue({
                  species: match ? match[1] : record.speciesTag || '',
                  confidence: match ? Number(match[2]) : 95,
                  remark: '',
                })
                setTagOpen(true)
              }}
            >
              标记
            </Button>
          </Space>
        ),
      },
    ],
    [tagForm],
  )

  useEffect(() => {
    async function initialize() {
      setLoading(true)
      try {
        const [orgResult, deviceResult, imageResult] = await Promise.all([
          imageApi.orgTree(),
          deviceApi.query({ page: 1, pageSize: 200 }),
          imageApi.query({
            page: 1,
            pageSize,
          }),
        ])
        setRawOrgTree(orgResult)
        setDevices(deviceResult.list)
        setRecords(imageResult.list)
        setCurrentPage(imageResult.page)
        setPageSize(imageResult.pageSize)
        setTotal(imageResult.total)
      } finally {
        setLoading(false)
      }
    }
    void initialize()
  }, [])

  async function load(
    page = currentPage,
    size = pageSize,
    overrides?: Partial<{ orgId?: string | number; deviceId?: string | number; keyword: string; fileType: string; eventType: string; smartCategory: string; date: string }>,
  ) {
    const nextOrgId = overrides && Object.prototype.hasOwnProperty.call(overrides, 'orgId') ? overrides.orgId : orgId
    const nextDeviceId =
      overrides && Object.prototype.hasOwnProperty.call(overrides, 'deviceId') ? overrides.deviceId : deviceId
    const nextKeyword = overrides?.keyword ?? keyword
    const nextFileType = overrides?.fileType ?? fileType
    const nextEventType = overrides?.eventType ?? eventType
    const nextSmartCategory = overrides?.smartCategory ?? smartCategory
    const nextDate = overrides?.date ?? date

    setLoading(true)
    const result = await imageApi.query({
      page,
      pageSize: size,
      orgId: nextOrgId,
      deviceId: nextDeviceId,
      keyword: nextKeyword,
      fileType: nextFileType === '全部' ? undefined : nextFileType,
      eventType: nextEventType === '全部' ? undefined : nextEventType,
      smartCategory: nextSmartCategory === '全部' ? undefined : nextSmartCategory,
      date: nextDate || undefined,
    })
    setRecords(result.list)
    setCurrentPage(result.page)
    setPageSize(result.pageSize)
    setTotal(result.total)
    setLoading(false)
  }

  const handlePreview = async (record: ImageRecord) => {
    const result = await imageApi.download(record.id)
    setPreviewTitle(record.fileName || `影像-${record.id}`)
    setPreviewUrl(result.url)
    setPreviewType(record.fileType)
    setPreviewOpen(true)
  }

  return (
    <div>
      <SectionCard
        title=""
        // extra={<Button type="primary" onClick={() => setUploadModalOpen(true)}>上传影像</Button>}
      >
        <Form layout="vertical">
          <div className="mb-4 grid grid-cols-1 gap-4 xl:grid-cols-6">
            <Form.Item label="所属组织" className="mb-0">
              <Select
                value={orgId ?? ''}
                onChange={(value) => {
                  const next = value === '' ? undefined : value
                  setOrgId(next)
                  setDeviceId(undefined)
                }}
                options={orgOptions}
                showSearch
                optionFilterProp="label"
              />
            </Form.Item>
            <Form.Item label="所属设备" className="mb-0">
              <Select
                value={deviceId ?? ''}
                onChange={(value) => setDeviceId(value === '' ? undefined : value)}
                options={deviceOptions}
                showSearch
                optionFilterProp="label"
              />
            </Form.Item>
            <Form.Item label="设备关键字" className="mb-0">
              <Input
                placeholder="设备名称关键字"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onPressEnter={() => void load()}
              />
            </Form.Item>
            <Form.Item label="拍摄日期" className="mb-0">
              <DatePicker
                value={date ? dayjs(date) : undefined}
                onChange={(_, dateString) => {
                  const val = typeof dateString === 'string' ? dateString : ''
                  setDate(val)
                }}
                placeholder="选择日期"
                allowClear
                style={{ width: '100%' }}
              />
            </Form.Item>
            <Form.Item label="事件类型" className="mb-0">
              <Select
                value={eventType}
                onChange={(value) => setEventType(value)}
                options={[
                  { label: '全部', value: '全部' },
                  { label: 'PIR触发', value: 'PIR触发' },
                  { label: '定时拍摄', value: '定时拍摄' },
                  { label: '定时触发', value: '定时触发' },
                  { label: '缩时录影', value: '缩时录影' },
                  { label: '手动抓拍', value: '手动抓拍' },
                ]}
              />
            </Form.Item>
            <Form.Item label="智能查询" className="mb-0">
              <Select
                value={smartCategory}
                onChange={(value) => setSmartCategory(value)}
                options={[
                  { label: '全部', value: '全部' },
                  { label: '动物', value: '动物' },
                  { label: '人', value: '人' },
                  { label: '车辆/车牌', value: '车辆/车牌' },
                ]}
              />
            </Form.Item>

            <div className="xl:col-span-6 flex items-end gap-3">
              <Button type="primary" onClick={() => void load()}>
                查询
              </Button>
              <Button
                onClick={() => {
                  setOrgId(undefined)
                  setDeviceId(undefined)
                  setKeyword('')
                  setFileType('全部')
                  setEventType('全部')
                  setSmartCategory('全部')
                  setDate('')
                  setCurrentPage(1)
                  void load(1, pageSize, {
                    orgId: undefined,
                    deviceId: undefined,
                    keyword: '',
                    fileType: '全部',
                    eventType: '全部',
                    smartCategory: '全部',
                    date: '',
                  })
                }}
              >
                重置
              </Button>
            </div>
          </div>
        </Form>

        {/* 视图切换 */}
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm text-slate-400">共 {total} 条记录</span>
          <Space>
            <Button
              type={viewMode === 'list' ? 'primary' : 'default'}
              icon={<BarsOutlined />}
              size="small"
              onClick={() => setViewMode('list')}
            >
              列表
            </Button>
            <Button
              type={viewMode === 'grid' ? 'primary' : 'default'}
              icon={<AppstoreOutlined />}
              size="small"
              onClick={() => setViewMode('grid')}
            >
              平铺
            </Button>
          </Space>
        </div>

        {viewMode === 'list' ? (
          <PagedTable
            rowKey="id"
            columns={columns}
            dataSource={records}
            loading={loading}
            current={currentPage}
            pageSize={pageSize}
            total={total}
            showSizeChanger={false}
            onPageChange={(page, size) => {
              void load(page, size)
            }}
          />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {records.map((record) => (
                <div
                  key={record.id}
                  className="cursor-pointer rounded-2xl border border-white/10 bg-white/5 p-3 transition-colors hover:border-sky-500/40 hover:bg-white/10"
                  onClick={() => void handlePreview(record)}
                >
                  <div className="mb-2 flex h-28 items-center justify-center rounded-lg bg-white/5 text-3xl text-slate-500">
                    {record.fileType === '视频' ? '🎬' : '📷'}
                  </div>
                  <div className="truncate text-sm font-medium text-slate-200">{record.fileName || '-'}</div>
                  <div className="mt-1 flex items-center justify-between">
                    <Tag color={record.fileType === '视频' ? 'purple' : 'blue'} className="m-0 text-xs">
                      {record.fileType}
                    </Tag>
                    {record.smartCategory ? (
                      <Tag color={record.smartCategory === '动物' ? 'green' : record.smartCategory === '人' ? 'orange' : 'blue'} className="m-0 text-xs">{record.smartCategory}</Tag>
                    ) : null}
                    {record.speciesTag ? (
                      <Tag color="green" className="m-0 text-xs">{record.speciesTag}</Tag>
                    ) : null}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">{record.capturedAt || '-'}</div>
                </div>
              ))}
            </div>
            {records.length > 0 && (
              <div className="mt-4 flex items-center justify-center gap-2">
                <Button size="small" disabled={currentPage <= 1} onClick={() => void load(currentPage - 1)}>
                  上一页
                </Button>
                <span className="text-sm text-slate-400">
                  {currentPage} / {Math.max(1, Math.ceil(total / pageSize))}
                </span>
                <Button size="small" disabled={currentPage >= Math.ceil(total / pageSize)} onClick={() => void load(currentPage + 1)}>
                  下一页
                </Button>
              </div>
            )}
          </>
        )}
      </SectionCard>
      <Modal title={previewTitle} open={previewOpen} onCancel={() => setPreviewOpen(false)} footer={null} width={860} styles={{ body: { padding: 0, maxHeight: '80vh', overflow: 'auto' } }}>
        {previewUrl ? (
          previewType === '视频' ? (
            <video controls src={previewUrl} className="w-full max-h-[75vh] rounded-xl" />
          ) : (
            <img src={previewUrl} className="w-full max-h-[75vh] rounded-xl object-contain" />
          )
        ) : null}
      </Modal>
      <Modal
        title="标记物种"
        open={tagOpen}
        onCancel={() => setTagOpen(false)}
        onOk={async () => {
          const values = await tagForm.validateFields()
          if (!taggingRecord) {
            setTagOpen(false)
            return
          }
          await imageApi.tag(taggingRecord.id, {
            species: values.species,
            confidence: values.confidence,
            remark: values.remark,
          })
          message.success('标记成功')
          setTagOpen(false)
          void load(currentPage, pageSize)
        }}
      >
        <Form form={tagForm} layout="vertical">
          <Form.Item name="species" label="选择物种" rules={[{ required: true, message: '请选择物种' }]}>
            <Select
              options={[
                { label: '鹿', value: '鹿' },
                { label: '野猪', value: '野猪' },
                { label: '人类', value: '人类' },
                { label: '空拍', value: '空拍' },
                { label: '误触', value: '误触' },
              ]}
            />
          </Form.Item>
          <Form.Item name="confidence" label="置信度" rules={[{ required: true, message: '请输入置信度' }]}>
            <InputNumber min={0} max={100} className="w-full" />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} placeholder="备注信息" />
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title="上传影像"
        open={uploadModalOpen}
        onCancel={() => setUploadModalOpen(false)}
        footer={null}
        width={480}
      >
        <Form layout="vertical">
          <Form.Item label="选择设备" required>
            <Select
              value={uploadDeviceId}
              onChange={setUploadDeviceId}
              placeholder="请选择设备"
              options={deviceOptions.filter((o) => o.value !== '')}
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>
          <Form.Item label="事件类型">
            <Select
              value={uploadEventType || undefined}
              onChange={setUploadEventType}
              placeholder="请选择事件类型"
              allowClear
              options={[
                { label: 'PIR触发', value: 'PIR触发' },
                { label: '定时拍摄', value: '定时拍摄' },
                { label: '定时触发', value: '定时触发' },
                { label: '缩时录影', value: '缩时录影' },
                { label: '手动抓拍', value: '手动抓拍' },
              ]}
            />
          </Form.Item>
          <Form.Item label="选择文件" required>
            <Upload
              accept="image/*,video/*"
              maxCount={1}
              beforeUpload={() => false}
              onChange={async (info) => {
                const file = info.fileList[0]?.originFileObj
                if (!file || !uploadDeviceId) return
                setUploading(true)
                try {
                  await imageApi.upload(file, uploadDeviceId, {
                    eventType: uploadEventType || undefined,
                  })
                  message.success('上传成功')
                  setUploadModalOpen(false)
                  setUploadEventType('')
                  setUploadDeviceId(undefined)
                  void load(1, pageSize)
                } catch (err: any) {
                  message.error(err?.message || '上传失败')
                } finally {
                  setUploading(false)
                }
              }}
              disabled={uploading || !uploadDeviceId}
            >
              <Button loading={uploading} disabled={!uploadDeviceId}>
                选择文件上传
              </Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}