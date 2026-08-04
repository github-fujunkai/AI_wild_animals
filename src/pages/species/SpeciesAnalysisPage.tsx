import { Button, Card, Col, Input, Row, Segmented, Select, Spin, Switch, Table, Tag, Form, Modal, message, Popconfirm } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { TableRowSelection } from 'antd/es/table/interface'
import { useEffect, useMemo, useState } from 'react'
import ReactECharts from 'echarts-for-react'
import { SectionCard } from '@/components/common/SectionCard'
import { speciesApi, speciesCatalogApi, imageApi } from '@/services/api'
import type { SpeciesStatItem, SpeciesImageItem, SpeciesCatalogItem } from '@/services/api'
import { useAuthStore } from '@/store/auth-store'
import type { OrgTreeNode } from '@/types/models'
import { hasPermission, resolvePermissions } from '@/utils/permission'
import { useOrgFilter } from '@/hooks/useOrgFilter'

const ANIMAL_CATEGORIES = [
  { label: '全部物种', value: '全部' },
  { label: '鹿', value: '鹿' },
  { label: '野猪', value: '野猪' },
  { label: '鸟类', value: '鸟类' },
  { label: '人类', value: '人类' },
]

const PLANT_CATEGORIES = [
  { label: '全部植物', value: '全部' },
  { label: '乔木', value: '乔木' },
  { label: '灌木', value: '灌木' },
  { label: '草本', value: '草本' },
  { label: '蕨类', value: '蕨类' },
]

const SPECIES_COLORS: Record<string, string> = {
  '鹿': '#2dd4a8', '野猪': '#f0b429', '鸟类': '#4a9eff', '人类': '#e5484d', '空拍': '#94a3b8',
  '乔木': '#2dd4a8', '灌木': '#84cc16', '草本': '#22d3ee', '蕨类': '#a78bfa',
}

const SPECIES_TAG_COLORS: Record<string, string> = {
  '鹿': 'green', '野猪': 'orange', '鸟类': 'blue', '人类': 'red', '空拍': 'default',
  '乔木': 'green', '灌木': 'lime', '草本': 'cyan', '蕨类': 'purple',
}

const CATEGORY_TAG_COLORS: Record<string, string> = {
  '动物': 'green', '植物': 'orange', '真菌': 'purple',
}

const PROTECTION_TAG_COLORS: Record<string, string> = {
  '一级': 'red', '二级': 'orange', '无': 'default',
}

const EMPTY_PERMISSIONS: string[] = []

type SpeciesTab = '🐾 动物物种分析' | '🌿 植物物种分析' | '🧬 物种管理'

const tabPermissionMap: Record<SpeciesTab, string> = {
  '🐾 动物物种分析': 'species:animal',
  '🌿 植物物种分析': 'species:plant',
  '🧬 物种管理': 'species:view',
}

const FALLBACK_ANIMAL_STATS: SpeciesStatItem[] = [
  { title: '鹿', value: 128, confidence: 98 },
  { title: '野猪', value: 86, confidence: 95 },
  { title: '鸟类', value: 204, confidence: 92 },
  { title: '人类', value: 15, confidence: 89 },
]

const FALLBACK_PLANT_STATS: SpeciesStatItem[] = [
  { title: '乔木', value: 312, confidence: 97 },
  { title: '灌木', value: 176, confidence: 93 },
  { title: '草本', value: 243, confidence: 88 },
  { title: '蕨类', value: 89, confidence: 91 },
]

const FALLBACK_ANIMAL_HEATMAP: Record<string, number[]> = {
  '鹿':   [0,0,1,2,3,8,15,22,18,12,6,3,2,1,2,3,5,10,18,25,20,12,5,1],
  '野猪': [1,0,0,1,3,6,12,16,10,5,2,1,0,1,2,4,8,14,20,18,10,4,2,1],
  '鸟类': [0,0,0,1,2,5,18,25,20,10,6,3,2,1,1,2,4,8,15,22,18,8,3,1],
  '人类': [0,0,0,0,0,1,3,5,8,10,12,10,8,6,5,4,6,8,6,3,1,0,0,0],
}

