import { Button, DatePicker, Input, Progress, Select, Tabs, Tag, Upload, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useEffect, useState } from 'react'
import { PagedTable } from '@/components/common/PagedTable'
import { SectionCard } from '@/components/common/SectionCard'
import { deviceApi } from '@/services/api'
import type { DeviceItem } from '@/types/models'

function showRequestError(err: unknown, fallback: string) {
  const msg = err instanceof Error ? err.message : fallback
  message.error(msg)
}

// ─── Status Color Map ────────────────────────────────────────────────────────

const statusColorMap: Record<string, string> = {
  在线: 'green',
  离线: 'default',
  告警: 'red',
  低电量: 'gold',
}

interface OtaProgress {
  id: string
  name: string
  imei: string
  fromVersion: string
  toVersion: string
  progress: number
  status: string
}

const mockOtaProgress: OtaProgress[] = [
  { id: '1', name: '相机-001', imei: '860012345678', fromVersion: 'V2.1.3', toVersion: 'V2.2.0', progress: 100, status: '完成' },
  { id: '2', name: '相机-002', imei: '860012345679', fromVersion: 'V2.1.3', toVersion: 'V2.2.0', progress: 75, status: '升级中' },
  { id: '3', name: '相机-003', imei: '860012345680', fromVersion: 'V2.0.8', toVersion: 'V2.2.0', progress: 0, status: '失败' },
  { id: '4', name: '相机-004', imei: '860012345681', fromVersion: 'V2.1.0', toVersion: 'V2.2.0', progress: 0, status: '等待中' },
]

// ─── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[rgba(20,32,45,0.5)] p-6 backdrop-blur-xl">
      <div className="border-l-4 pl-4" style={{ borderColor: color }}>
        <div className="text-3xl font-light" style={{ color }}>{value}</div>
        <div className="mt-1 text-xs font-medium uppercase tracking-wider text-slate-400">{label}</div>
      </div>
    </div>
  )
}

// ─── Battery Monitoring Tab ──────────────────────────────────────────────────

