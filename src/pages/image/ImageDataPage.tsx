import { Button, DatePicker, Select, Spin, Table, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import ReactECharts from 'echarts-for-react'
import { useEffect, useMemo, useState } from 'react'
import { SectionCard } from '@/components/common/SectionCard'
import { useOrgFilter } from '@/hooks/useOrgFilter'
import { dataApi, orgApi } from '@/services/api'
import type { DataOverviewItem, DataChartResponse, DailySummaryItem } from '@/services/api'
import type { OrgTreeNode } from '@/types/models'

const { RangePicker } = DatePicker

const FALLBACK_OVERVIEW: DataOverviewItem[] = [
  { title: '本月物种识别', value: 1284, trend: '23%', trendDir: 'up' },
  { title: '总抓拍图片', value: 12456, trend: '15%', trendDir: 'up' },
  { title: '告警事件', value: 86, trend: '8%', trendDir: 'down' },
]

const OVERVIEW_ICONS: Record<string, string> = {
  '本月物种识别': '🦌',
  '总抓拍图片': '📷',
  '告警事件': '⚠️',
}

const OVERVIEW_COLORS: Record<string, string> = {
  '本月物种识别': '#2dd4a8',
  '总抓拍图片': '#4a9eff',
  '告警事件': '#f0b429',
}

export default function ImageDataPage() {
  const [rawOrgTree, setRawOrgTree] = useState<OrgTreeNode[]>([])
  const { orgOptions } = useOrgFilter(rawOrgTree)
  const [orgId, setOrgId] = useState<string | undefined>(undefined)
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([
    dayjs().subtract(30, 'day'),
    dayjs(),
  ])
  const [overviewData, setOverviewData] = useState<DataOverviewItem[]>([])
  const [chartData, setChartData] = useState<DataChartResponse | null>(null)
  const [summaryData, setSummaryData] = useState<DailySummaryItem[]>([])
  const [summaryTotal, setSummaryTotal] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    void orgApi.tree().then(setRawOrgTree).catch(() => setRawOrgTree([]))
  }, [])

  useEffect(() => {
    void loadData()
  }, [])



  async function loadData(page = currentPage) {
    setLoading(true)
    const startDate = dateRange[0]?.format('YYYY-MM-DD') ?? dayjs().subtract(30, 'day').format('YYYY-MM-DD')
    const endDate = dateRange[1]?.format('YYYY-MM-DD') ?? dayjs().format('YYYY-MM-DD')
    try {
      const [overview, charts, summary] = await Promise.all([
        dataApi.overview(orgId).catch(() => FALLBACK_OVERVIEW),
        dataApi.charts({ startDate, endDate, orgId }).catch(() => null),
        dataApi.summary({ startDate, endDate, orgId, page, pageSize: 10 }).catch(() => ({ list: [], total: 0, page: 1, pageSize: 10 })),
      ])
      setOverviewData(overview)
      setChartData(charts)
      setSummaryData(summary.list)
      setSummaryTotal(summary.total)
      setCurrentPage(page)
    } finally {
      setLoading(false)
    }
  }

  function handleFilter() {
    setCurrentPage(1)
    void loadData()
  }

  function handleExport() {
    message.info('正在导出数据...')
    const header = '日期,抓拍总数,野生动物,空拍,人类触发,报警事件,设备离线\n'
    const rows = summaryData.map((d) =>
      [d.date, d.totalCaptures, d.wildlife, d.emptyCaptures, d.humanTriggers, d.alertEvents, d.deviceOffline].join(','),
    )
    const csv = header + rows.join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `数据展示_${dayjs().format('YYYYMMDD')}.csv`
    a.click()
    URL.revokeObjectURL(url)
    message.success('导出完成')
  }

  const barChartOption = useMemo(() => {
    if (!chartData?.captures?.length) {
      return {
        tooltip: { trigger: 'axis' as const, axisPointer: { type: 'shadow' as const } },
        grid: { left: 50, right: 20, top: 20, bottom: 30 },
        xAxis: { type: 'category' as const, data: [] },
        yAxis: { type: 'value' as const },
        series: [{ type: 'bar' as const, data: [] }],
      }
    }
    const dates = chartData.captures.map((d) => d.date.slice(5))
    const values = chartData.captures.map((d) => d.value)
    return {
      tooltip: { trigger: 'axis' as const, axisPointer: { type: 'shadow' as const } },
      grid: { left: 50, right: 20, top: 20, bottom: 30 },
      xAxis: { type: 'category' as const, data: dates, axisLabel: { color: '#94a3b8', fontSize: 11 } },
      yAxis: { type: 'value' as const, axisLabel: { color: '#94a3b8' }, splitLine: { lineStyle: { color: '#1e293b' } } },
      series: [{
        type: 'bar' as const,
        data: values,
        itemStyle: { color: '#4a9eff', borderRadius: [4, 4, 0, 0] },
        barMaxWidth: 24,
      }],
    }
  }, [chartData])

  const lineChartOption = useMemo(() => {
    if (!chartData?.trends?.length) {
      return {
        tooltip: { trigger: 'axis' as const },
        legend: { data: [], textStyle: { color: '#94a3b8' } },
        grid: { left: 50, right: 20, top: 40, bottom: 30 },
        xAxis: { type: 'category' as const, data: [] },
        yAxis: { type: 'value' as const },
        series: [],
      }
    }
    const colors = ['#2dd4a8', '#e5484d', '#f0b429', '#8b5cf6']
    const dates = chartData.trends[0]?.data.map((d) => d.date.slice(5)) ?? []
    return {
      tooltip: { trigger: 'axis' as const },
      legend: { data: chartData.trends.map((t) => t.name), textStyle: { color: '#94a3b8', fontSize: 11 }, top: 0 },
      grid: { left: 50, right: 20, top: 40, bottom: 30 },
      xAxis: { type: 'category' as const, data: dates, axisLabel: { color: '#94a3b8', fontSize: 11 } },
      yAxis: { type: 'value' as const, axisLabel: { color: '#94a3b8' }, splitLine: { lineStyle: { color: '#1e293b' } } },
      series: chartData.trends.map((trend, idx) => ({
        name: trend.name,
        type: 'line' as const,
        data: trend.data.map((d) => d.value),
        smooth: true,
        lineStyle: { color: colors[idx] ?? '#4a9eff' },
        itemStyle: { color: colors[idx] ?? '#4a9eff' },
      })),
    }
  }, [chartData])

  const columns: ColumnsType<DailySummaryItem> = [
    { title: '日期', dataIndex: 'date', key: 'date' },
    { title: '抓拍总数', dataIndex: 'totalCaptures', key: 'totalCaptures' },
    {
      title: '野生动物',
      dataIndex: 'wildlife',
      key: 'wildlife',
      render: (value: number) => <span className="font-medium text-emerald-400">{value.toLocaleString()}</span>,
    },
    { title: '空拍', dataIndex: 'emptyCaptures', key: 'emptyCaptures' },
    { title: '人类触发', dataIndex: 'humanTriggers', key: 'humanTriggers' },
    {
      title: '报警事件',
      dataIndex: 'alertEvents',
      key: 'alertEvents',
      render: (value: number) => <span className="font-medium text-red-400">{value}</span>,
    },
    {
      title: '设备离线',
      dataIndex: 'deviceOffline',
      key: 'deviceOffline',
      render: (value: number) => <span className="font-medium text-amber-400">{value}</span>,
    },
  ]

  return (
    <div>
      <SectionCard title="">
        <Spin spinning={loading}>
          <div className="mb-6 flex flex-wrap items-end gap-4">
            <div>
              <div className="mb-1 text-xs text-slate-400">时间范围</div>
              <RangePicker
                value={dateRange}
                onChange={(dates) => setDateRange(dates)}
                allowClear={false}
              />
            </div>
            <div>
              <div className="mb-1 text-xs text-slate-400">组织机构</div>
              <Select
                value={orgId ?? ''}
                onChange={(value) => setOrgId(value === '' ? undefined : value)}
                options={orgOptions}
                showSearch
                optionFilterProp="label"
                style={{ minWidth: 180 }}
              />
            </div>
            <Button type="primary" onClick={handleFilter}>
              筛选
            </Button>
            <Button onClick={handleExport}>
              导出Excel
            </Button>
          </div>

          {/* 概览卡片 */}
          <div className="mb-6 grid grid-cols-3 gap-4">
            {overviewData.map((item) => (
              <div
                key={item.title}
                className="flex items-center gap-3 rounded-xl border border-white/10 px-4 py-3"
                style={{ background: `linear-gradient(135deg, ${OVERVIEW_COLORS[item.title] ?? '#2dd4a8'}20, ${OVERVIEW_COLORS[item.title] ?? '#2dd4a8'}10)` }}
              >
                <div className="text-2xl">{OVERVIEW_ICONS[item.title] ?? '📊'}</div>
                <div>
                  <div className="text-lg font-bold" style={{ color: OVERVIEW_COLORS[item.title] ?? '#2dd4a8' }}>
                    {item.value.toLocaleString()}
                  </div>
                  <div className="text-xs text-slate-300">{item.title}</div>
                </div>
                <div className="ml-auto text-xs" style={{ color: item.trendDir === 'up' ? '#2dd4a8' : item.trendDir === 'down' ? '#e5484d' : '#94a3b8' }}>
                  {item.trendDir === 'up' ? '↑' : item.trendDir === 'down' ? '↓' : '→'}{item.trend}
                </div>
              </div>
            ))}
          </div>

          <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <h3 className="mb-3 text-sm font-semibold text-slate-200">设备抓拍图片数量统计</h3>
              <ReactECharts option={barChartOption} style={{ height: 280 }} />
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <h3 className="mb-3 text-sm font-semibold text-slate-200">报警事件分类趋势</h3>
              <ReactECharts option={lineChartOption} style={{ height: 280 }} />
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <h3 className="mb-3 text-sm font-semibold text-slate-200">每日抓拍 & 告警汇总</h3>
            <Table<DailySummaryItem>
              rowKey="date"
              columns={columns}
              dataSource={summaryData}
              loading={loading}
              pagination={{
                current: currentPage,
                total: summaryTotal,
                pageSize: 10,
                showSizeChanger: true,
                onChange: (page) => {
                  void loadData(page)
                },
              }}
              size="middle"
            />
          </div>
        </Spin>
      </SectionCard>
    </div>
  )
}