const FALLBACK_PLANT_HEATMAP: Record<string, number[]> = {
  '乔木': [45, 38, 42, 35, 28, 20],
  '灌木': [25, 30, 28, 35, 32, 18],
  '草本': [18, 22, 30, 28, 35, 40],
  '蕨类': [12, 10, 15, 18, 20, 22],
}
const FALLBACK_PLANT_AREA_LABELS = ['核心区A', '缓冲区B', '实验区C', '保护区D', '过渡区E', '外围区F']

export default function SpeciesAnalysisPage() {
  const user = useAuthStore((state) => state.user)
  const permissions = user ? resolvePermissions(user) : EMPTY_PERMISSIONS

  const availableTabs = useMemo<SpeciesTab[]>(() => {
    const allTabs: SpeciesTab[] = ['🐾 动物物种分析', '🌿 植物物种分析', '🧬 物种管理']
    return allTabs.filter((tab) => hasPermission(permissions, tabPermissionMap[tab]))
  }, [permissions])

  const [activeTab, setActiveTab] = useState<SpeciesTab>('🐾 动物物种分析')
  const currentTab = availableTabs.includes(activeTab) ? activeTab : availableTabs[0]

  // Animal/plant tab state
  const [rawOrgTree, setRawOrgTree] = useState<OrgTreeNode[]>([])
  const [orgId, setOrgId] = useState<string>('')
  const [animalCategory, setAnimalCategory] = useState<string>('全部')
  const [plantCategory, setPlantCategory] = useState<string>('全部')
  const [stats, setStats] = useState<SpeciesStatItem[]>([])
  const [images, setImages] = useState<SpeciesImageItem[]>([])
  const [imagesTotal, setImagesTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [heatmapData, setHeatmapData] = useState<{ species: string[]; areas?: string[]; data: [number, number, number][] } | null>(null)

  // Species management tab state
  const [catalogData, setCatalogData] = useState<SpeciesCatalogItem[]>([])
  const [catalogTotal, setCatalogTotal] = useState(0)
  const [catalogPage, setCatalogPage] = useState(1)
  const [catalogPageSize] = useState(10)
  const [catalogKeyword, setCatalogKeyword] = useState('')
  const [catalogCategory, setCatalogCategory] = useState<string>('')
  const [catalogProtection, setCatalogProtection] = useState<string>('')
  const [catalogOrgId, setCatalogOrgId] = useState<string>('')
  const [catalogLoading, setCatalogLoading] = useState(false)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<SpeciesCatalogItem | null>(null)
  const [form] = Form.useForm()

  const { orgOptions, orgOnlyOptions } = useOrgFilter(rawOrgTree)

  useEffect(() => {
    imageApi.orgTree().then(setRawOrgTree).catch(() => setRawOrgTree([]))
  }, [])

  if (availableTabs.length === 0) {
    return null
  }

  const isAnimal = currentTab === '🐾 动物物种分析'
  const isManagement = currentTab === '🧬 物种管理'
  const categoryOptions = isAnimal ? ANIMAL_CATEGORIES : PLANT_CATEGORIES
  const currentCategory = isAnimal ? animalCategory : plantCategory
  const setCurrentCategory = isAnimal ? setAnimalCategory : setPlantCategory

  // Load animal/plant data
  async function loadData() {
    setLoading(true)
    const category = isAnimal ? 'animal' : 'plant'
    try {
      const [statsResult, heatmapResult, imagesResult] = await Promise.all([
        speciesApi.stats(category, orgId || undefined).catch(() => isAnimal ? FALLBACK_ANIMAL_STATS : FALLBACK_PLANT_STATS),
        speciesApi.heatmap(category, orgId || undefined).catch(() => null),
        speciesApi.images({ category, species: currentCategory, orgId: orgId || undefined, page: 1, pageSize: 12 }).catch(() => ({ list: [], total: 0, page: 1, pageSize: 12 })),
      ])
      setStats(statsResult)
      if (heatmapResult) {
        setHeatmapData(heatmapResult)
      } else {
        if (isAnimal) {
          const fallbackSpecies = Object.keys(FALLBACK_ANIMAL_HEATMAP)
          const heatData: [number, number, number][] = []
          fallbackSpecies.forEach((sp, yIdx) => {
            FALLBACK_ANIMAL_HEATMAP[sp].forEach((val, xIdx) => {
              heatData.push([xIdx, yIdx, val])
            })
          })
          setHeatmapData({ species: fallbackSpecies, data: heatData })
        } else {
          const fallbackSpecies = Object.keys(FALLBACK_PLANT_HEATMAP)
          const heatData: [number, number, number][] = []
          fallbackSpecies.forEach((sp, yIdx) => {
            FALLBACK_PLANT_HEATMAP[sp].forEach((val, xIdx) => {
              heatData.push([xIdx, yIdx, val])
            })
          })
          setHeatmapData({ species: fallbackSpecies, areas: FALLBACK_PLANT_AREA_LABELS, data: heatData })
        }
      }
      setImages(imagesResult.list)
      setImagesTotal(imagesResult.total)
    } finally {
      setLoading(false)
    }
  }

  // Load species catalog data
  async function loadCatalog() {
    setCatalogLoading(true)
    try {
      const result = await speciesCatalogApi.query({
        keyword: catalogKeyword || undefined,
        category: catalogCategory || undefined,
        protectionLevel: catalogProtection || undefined,
        orgId: catalogOrgId || undefined,
        page: catalogPage,
        pageSize: catalogPageSize,
      })
      setCatalogData(result.list)
      setCatalogTotal(result.total)
    } catch {
      setCatalogData([])
      setCatalogTotal(0)
    } finally {
      setCatalogLoading(false)
    }
  }

  function resetCatalogFilters() {
    setCatalogKeyword('')
    setCatalogCategory('')
    setCatalogProtection('')
    setCatalogOrgId('')
    setCatalogPage(1)
  }

  async function handleBatchDelete() {
    if (selectedRowKeys.length === 0) return
    Modal.confirm({
      title: '批量删除',
      content: `确定要删除选中的 ${selectedRowKeys.length} 个物种吗？`,
      okText: '删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await Promise.all(selectedRowKeys.map((key) => speciesCatalogApi.remove(key as string | number)))
          message.success(`成功删除 ${selectedRowKeys.length} 个物种`)
          setSelectedRowKeys([])
          void loadCatalog()
        } catch {
          message.error('批量删除失败')
        }
      },
    })
  }

  function handleExport() {
    const headers = ['资源编号', '物种名称', '物种类别', '保护级别', '分布地点', '核心物种', '描述']
    const rows = catalogData.map((item) => [
      item.code, item.name, item.category, item.protectionLevel, item.location, item.isCore ? '是' : '否', item.description,
    ])
    const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${cell ?? ''}"`).join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `物种目录_${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
    message.success('导出成功')
  }

  useEffect(() => {
    if (!isManagement) void loadData()
  }, [currentTab, orgId])

  useEffect(() => {
    if (!isManagement && !loading) {
      const category = isAnimal ? 'animal' : 'plant'
      speciesApi.images({ category, species: currentCategory, orgId: orgId || undefined, page: 1, pageSize: 12 })
        .then((result) => { setImages(result.list); setImagesTotal(result.total) })
        .catch(() => { setImages([]); setImagesTotal(0) })
    }
  }, [currentCategory])

  useEffect(() => {
    if (isManagement) void loadCatalog()
  }, [currentTab, catalogPage, catalogKeyword, catalogCategory, catalogProtection, catalogOrgId])

  const totalCount = stats.reduce((sum, s) => sum + s.value, 0)

  const pieChartOption = useMemo(() => {
    const colors = stats.map((s) => SPECIES_COLORS[s.title] ?? '#4a9eff')
    return {
      tooltip: { trigger: 'item' as const, formatter: '{b}: {c} ({d}%)' },
      legend: { orient: 'vertical' as const, right: 10, top: 'center', textStyle: { color: '#94a3b8', fontSize: 12 } },
      series: [{
        type: 'pie' as const, radius: ['40%', '70%'], center: ['40%', '50%'], avoidLabelOverlap: false,
        label: { show: false }, emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold', color: '#e2e8f0' } },
        data: stats.map((s) => ({ name: s.title, value: s.value })),
        itemStyle: { borderColor: '#0f1923', borderWidth: 2 },
      }],
      color: colors,
    }
  }, [stats])

  const heatmapOption = useMemo(() => {
    if (!heatmapData) return {}
    const hours = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`)
    const speciesNames = heatmapData.species
    if (isAnimal) {
      const maxVal = Math.max(...heatmapData.data.map((d) => d[2]))
      return {
        tooltip: { position: 'top' as const, formatter: (params: any) => `${speciesNames[params.data[1]]} ${hours[params.data[0]]}<br/>活动次数: ${params.data[2]}` },
        grid: { left: 60, right: 20, top: 10, bottom: 40 },
        xAxis: { type: 'category' as const, data: hours, splitArea: { show: true }, axisLabel: { color: '#94a3b8', fontSize: 10, interval: 2 }, axisTick: { show: false } },
        yAxis: { type: 'category' as const, data: speciesNames, axisLabel: { color: '#94a3b8', fontSize: 11 }, axisTick: { show: false } },
        visualMap: { min: 0, max: maxVal || 25, calculable: true, orient: 'horizontal' as const, left: 'center', bottom: 0, inRange: { color: ['#0f1923', '#1a3a4d', '#2dd4a8'] }, textStyle: { color: '#94a3b8' }, show: false },
        series: [{ type: 'heatmap' as const, data: heatmapData.data, label: { show: false }, emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.5)' } } }],
      }
    } else {
      const areaLabels = heatmapData.areas ?? FALLBACK_PLANT_AREA_LABELS
      const maxVal = Math.max(...heatmapData.data.map((d) => d[2]))
      return {
        tooltip: { position: 'top' as const, formatter: (params: any) => `${areaLabels[params.data[0]]} - ${speciesNames[params.data[1]]}<br/>分布密度: ${params.data[2]}` },
        grid: { left: 60, right: 20, top: 10, bottom: 40 },
        xAxis: { type: 'category' as const, data: areaLabels, splitArea: { show: true }, axisLabel: { color: '#94a3b8', fontSize: 10, rotate: 15 }, axisTick: { show: false } },
        yAxis: { type: 'category' as const, data: speciesNames, axisLabel: { color: '#94a3b8', fontSize: 11 }, axisTick: { show: false } },
        visualMap: { min: 0, max: maxVal || 50, calculable: true, orient: 'horizontal' as const, left: 'center', bottom: 0, inRange: { color: ['#0f1923', '#1a3a2a', '#2dd4a8'] }, textStyle: { color: '#94a3b8' }, show: false },
        series: [{ type: 'heatmap' as const, data: heatmapData.data, label: { show: false }, emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.5)' } } }],
      }
    }
  }, [heatmapData, isAnimal])

  // Species management columns
  const catalogColumns: ColumnsType<SpeciesCatalogItem> = [
    { title: '资源编号', dataIndex: 'code', key: 'code', width: 120 },
    { title: '物种名称', dataIndex: 'name', key: 'name', width: 120, render: (text: string) => <span className="font-medium text-slate-200">{text}</span> },
    { title: '物种类别', dataIndex: 'category', key: 'category', width: 100, render: (text: string) => <Tag color={CATEGORY_TAG_COLORS[text] ?? 'default'}>{text}</Tag> },
    { title: '保护级别', dataIndex: 'protectionLevel', key: 'protectionLevel', width: 100, render: (text: string) => <Tag color={PROTECTION_TAG_COLORS[text] ?? 'default'}>{text}</Tag> },
    { title: '分布地点', dataIndex: 'location', key: 'location', width: 120 },
    { title: '核心物种', dataIndex: 'isCore', key: 'isCore', width: 90, render: (v: boolean) => v ? <Tag color="green">是</Tag> : <Tag>否</Tag> },
    {
      title: '操作', key: 'action', width: 120,
      render: (_: unknown, record: SpeciesCatalogItem) => (
        <span className="flex gap-2">
          <a className="text-blue-400 hover:text-blue-300" onClick={() => openEditModal(record)}>编辑</a>
          <a className="text-red-400 hover:text-red-300" onClick={() => handleDelete(record)}>删除</a>
        </span>
      ),
    },
  ]

  function openAddModal() {
    setEditingItem(null)
    form.resetFields()
    form.setFieldsValue({ category: '动物', protectionLevel: '无', isCore: false })
    setModalOpen(true)
  }

  function openEditModal(item: SpeciesCatalogItem) {
    setEditingItem(item)
    form.setFieldsValue({
      code: item.code,
      name: item.name,
      category: item.category,
      protectionLevel: item.protectionLevel,
      location: item.location,
      orgId: item.orgId != null ? String(item.orgId) : undefined,
      isCore: item.isCore,
      phylum: item.phylum,
      className: item.className,
      speciesOrder: item.speciesOrder,
      family: item.family,
      description: item.description,
    })
    setModalOpen(true)
  }

  async function handleModalOk() {
    try {
      const values = await form.validateFields()
      // Derive location from orgId selection
      const selectedOrg = orgOnlyOptions.find(o => o.value === values.orgId)
      if (selectedOrg) {
        values.location = selectedOrg.label
      }
      if (editingItem) {
        await speciesCatalogApi.update(editingItem.id, values)
        message.success('编辑成功')
      } else {
        await speciesCatalogApi.create(values)
        message.success('新增成功')
      }
      setModalOpen(false)
      void loadCatalog()
    } catch {
      // form validation failed or API error
    }
  }

  async function handleDelete(item: SpeciesCatalogItem) {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除物种「${item.name}」吗？`,
      okText: '删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        await speciesCatalogApi.remove(item.id)
        message.success('删除成功')
        void loadCatalog()
      },
    })
  }

  // Species management row selection
  const rowSelection: TableRowSelection<SpeciesCatalogItem> = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => setSelectedRowKeys(keys),
  }

  // Render species management tab
  if (isManagement) {
    return (
      <div>
        <SectionCard title="">
          <div className="mb-5">
            <Segmented
              value={currentTab}
              onChange={(v) => setActiveTab(v as SpeciesTab)}
              options={['🐾 动物物种分析', '🌿 植物物种分析', '🧬 物种管理'].filter((opt) => availableTabs.includes(opt as SpeciesTab))}
              className="bg-white/[0.06] backdrop-blur-sm"
            />
          </div>

          <div className="mb-4 flex flex-wrap items-end gap-4">
            <div>
              <label className="mb-1 block text-xs text-slate-400">组织机构</label>
              <Select
                value={catalogOrgId}
                onChange={(v) => { setCatalogOrgId(v); setCatalogPage(1) }}
                options={orgOptions}
                showSearch
                optionFilterProp="label"
                style={{ minWidth: 160 }}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">物种名称</label>
              <Input
                placeholder="搜索物种名称"
                value={catalogKeyword}
                onChange={(e) => { setCatalogKeyword(e.target.value); setCatalogPage(1) }}
                allowClear
                style={{ width: 180 }}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">物种类别</label>
              <Select
                value={catalogCategory || undefined}
                onChange={(v) => { setCatalogCategory(v || ''); setCatalogPage(1) }}
                options={[
                  { label: '全部类别', value: '' },
                  { label: '动物', value: '动物' },
                  { label: '植物', value: '植物' },
                  { label: '真菌', value: '真菌' },
                ]}
                allowClear
                style={{ width: 140 }}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">保护级别</label>
              <Select
                value={catalogProtection || undefined}
                onChange={(v) => { setCatalogProtection(v || ''); setCatalogPage(1) }}
                options={[
                  { label: '全部级别', value: '' },
                  { label: '一级', value: '一级' },
                  { label: '二级', value: '二级' },
                  { label: '无', value: '无' },
                ]}
                allowClear
                style={{ width: 140 }}
              />
            </div>
            <Button type="primary" onClick={() => void loadCatalog()}>筛选</Button>
            <Button onClick={resetCatalogFilters}>重置</Button>
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            <Button type="primary" onClick={openAddModal}>+ 新增物种</Button>
            <Button onClick={handleExport}>导出</Button>
            {selectedRowKeys.length > 0 && (
              <Popconfirm
                title={`确定要删除选中的 ${selectedRowKeys.length} 个物种吗？`}
                onConfirm={handleBatchDelete}
                okText="删除"
                cancelText="取消"
                okButtonProps={{ danger: true }}
              >
                <Button danger>批量删除 ({selectedRowKeys.length})</Button>
              </Popconfirm>
            )}
          </div>

          <Table<SpeciesCatalogItem>
            rowKey="id"
            columns={catalogColumns}
            dataSource={catalogData}
            loading={catalogLoading}
            rowSelection={rowSelection}
            pagination={{
              current: catalogPage,
              total: catalogTotal,
              pageSize: catalogPageSize,
              showSizeChanger: true,
              onChange: (page) => setCatalogPage(page),
            }}
            size="middle"
          />
        </SectionCard>

        <Modal
          title={editingItem ? '编辑物种' : '新增物种'}
          open={modalOpen}
          onOk={handleModalOk}
          onCancel={() => setModalOpen(false)}
          okText={editingItem ? '保存' : '创建'}
          destroyOnHidden
          width={680}
        >
          <Form form={form} layout="vertical">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="资源编号" name="code" rules={[{ required: true, message: '请输入资源编号' }]}>
                  <Input placeholder="如：SP2024001" disabled={!!editingItem} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="物种名称" name="name" rules={[{ required: true, message: '请输入物种名称' }]}>
                  <Input placeholder="物种中文名" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="物种类别" name="category" rules={[{ required: true, message: '请选择物种类别' }]}>
                  <Select placeholder="请选择" options={[
                    { label: '动物', value: '动物' },
                    { label: '植物', value: '植物' },
                    { label: '真菌', value: '真菌' },
                  ]} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="保护级别" name="protectionLevel">
                  <Select placeholder="选择保护级别" options={[
                    { label: '无', value: '无' },
                    { label: '一级', value: '一级' },
                    { label: '二级', value: '二级' },
                  ]} allowClear />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item label="分布地点（组织机构）" name="orgId" rules={[{ required: true, message: '请选择组织机构' }]}>
              <Select placeholder="请选择组织" options={orgOnlyOptions} showSearch optionFilterProp="label" />
            </Form.Item>
            <Form.Item label="是否为核心物种" name="isCore" valuePropName="checked">
              <Switch checkedChildren="是" unCheckedChildren="否" />
            </Form.Item>

            <div className="my-4 border-t border-white/10 pt-4">
              <p className="mb-4 text-xs text-slate-500">以下为非必填项</p>
            </div>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="门" name="phylum">
                  <Input placeholder="如：脊索动物门" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="纲" name="className">
                  <Input placeholder="如：哺乳纲" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="目" name="speciesOrder">
                  <Input placeholder="如：偶蹄目" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="科" name="family">
                  <Input placeholder="如：鹿科" />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item label="描述" name="description">
              <Input.TextArea rows={3} placeholder="物种描述信息" />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    )
  }

  // Render animal/plant analysis tabs
  return (
    <div>
      <SectionCard title="">
        <Spin spinning={loading}>
          <div className="mb-5">
            {availableTabs.length > 1 && (
              <Segmented
                value={currentTab}
                onChange={(v) => setActiveTab(v as SpeciesTab)}
                options={['🐾 动物物种分析', '🌿 植物物种分析', '🧬 物种管理'].filter((opt) => availableTabs.includes(opt as SpeciesTab))}
                className="bg-white/[0.06] backdrop-blur-sm"
              />
            )}
          </div>

          <div className="mb-5 flex flex-wrap items-end gap-4">
            <div>
              <label className="mb-1 block text-xs text-slate-400">组织机构</label>
              <Select
                value={orgId}
                onChange={setOrgId}
                options={orgOptions}
                showSearch
                optionFilterProp="label"
                style={{ minWidth: 160 }}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">{isAnimal ? '物种分类' : '植物分类'}</label>
              <Select
                value={currentCategory}
                onChange={setCurrentCategory}
                options={categoryOptions}
                style={{ minWidth: 140 }}
              />
            </div>
            <Button type="primary" onClick={() => void loadData()}>筛选</Button>
          </div>

          <div className="mb-5 grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <h3 className="mb-3 text-sm font-semibold text-slate-200">{isAnimal ? '物种数量统计' : '植物种类统计'}</h3>
              {stats.length > 0 ? (
                <ReactECharts option={pieChartOption} style={{ height: 280 }} />
              ) : (
                <div className="flex h-[280px] items-center justify-center text-slate-500">暂无统计数据</div>
              )}
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <h3 className="mb-3 text-sm font-semibold text-slate-200">{isAnimal ? '物种活动时段热力图' : '植物分布热力图'}</h3>
              {heatmapData ? (
                <ReactECharts option={heatmapOption} style={{ height: 280 }} />
              ) : (
                <div className="flex h-[280px] items-center justify-center text-slate-500">暂无热力图数据</div>
              )}
            </div>
          </div>

          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-medium text-slate-300">AI自动分类影像列表</h4>
            <Button size="small" onClick={() => message.info('正在导出...')}>批量导出</Button>
          </div>
          <Row gutter={[16, 16]}>
            {images.map((img) => (
              <Col key={img.id} span={6}>
                <Card hoverable className="border-white/10 shadow-[0_2px_12px_rgba(0,0,0,0.2)]" styles={{ body: { padding: 0 } }}>
                  <div className="flex h-36 items-center justify-center bg-white/[0.06]">
                    {img.imageUrl ? (
                      <img src={img.imageUrl} alt={img.species} className="h-full w-full object-cover" />
                    ) : (
                      <div className="text-center">
                        <span className="text-4xl">{isAnimal ? '📷' : '🌿'}</span>
                        <p className="mt-1 text-xs text-slate-500">{img.fileName || '暂无图片'}</p>
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <div className="flex items-center justify-between">
                      <Tag color={SPECIES_TAG_COLORS[img.species] ?? 'default'}>{img.species}</Tag>
                      <span className="text-sm font-semibold text-[#2dd4a8]">{img.confidence}%</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">{img.location || '未知区域'}</p>
                    <p className="text-xs text-slate-500">{img.time}</p>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
          {images.length === 0 && !loading && (
            <div className="py-12 text-center text-slate-500">暂无识别数据</div>
          )}
        </Spin>
      </SectionCard>
    </div>
  )
}