function BatteryMonitorTab() {
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [devices, setDevices] = useState<DeviceItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({ lowBattery: 0, offline: 0, online: 0 })

  useEffect(() => {
    deviceApi.batteryStats().then((data) => {
      if (data) setStats(data)
    }).catch(() => {})
  }, [])

  async function loadDevices(page?: number, nextPageSize?: number, status?: string) {
    const p = page ?? currentPage
    const ps = nextPageSize ?? pageSize
    const rawStatus = status ?? statusFilter
    const effectiveStatus = (!rawStatus || rawStatus === '全部') ? undefined : rawStatus
    setLoading(true)
    try {
      const result = await deviceApi.query({
        page: p,
        pageSize: ps,
        status: effectiveStatus,
      })
      setDevices(result.list)
      setTotal(result.total)
      setCurrentPage(result.page)
      setPageSize(result.pageSize)
    } catch (err) {
      showRequestError(err, '查询设备列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadDevices(1, pageSize)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleStatusChange(val: string | undefined) {
    const filter = val === '全部' ? undefined : val
    setStatusFilter(filter)
    setCurrentPage(1)
    void loadDevices(1, pageSize, filter)
  }

  function handlePageChange(page: number, nextPageSize: number) {
    void loadDevices(page, nextPageSize)
  }

  const columns: ColumnsType<DeviceItem> = [
    {
      title: '设备名称',
      dataIndex: 'name',
      key: 'name',
      width: 140,
      ellipsis: { showTitle: true },
    },
    {
      title: 'IMEI',
      dataIndex: 'imei',
      key: 'imei',
      width: 150,
      ellipsis: { showTitle: true },
    },
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
      render: (value: number) => (
        <span className={value < 20 ? 'text-red-400' : 'text-emerald-300'}>{value}%</span>
      ),
    },
    {
      title: '所属组织',
      dataIndex: 'orgName',
      key: 'orgName',
      width: 160,
      ellipsis: { showTitle: true },
    },
    {
      title: '最后上报时间',
      dataIndex: 'lastHeartbeatAt',
      key: 'lastHeartbeatAt',
      width: 180,
      ellipsis: { showTitle: true },
      render: (value: string) => value || '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: () => <Button size="small">详情</Button>,
    },
  ]

  return (
    <div className="space-y-5">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <StatCard value={stats.lowBattery} label="低电量设备" color="#f0b429" />
        <StatCard value={stats.offline} label="离线设备" color="#e5484d" />
        <StatCard value={stats.online} label="在线设备" color="#2dd4a8" />
      </div>

      {/* Device Table */}
      <SectionCard title="设备列表" extra={
        <Select
          allowClear
          placeholder="设备状态"
          value={statusFilter}
          onChange={handleStatusChange}
          style={{ width: 160 }}
          options={[
            { value: '全部', label: '全部' },
            { value: '低电量', label: '低电量设备' },
            { value: '离线', label: '离线设备' },
            { value: '在线', label: '在线设备' },
          ]}
        />
      }>
        <PagedTable<DeviceItem>
          rowKey="id"
          columns={columns}
          dataSource={devices}
          loading={loading}
          current={currentPage}
          pageSize={pageSize}
          total={total}
          onPageChange={handlePageChange}
        />
      </SectionCard>
    </div>
  )
}

// ─── OTA Firmware Upgrade Tab ─────────────────────────────────────────────────

function OtaUpgradeTab() {
  const [orgTarget, setOrgTarget] = useState<string | undefined>(undefined)
  const [deviceStatus, setDeviceStatus] = useState<string | undefined>(undefined)
  const [upgradeStrategy, setUpgradeStrategy] = useState<string>('定时升级')
  const [versionNote, setVersionNote] = useState('')

  const otaStatusColor: Record<string, string> = {
    完成: '#2dd4a8',
    升级中: '#3b82f6',
    失败: '#e5484d',
    等待中: '#94a3b8',
  }

  const otaProgressColor = (status: string): string => {
    switch (status) {
      case '完成': return '#2dd4a8'
      case '升级中': return '#3b82f6'
      case '失败': return '#e5484d'
      case '等待中': return '#94a3b8'
      default: return '#3b82f6'
    }
  }

  return (
    <div className="space-y-5">
      {/* Section 1: Firmware Version Management */}
      <SectionCard title="固件版本管理">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {/* Left: Current version & upload */}
          <div className="min-w-0 space-y-4">
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 mb-4">
              <div className="text-xs font-medium uppercase tracking-wider text-slate-400">当前最新版本</div>
              <div className="mt-2 text-xl font-semibold text-emerald-400">V2.1.3 (2024-01-10)</div>
            </div>
            <div className="overflow-hidden">
              <Upload.Dragger
                accept=".bin,.tar.gz"
                maxCount={1}
                beforeUpload={() => false}
                onChange={() => message.info('固件文件已选择（演示）')}
                style={{ width: '100%' }}
              >
                <div className="flex flex-col items-center justify-center py-4">
                  <span className="text-3xl">📦</span>
                  <p className="mt-2 text-sm text-slate-300">点击或拖拽固件文件到此处上传</p>
                  <p className="mt-1 text-xs text-slate-500">支持 .bin / .tar.gz 格式</p>
                </div>
              </Upload.Dragger>
            </div>
          </div>

          {/* Right: Version notes & publish */}
          <div className="space-y-4">
            <div>
              <div className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-400">版本说明</div>
              <Input.TextArea
                rows={6}
                value={versionNote}
                onChange={(e) => setVersionNote(e.target.value)}
                placeholder="请输入版本更新说明..."
              />
            </div>
            <div className="flex gap-3">
              <Upload
                accept=".bin,.tar.gz"
                maxCount={1}
                beforeUpload={() => false}
                onChange={() => message.info('固件已上传（演示）')}
              >
                <Button>上传固件</Button>
              </Upload>
              <Button
                type="primary"
                onClick={() => message.success('固件发布成功（演示）')}
              >
                发布固件
              </Button>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Section 2: Batch Upgrade */}
      <SectionCard title="批量升级">
        <div className="mb-4 flex flex-wrap items-end gap-4">
          <div>
            <div className="mb-1 text-xs text-slate-400">目标组织</div>
            <Select
              allowClear
              placeholder="选择组织"
              value={orgTarget}
              onChange={setOrgTarget}
              style={{ width: 200 }}
              options={[
                { value: '总部', label: '总部' },
                { value: '华北', label: '华北' },
                { value: '华南', label: '华南' },
                { value: '西南', label: '西南' },
              ]}
            />
          </div>
          <div>
            <div className="mb-1 text-xs text-slate-400">设备状态</div>
            <Select
              allowClear
              placeholder="选择状态"
              value={deviceStatus}
              onChange={setDeviceStatus}
              style={{ width: 160 }}
              options={[
                { value: '在线', label: '在线' },
                { value: '离线', label: '离线' },
                { value: '低电量', label: '低电量' },
              ]}
            />
          </div>
          <div>
            <div className="mb-1 text-xs text-slate-400">升级策略</div>
            <Select
              value={upgradeStrategy}
              onChange={setUpgradeStrategy}
              style={{ width: 160 }}
              options={[
                { value: '定时升级', label: '定时升级' },
                { value: '立即升级', label: '立即升级' },
              ]}
            />
          </div>
          {upgradeStrategy === '定时升级' && (
            <div>
              <div className="mb-1 text-xs text-slate-400">定时时间</div>
              <DatePicker showTime style={{ width: 220 }} />
            </div>
          )}
        </div>
        <div className="flex gap-3">
          <Button type="primary" onClick={() => message.success('升级任务已启动（演示）')}>
            开始升级
          </Button>
          <Button
            className="bg-slate-600/60 text-slate-100 hover:bg-slate-500/60 border-slate-500/40"
            onClick={() => message.info('设备列表预览（演示）')}
          >
            预览设备列表
          </Button>
        </div>
      </SectionCard>

      {/* Section 3: Upgrade Progress */}
      <SectionCard title="升级进度">
        <div className="space-y-4">
          {mockOtaProgress.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-sm font-medium text-slate-100">{item.name}</div>
                  <div className="text-xs text-slate-400">
                    {item.imei} &nbsp;|&nbsp; {item.fromVersion} → {item.toVersion}
                  </div>
                </div>
                <Tag
                  color={
                    item.status === '完成' ? 'green' :
                    item.status === '升级中' ? 'blue' :
                    item.status === '失败' ? 'red' : 'default'
                  }
                >
                  {item.status}
                </Tag>
              </div>
              <div className="mt-3">
                <Progress
                  percent={item.progress}
                  strokeColor={otaProgressColor(item.status)}
                  trailColor="rgba(255,255,255,0.06)"
                  size="small"
                />
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function DeviceOpsPage() {
  const [activeTab, setActiveTab] = useState('battery')

  return (
    <div className="space-y-5">
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'battery',
            label: '🔋 电量监控',
            children: <BatteryMonitorTab />,
          },
          {
            key: 'ota',
            label: '📡 OTA固件升级',
            children: <OtaUpgradeTab />,
          },
        ]}
      />
    </div>
  )
}