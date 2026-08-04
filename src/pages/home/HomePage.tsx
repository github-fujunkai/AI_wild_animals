import { Select, Skeleton } from 'antd'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useOrgFilter } from '@/hooks/useOrgFilter'
import { SectionCard } from '@/components/common/SectionCard'
import { homeApi, deviceApi, imageApi } from '@/services/api'
import { useAuthStore } from '@/store/auth-store'
import type { DeviceItem, OrgTreeNode } from '@/types/models'
import { hasPermission, resolvePermissions } from '@/utils/permission'

// 声明天地图全局变量
declare const T: any

const EMPTY_PERMISSIONS: string[] = []

export default function HomePage() {
  const user = useAuthStore((state) => state.user)
  const permissions = user ? resolvePermissions(user) : EMPTY_PERMISSIONS

  const hasGisPermission = hasPermission(permissions, 'home:gis')

  const [cards, setCards] = useState<{ title: string; value: number; color: string }[]>([])
  const [alerts, setAlerts] = useState<{ id: string; title: string; time: string; level: string; isRead?: boolean }[]>([])
  const [devices, setDevices] = useState<DeviceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [rawOrgTree, setRawOrgTree] = useState<OrgTreeNode[]>([])
  const { orgOptions } = useOrgFilter(rawOrgTree)
  const [filterOrgId, setFilterOrgId] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<string>('')
  const mapInstanceRef = useRef<any>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [overview, recent, deviceRes] = await Promise.all([
        homeApi.getOverview(),
        homeApi.getAlerts(),
        deviceApi.query({ page: 1, pageSize: 200 }),
      ])
      setCards(overview)
      setAlerts(recent)
      setDevices(deviceRes.list)
      setLoading(false)
    }

    void load()
    imageApi.orgTree().then(setRawOrgTree).catch(() => setRawOrgTree([]))
  }, [])

  const onlineDevices = useMemo(() => devices.filter((d) => d.status === '在线'), [devices])
  const offlineDevices = useMemo(() => devices.filter((d) => d.status === '离线'), [devices])
  const alertDevices = useMemo(() => devices.filter((d) => d.status === '告警'), [devices])

  const filteredDevices = useMemo(() => {
    return devices.filter((d) => {
      if (filterOrgId && String(d.orgId) !== filterOrgId) return false
      if (filterStatus && d.status !== filterStatus) return false
      return true
    })
  }, [devices, filterOrgId, filterStatus])

  const filteredOnline = useMemo(() => filteredDevices.filter((d) => d.status === '在线'), [filteredDevices])
  const filteredOffline = useMemo(() => filteredDevices.filter((d) => d.status === '离线'), [filteredDevices])
  const filteredAlert = useMemo(() => filteredDevices.filter((d) => d.status === '告警'), [filteredDevices])

  useEffect(() => {
    if (!hasGisPermission) return
    if (typeof T === 'undefined') return

    // 延迟确保 DOM 已渲染，切换 tab 回来时地图容器已挂载并有尺寸
    const timer = setTimeout(() => {
      const mapDiv = document.getElementById('mapDiv')
      if (!mapDiv) return
      // 清理可能残留的旧实例
      if (mapInstanceRef.current) {
        try { mapInstanceRef.current.remove() } catch { /* ignore */ }
        mapInstanceRef.current = null
      }

      const TK = '6260c21644a37289778a4f0e02f8af2e'

      const imgURL =
        'https://t0.tianditu.gov.cn/img_w/wmts?' +
        'SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=img&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles' +
        '&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=' + TK
      const imgLayer = new T.TileLayer(imgURL, { minZoom: 1, maxZoom: 18 })

      const map = new T.Map('mapDiv')
      // 移除默认的交通线（矢量）图层
      const defaultLayers = map.getLayers()
      defaultLayers.forEach((layer: any) => { try { map.removeLayer(layer) } catch { /* ignore */ } })
      mapInstanceRef.current = map
      map.centerAndZoom(new T.LngLat(121.4737, 31.2304), 12)
      map.enableScrollWheelZoom()
      map.addLayer(imgLayer)

      filteredDevices.forEach((device) => {
        const lng = parseFloat(device.longitude)
        const lat = parseFloat(device.latitude)
        if (isNaN(lng) || isNaN(lat)) return

        const colorMap: Record<string, string> = { '在线': '#2dd4a8', '离线': '#94a3b8', '告警': '#f87171', '低电量': '#fbbf24' }
        const pinColor = colorMap[device.status] ?? '#94a3b8'
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="25" height="35" viewBox="0 0 25 35"><path d="M12.5 0C5.6 0 0 5.6 0 12.5 0 22 12.5 35 12.5 35S25 22 25 12.5C25 5.6 19.4 0 12.5 0z" fill="${pinColor}"/><circle cx="12.5" cy="12.5" r="5" fill="white"/></svg>`
        const iconDataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
        const icon = new T.Icon({
          iconUrl: iconDataUrl,
          iconSize: new T.Point(25, 35),
          iconAnchor: new T.Point(12, 35),
        })
        const marker = new T.Marker(new T.LngLat(lng, lat), { icon })
        map.addOverLay(marker)
        const content = `<div style="font-size:12px"><b>${device.name}</b><br/>状态: ${device.status}<br/>电量: ${device.battery}%</div>`
        const infoWin = new T.InfoWindow(content, { offset: new T.Point(0, -35) })
        marker.addEventListener('click', () => {
          marker.openInfoWindow(infoWin)
        })
      })
    }, 200)

    return () => clearTimeout(timer)
  }, [filteredDevices])

  if (!hasGisPermission) {
    return null
  }

  return (
    <div className="h-full">
      <SectionCard title="" className="!p-0 overflow-hidden h-full">
        <div className="relative h-full w-full">
          <div id="mapDiv" className="h-full w-full rounded-xl" />

          {/* Stats overlay - top left */}
          <div className="absolute left-5 top-5 flex gap-0 overflow-hidden rounded-2xl border border-white/[0.1] shadow-[0_8px_32px_rgba(0,0,0,0.4)]" style={{ zIndex: 9999, background: 'rgba(13, 27, 42, 0.75)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
            {cards.map((item) => (
              <div key={item.title} className="flex flex-col items-center gap-1 border-l border-white/[0.06] px-6 py-4" style={{ minWidth: 90 }}>
                <span className="text-lg">
                  {item.title === '总设备' ? '📹' : item.title === '在线设备' ? '✅' : item.title === '离线设备' ? '⚠️' : '🚨'}
                </span>
                <span className="text-[26px] font-bold leading-none" style={{ color: item.color }}>
                  {loading ? <Skeleton active paragraph={false} title={{ width: 24 }} /> : item.value}
                </span>
                <span className="text-[11px] text-slate-400 tracking-wide">{item.title}</span>
              </div>
            ))}
          </div>

          {/* Map legend */}
          <div className="absolute bottom-5 right-5 rounded-xl border border-white/[0.1] px-4 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.4)]" style={{ zIndex: 9999, background: 'rgba(20, 32, 45, 0.55)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
            <div className="mb-2 text-[13px] font-semibold text-slate-200">图例</div>
            <div className="flex flex-col gap-2 text-xs text-slate-400">
              <div className="flex items-center gap-2"><span className="inline-block h-3 w-3 rounded-full bg-emerald-400" />在线</div>
              <div className="flex items-center gap-2"><span className="inline-block h-3 w-3 rounded-full bg-slate-400" />离线</div>
              <div className="flex items-center gap-2"><span className="inline-block h-3 w-3 rounded-full bg-red-400" />告警</div>
              <div className="flex items-center gap-2"><span className="inline-block h-3 w-3 rounded-full bg-amber-400" />低电量</div>
            </div>
          </div>

          {/* Recent alerts */}
          <div className="absolute bottom-5 left-5 w-80 overflow-hidden rounded-xl border border-white/[0.1] shadow-[0_8px_32px_rgba(0,0,0,0.4)]" style={{ zIndex: 9999, background: 'rgba(20, 32, 45, 0.55)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
            <div className="p-4 pb-2">
              <div className="text-[15px] font-semibold text-[#e5484d]">🚨 最近告警</div>
            </div>
            <div className="overflow-y-auto px-4 pb-4" style={{ maxHeight: 200 }}>
              {alerts.map((item) => (
                <div key={item.id} className={`mb-2 flex items-start gap-2 rounded-lg border p-2 ${item.isRead ? 'border-white/[0.06] bg-white/[0.02]' : 'border-white/[0.1] bg-white/[0.05]'}`}>
                  {!item.isRead && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-red-400" />}
                  <div className="min-w-0 flex-1">
                    <div className={`text-sm ${item.isRead ? 'text-slate-400' : 'font-medium text-slate-200'}`}>{item.title}</div>
                    <div className="text-xs text-slate-500">{item.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Filter controls on map */}
          <div className="absolute right-5 top-5 w-[280px] rounded-2xl border border-white/[0.1] p-4 shadow-[0_8px_32px_rgba(0,0,0,0.4)]" style={{ zIndex: 9999, background: 'rgba(20, 32, 45, 0.55)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
              <div className="mb-4 font-semibold text-[#1a9a7a]">🗺️ 实时监控</div>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs text-slate-500">组织机构</label>
                  <Select
                    value={filterOrgId || undefined}
                    onChange={(v) => setFilterOrgId(v ?? '')}
                    options={orgOptions}
                    showSearch
                    optionFilterProp="label"
                    placeholder="全部组织"
                    allowClear
                    size="small"
                    style={{ width: '100%' }}
                    popupClassName="map-select-dropdown"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500">设备状态</label>
                  <Select
                    value={filterStatus || undefined}
                    onChange={(v) => setFilterStatus(v ?? '')}
                    options={[
                      { label: '全部状态', value: '' },
                      { label: '在线', value: '在线' },
                      { label: '离线', value: '离线' },
                      { label: '告警', value: '告警' },
                      { label: '低电量', value: '低电量' },
                    ]}
                    placeholder="全部状态"
                    allowClear
                    size="small"
                    style={{ width: '100%' }}
                    popupClassName="map-select-dropdown"
                  />
                </div>
              </div>
          </div>
        </div>
      </SectionCard>
    </div>
  )
}