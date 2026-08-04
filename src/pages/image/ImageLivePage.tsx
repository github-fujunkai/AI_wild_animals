import { Button, Card, Col, Input, Row, Select, Tag } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { imageApi, orgApi } from '@/services/api'
import type { DeviceItem, OrgTreeNode } from '@/types/models'
import { useOrgFilter } from '@/hooks/useOrgFilter'

export default function ImageLivePage() {
  const [devices, setDevices] = useState<DeviceItem[]>([])
  const [rawOrgTree, setRawOrgTree] = useState<OrgTreeNode[]>([])
  const { orgOptions, filteredTree } = useOrgFilter(rawOrgTree)
  const [orgId, setOrgId] = useState<string | undefined>(undefined)
  const [keyword, setKeyword] = useState('')

  useEffect(() => {
    async function load() {
      const [list, orgs] = await Promise.all([imageApi.liveChannels(), orgApi.tree()])
      setDevices(list)
      setRawOrgTree(orgs)
    }

    void load()
  }, [])

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
    let list = devices
    if (orgId) {
      const allowed = new Set(orgDescendants.get(orgId) ?? [orgId])
      list = list.filter((item) => (item.orgId ? allowed.has(item.orgId) : false))
    }
    if (keyword.trim()) {
      const kw = keyword.trim().toLowerCase()
      list = list.filter(
        (item) => item.name.toLowerCase().includes(kw) || item.imei.toLowerCase().includes(kw),
      )
    }
    return list
  }, [devices, orgDescendants, orgId, keyword])

  return (
    <Row gutter={[16, 16]}>
        <Col xs={24} xl={7}>
          <Card className="rounded-2xl border-white/10">
            <Select
              value={orgId ?? ''}
              onChange={(value) => setOrgId(value === '' ? undefined : value)}
              options={orgOptions}
              showSearch
              optionFilterProp="label"
              className="mb-4 w-full"
            />
            <Input
              placeholder="搜索设备名称或 IMEI"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="mb-4"
            />
            <div className="space-y-3">
              {filteredDevices.map((device) => (
                <div key={device.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-slate-100">{device.name}</div>
                    <Tag color={device.status === '在线' ? 'green' : device.status === '告警' ? 'red' : 'default'}>
                      {device.status}
                    </Tag>
                  </div>
                  <div className="mt-2 text-xs text-slate-400">{device.imei}</div>
                  <div className="mt-1 text-xs text-slate-500">{device.orgName}</div>
                </div>
              ))}
            </div>
          </Card>
        </Col>
        <Col xs={24} xl={17}>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {filteredDevices.slice(0, 4).map((device) => (
              <div
                key={device.id}
                className="flex aspect-video flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-[0_12px_40px_rgba(0,0,0,0.24)] backdrop-blur-[10px]"
              >
                <div>
                  <div className="text-sm font-medium text-slate-100">{device.name}</div>
                  <div className="mt-1 text-xs text-slate-500">2024-01-15 09:00:00</div>
                </div>
                <div className="text-center text-sm text-slate-500">
                  {device.status === '在线' ? '实时视频流接入区' : '设备离线，暂无实时流'}
                </div>
                <div className="flex justify-center gap-3">
                  <Button size="small">截图</Button>
                  <Button size="small">录制</Button>
                  <Button size="small">全屏</Button>
                  <Button size="small" type="primary">
                    远程抓拍
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Col>
      </Row>
  )
}