import { Button, Select } from 'antd'
import { SectionCard } from '@/components/common/SectionCard'

const mockWeatherData = [
  { day: '周一', temp: 8, precipitation: 2.1, captures: 15 },
  { day: '周二', temp: 10, precipitation: 0, captures: 22 },
  { day: '周三', temp: 12, precipitation: 5.2, captures: 8 },
  { day: '周四', temp: 15, precipitation: 0, captures: 30 },
  { day: '周五', temp: 11, precipitation: 1.5, captures: 18 },
  { day: '周六', temp: 9, precipitation: 3.0, captures: 12 },
  { day: '周日', temp: 12.5, precipitation: 0.8, captures: 25 },
]

const mockNightCaptures = [
  { phase: '新月', captures: 45 },
  { phase: '上弦月', captures: 68 },
  { phase: '满月', captures: 92 },
  { phase: '下弦月', captures: 55 },
]

export default function EnvMonitorPage() {
  return (
    <div className="flex flex-col gap-6">
      {/* Filter Bar */}
      <SectionCard title="">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="mb-1 block text-xs text-slate-400">监测站点</label>
            <Select
              defaultValue="全部站点"
              options={[
                { label: '全部站点', value: '全部站点' },
                { label: '监测站A', value: '监测站A' },
                { label: '监测站B', value: '监测站B' },
                { label: '监测站C', value: '监测站C' },
              ]}
              style={{ minWidth: 160 }}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">时间范围</label>
            <Select
              defaultValue="最近7天"
              options={[
                { label: '最近7天', value: '最近7天' },
                { label: '最近30天', value: '最近30天' },
                { label: '最近90天', value: '最近90天' },
              ]}
              style={{ minWidth: 140 }}
            />
          </div>
          <Button type="primary">查询</Button>
          <Button>导出报告</Button>
        </div>
      </SectionCard>

      {/* 气象数据与抓拍量联动 */}
      <SectionCard title="气象数据与抓拍量联动">
        <div className="relative h-[300px] rounded-lg border border-white/[0.08] bg-white/[0.04] backdrop-blur-[10px]">
          {/* Y-axis labels */}
          <div className="absolute left-2 top-0 flex h-full flex-col justify-between py-4 text-[10px] text-slate-500">
            <span>30°C</span>
            <span>20°C</span>
            <span>10°C</span>
            <span>0°C</span>
          </div>

          {/* Chart area */}
          <div className="ml-10 flex h-full items-end gap-2 px-4 pt-4">
            {mockWeatherData.map((d, i) => {
              const tempHeight = Math.max(8, (d.temp / 30) * 220)
              const precipHeight = Math.max(0, (d.precipitation / 6) * 180)
              const captureHeight = Math.max(8, (d.captures / 35) * 200)
              return (
                <div key={i} className="flex flex-1 flex-col items-center gap-1">
                  <div className="relative flex w-full flex-col items-center" style={{ height: '250px' }}>
                    {/* Capture count line dot */}
                    <div
                      className="absolute h-2.5 w-2.5 rounded-full border-2"
                      style={{
                        background: '#2dd4a8',
                        borderColor: '#2dd4a8',
                        bottom: `${captureHeight}px`,
                      }}
                    />
                    {/* Temperature dot */}
                    <div
                      className="absolute h-2 w-2 rounded-full"
                      style={{
                        background: '#e5484d',
                        bottom: `${tempHeight}px`,
                      }}
                    />
                    {/* Precipitation bar */}
                    {d.precipitation > 0 && (
                      <div
                        className="absolute bottom-0 w-3/4 rounded-t"
                        style={{
                          background: 'rgba(74,158,255,0.6)',
                          height: `${precipHeight}px`,
                        }}
                      />
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500">{d.day}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-3 flex items-center gap-6 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: '#e5484d' }} />
            温度 (°C)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: 'rgba(74,158,255,0.8)' }} />
            降水量 (mm)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: '#2dd4a8' }} />
            抓拍数量
          </span>
        </div>
      </SectionCard>

      {/* 月相变化与夜间抓拍频次 */}
      <SectionCard title="月相变化与夜间抓拍频次">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {/* Moon phases */}
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center justify-center gap-8">
              {/* 新月 */}
              <div className="flex flex-col items-center gap-2">
                <div
                  className="h-16 w-16 rounded-full border-2 border-slate-600"
                  style={{ background: '#1a2332' }}
                />
                <span className="text-xs text-slate-400">新月</span>
              </div>
              {/* 上弦月 */}
              <div className="flex flex-col items-center gap-2">
                <div
                  className="h-16 w-16 rounded-full"
                  style={{
                    background: 'linear-gradient(to right, #e2e8f0 50%, #1a2332 50%)',
                  }}
                />
                <span className="text-xs text-slate-400">上弦月</span>
              </div>
              {/* 满月 */}
              <div className="flex flex-col items-center gap-2">
                <div
                  className="h-16 w-16 rounded-full"
                  style={{ background: 'radial-gradient(circle, #f5f5dc 0%, #e2e8f0 70%, #cbd5e1 100%)' }}
                />
                <span className="text-xs text-slate-400">满月</span>
              </div>
              {/* 下弦月 */}
              <div className="flex flex-col items-center gap-2">
                <div
                  className="h-16 w-16 rounded-full"
                  style={{
                    background: 'linear-gradient(to right, #1a2332 50%, #e2e8f0 50%)',
                  }}
                />
                <span className="text-xs text-slate-400">下弦月</span>
              </div>
            </div>
          </div>

          {/* Night capture frequency bar chart */}
          <div className="flex h-[180px] items-end gap-6 px-4">
            {mockNightCaptures.map((item, i) => {
              const maxCaptures = Math.max(...mockNightCaptures.map((d) => d.captures))
              const barHeight = Math.max(12, (item.captures / maxCaptures) * 140)
              return (
                <div key={i} className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-xs font-semibold text-slate-300">{item.captures}</span>
                  <div
                    className="w-full rounded-t"
                    style={{
                      background: i === 2 ? '#2dd4a8' : 'rgba(45,212,168,0.4)',
                      height: `${barHeight}px`,
                    }}
                  />
                  <span className="mt-1 text-[10px] text-slate-500">{item.phase}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Insight */}
        <div className="mt-4 rounded-lg border border-[#2dd4a8]/20 bg-[#2dd4a8]/5 px-4 py-3 text-sm text-[#2dd4a8]">
          📊 满月期间夜间抓拍量增加 35%
        </div>
      </SectionCard>

      {/* 3D地形监测点位地图 */}
      <SectionCard title="3D地形监测点位地图">
        <div
          className="relative h-[400px] overflow-hidden rounded-[10px]"
          style={{
            background:
              'linear-gradient(180deg, #132233 0%, #1a3040 30%, #1e3a4a 60%, #142830 100%)',
          }}
        >
          {/* Mountain silhouette */}
          <div
            className="absolute bottom-[50px] left-[10%] h-[150px] w-[80%]"
            style={{
              background: 'linear-gradient(135deg, #3a2a1a 0%, #2a1a0a 100%)',
              clipPath:
                'polygon(0% 100%, 15% 40%, 30% 70%, 45% 20%, 60% 50%, 75% 30%, 90% 60%, 100% 100%)',
            }}
          />
          {/* Mountain highlight overlay */}
          <div
            className="absolute bottom-[50px] left-[10%] h-[150px] w-[80%] opacity-30"
            style={{
              background:
                'linear-gradient(180deg, rgba(45,212,168,0.1) 0%, transparent 60%)',
              clipPath:
                'polygon(0% 100%, 15% 40%, 30% 70%, 45% 20%, 60% 50%, 75% 30%, 90% 60%, 100% 100%)',
            }}
          />
          {/* Water source */}
          <div
            className="absolute bottom-[80px] left-[35%] h-[40px] w-[120px] rounded-full opacity-70"
            style={{ background: '#4a9eff' }}
          />
          <div className="absolute bottom-[82px] left-[36%] text-[10px] text-blue-300">
            水源点
          </div>

          {/* Monitoring points */}
          <div
            className="absolute bottom-[120px] left-[20%] flex h-4 w-4 cursor-pointer items-center justify-center rounded-full border-2 border-slate-50"
            style={{ background: '#2dd4a8' }}
            title="监测点A - 海拔: 1200m"
          >
            <span className="absolute -top-5 whitespace-nowrap text-[10px] text-slate-200">
              监测点A
            </span>
          </div>
          <div
            className="absolute bottom-[150px] left-[50%] flex h-4 w-4 cursor-pointer items-center justify-center rounded-full border-2 border-slate-50"
            style={{ background: '#2dd4a8' }}
            title="监测点B - 海拔: 1500m"
          >
            <span className="absolute -top-5 whitespace-nowrap text-[10px] text-slate-200">
              监测点B
            </span>
          </div>
          <div
            className="absolute bottom-[100px] left-[75%] flex h-4 w-4 cursor-pointer items-center justify-center rounded-full border-2 border-slate-50"
            style={{ background: '#2dd4a8' }}
            title="监测点C - 海拔: 900m"
          >
            <span className="absolute -top-5 whitespace-nowrap text-[10px] text-slate-200">
              监测点C
            </span>
          </div>

          {/* Legend */}
          <div className="absolute left-5 top-5 rounded-lg bg-[rgba(13,27,42,0.75)] p-3 backdrop-blur-md">
            <div className="mb-2 font-semibold text-slate-200">📍 监测点位</div>
            <div className="text-xs text-slate-300">● 监测点A (海拔1200m)</div>
            <div className="text-xs text-slate-300">● 监测点B (海拔1500m)</div>
            <div className="text-xs text-slate-300">● 监测点C (海拔900m)</div>
            <div className="text-xs" style={{ color: '#4a9eff' }}>
              ● 水源点
            </div>
          </div>

          {/* Altitude scale */}
          <div className="absolute right-5 top-5 flex flex-col items-end gap-1 text-[10px] text-slate-500">
            <span>海拔 1500m</span>
            <span>海拔 1200m</span>
            <span>海拔 900m</span>
            <span>海拔 600m</span>
          </div>
        </div>
      </SectionCard>

      {/* 环境数据分析 */}
      <SectionCard title="环境数据分析">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* 今日平均温度 */}
          <div className="rounded-xl border border-white/5 bg-white/5 p-5">
            <div className="text-sm text-slate-400">🌡️ 今日平均温度</div>
            <div className="mt-2 text-3xl font-bold text-slate-100">12.5°C</div>
            <div className="mt-2 text-sm text-[#2dd4a8]">↑ 2.3°C 较昨日</div>
          </div>

          {/* 今日降水量 */}
          <div className="rounded-xl border border-white/5 bg-white/5 p-5">
            <div className="text-sm text-slate-400">🌧️ 今日降水量</div>
            <div className="mt-2 text-3xl font-bold text-slate-100">5.2mm</div>
            <div className="mt-2 text-sm text-[#e5484d]">↓ 3.1mm 较昨日</div>
          </div>

          {/* 平均风速 */}
          <div className="rounded-xl border border-white/5 bg-white/5 p-5">
            <div className="text-sm text-slate-400">💨 平均风速</div>
            <div className="mt-2 text-3xl font-bold text-slate-100">3.2m/s</div>
            <div className="mt-2 text-sm text-[#f0b429]">微风 · 适合监测</div>
          </div>
        </div>
      </SectionCard>
    </div>
  )
}