/**
 * Mock 版本的 API 层：所有接口直接操作内存数据，支持增删改查交互。
 * 刷新页面后数据会重置为初始 mock 数据。
 */
import {
  agentDataSources as mockAgentDataSources,
  agentQuickQuestions as mockAgentQuickQuestions,
  agentSessions as mockAgentSessions,
  alerts as mockAlerts,
  dailySummary as mockDailySummary,
  dataCharts as mockDataCharts,
  dataOverview as mockDataOverview,
  deviceConfigs as mockDeviceConfigs,
  devices as mockDevices,
  imageRecords as mockImageRecords,
  orgDetails as mockOrgDetails,
  orgMembers as mockOrgMembers,
  orgTree as mockOrgTree,
  overviewCards as mockOverviewCards,
  permissionTree as mockPermissionTree,
  recentAlerts as mockRecentAlerts,
  roles as mockRoles,
  speciesCatalog as mockSpeciesCatalog,
  speciesImages as mockSpeciesImages,
  speciesStats as mockSpeciesStats,
  tenants as mockTenants,
  userPasswords as mockUserPasswords,
  users as mockUsers,
} from '@/data/mock'
import type {
  AuthUser,
  DeviceConfig,
  DeviceItem,
  ImageRecord,
  OrgDetail,
  OrgMember,
  OrgTreeNode,
  PermissionNode,
  RoleItem,
  UserItem,
  UserOption,
} from '@/types/models'

// ─── 公共类型 ──────────────────────────────────────────────────────────────

export type ApiResponse<T> = {
  code: number
  message: string
  data: T
}

export type PageResponse<T> = {
  list: T[]
  total: number
  page: number
  pageSize: number
}

export type DeviceQueryPayload = {
  page?: number
  pageSize?: number
  keyword?: string
  status?: string
  type?: string
  orgId?: string | number
  orgName?: string
}

export type DeviceUpsertPayload = {
  imei: string
  serialNumber?: string
  name: string
  type?: string
  orgId?: string | number | null
  longitude?: number
  latitude?: number
}

export type UserQueryPayload = {
  page?: number
  pageSize?: number
  keyword?: string
  status?: string
}

export type UserUpsertPayload = {
  username: string
  password?: string
  displayName: string
  roleId: string | number
  orgId?: string | number | null
  status: number
}

export type RoleUpsertPayload = {
  name: string
  roleCode?: string
  description: string
  permissions: string[]
}

export type OrgUpsertPayload = {
  name: string
  parentId?: string | number | null
  orgCode: string
  description: string
}

export type BatteryStats = {
  lowBattery: number
  offline: number
  online: number
}

export type SpeciesStatItem = {
  title: string
  value: number
  confidence: number
}

export type SpeciesHeatmapResponse = {
  species: string[]
  areas?: string[]
  data: [number, number, number][]
}

export type SpeciesImageItem = {
  id: string
  species: string
  confidence: number
  location: string
  time: string
  category: string
  imageUrl?: string
  fileName?: string
}

export type DataOverviewItem = {
  title: string
  value: number
  trend: string
  trendDir: string
}

export type DataChartResponse = {
  captures: { date: string; value: number }[]
  trends: { name: string; data: { date: string; value: number }[] }[]
}

export type DailySummaryItem = {
  date: string
  totalCaptures: number
  wildlife: number
  emptyCaptures: number
  humanTriggers: number
  alertEvents: number
  deviceOffline: number
}

export type AlertItem = {
  id: string
  type: string
  level: string
  title: string
  message: string
  isRead: boolean
  time: string
}

export type SpeciesCatalogItem = {
  id: string
  code: string
  name: string
  category: string
  protectionLevel: string
  location: string
  isCore: boolean
  phylum: string
  className: string
  speciesOrder: string
  family: string
  description: string
  orgId?: number | null
  createdAt: string
}

// ─── AI Agent 类型 ──────────────────────────────────────────────────────────

export type AgentReplyBlock =
  | { type: 'text'; content: string }
  | { type: 'stats'; items: { label: string; value: string | number; trend?: string; trendDir?: 'up' | 'down' }[] }
  | { type: 'table'; title?: string; columns: { title: string; dataIndex: string }[]; rows: Record<string, string | number>[] }
  | { type: 'chart'; chartType: 'line' | 'bar' | 'pie'; title: string; option: Record<string, unknown> }
  | { type: 'report'; title: string; period: string; sections: { heading: string; content: string }[] }

export type AgentReply = {
  blocks: AgentReplyBlock[]
  references?: { source: string; snippet: string }[]
  duration?: number
}

export type AgentDataSource = {
  name: string
  status: 'ready' | 'indexing' | 'error'
  count: number
  updatedAt: string
  desc: string
}

export type AgentSession = {
  id: string
  title: string
  time: string
  messageCount: number
  preview: string
}

// ─── 工具函数 ──────────────────────────────────────────────────────────────

function delay<T>(value: T, ms = 200): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms))
}

function delayReject(message: string, ms = 200): Promise<never> {
  return new Promise((_, reject) => setTimeout(() => reject(new Error(message)), ms))
}

function paginate<T>(list: T[], page = 1, pageSize = 10): PageResponse<T> {
  const p = Math.max(1, page)
  const ps = Math.max(1, pageSize)
  const start = (p - 1) * ps
  return {
    list: list.slice(start, start + ps),
    total: list.length,
    page: p,
    pageSize: ps,
  }
}

let idCounter = 1000
function nextId(): string {
  return String(++idCounter)
}

function findOrgName(nodes: OrgTreeNode[], id: string): string {
  for (const n of nodes) {
    if (n.key === id) return n.title
    if (n.children) {
      const found = findOrgName(n.children, id)
      if (found) return found
    }
  }
  return ''
}

function findRoleName(id: string | number): string {
  const role = db.roles.find((r) => String(r.id) === String(id))
  return role?.name ?? ''
}

function nowStr(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function todayStr(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// ─── 内存数据库（直接操作 mock 模块导出的数组/对象） ─────────────────────────

const db = {
  devices: mockDevices,
  imageRecords: mockImageRecords,
  users: mockUsers,
  roles: mockRoles,
  orgTree: mockOrgTree,
  orgDetails: mockOrgDetails,
  orgMembers: mockOrgMembers,
  alerts: mockAlerts,
  speciesCatalog: mockSpeciesCatalog,
  speciesImages: mockSpeciesImages,
  deviceConfigs: mockDeviceConfigs,
}

// ─── Version API ────────────────────────────────────────────────────────────

export const versionApi = {
  getVersion() {
    return delay({ version: '2.0.0-mock', buildTime: '2026-08-04' })
  },
}

// ─── Auth API ───────────────────────────────────────────────────────────────

export const authApi = {
  async login(payload: { username: string; password: string; tenantCode?: string }) {
    const expected = mockUserPasswords[payload.username]
    if (!expected || expected !== payload.password) {
      return delayReject('用户名或密码错误')
    }
    const userRecord = db.users.find((u) => u.username === payload.username)
    const user: AuthUser = {
      id: userRecord?.id ?? '1',
      username: payload.username,
      displayName: userRecord?.displayName ?? payload.username,
      roleId: userRecord?.roleId ?? '1',
      roleName: userRecord?.roleName ?? '超级管理员',
      orgId: userRecord?.orgId ?? '1',
      orgName: userRecord?.orgName ?? '全部',
      permissions: db.roles.find((r) => r.id === (userRecord?.roleId ?? '1'))?.permissions ?? ['all'],
      mustChangePassword: false,
      tenantCode: payload.tenantCode,
    }
    return delay({
      token: `mock-token-${payload.username}-${Date.now()}`,
      user,
      mustChangePassword: false,
    })
  },

  async resolveTenant(tenantCode: string) {
    const tenant = mockTenants[tenantCode] ?? mockTenants.default
    return delay({ name: tenant.name, code: tenant.code })
  },

  async changePassword(payload: { oldPassword: string; newPassword: string }) {
    if (!payload.newPassword || payload.newPassword.length < 6) {
      return delayReject('新密码长度不能少于6位')
    }
    return delay({ message: '密码修改成功' })
  },
}

// ─── Home API ───────────────────────────────────────────────────────────────

export const homeApi = {
  getOverview() {
    return delay(mockOverviewCards)
  },
  getAlerts() {
    return delay(mockRecentAlerts)
  },
}

// ─── Device API ─────────────────────────────────────────────────────────────

export const deviceApi = {
  async query(payload?: DeviceQueryPayload) {
    let list = [...db.devices]
    const keyword = payload?.keyword?.trim()
    if (keyword) {
      list = list.filter(
        (d) =>
          d.name.includes(keyword) ||
          d.imei.includes(keyword) ||
          d.serialNumber.includes(keyword),
      )
    }
    if (payload?.status && payload.status !== '全部') {
      list = list.filter((d) => d.status === payload.status)
    }
    if (payload?.type) {
      list = list.filter((d) => d.type === payload.type)
    }
    if (payload?.orgId) {
      list = list.filter((d) => String(d.orgId) === String(payload.orgId))
    }
    if (payload?.orgName) {
      list = list.filter((d) => d.orgName.includes(payload.orgName!))
    }
    return delay(paginate(list, payload?.page, payload?.pageSize))
  },

  async batteryStats() {
    const stats: BatteryStats = {
      lowBattery: db.devices.filter((d) => d.battery < 20).length,
      offline: db.devices.filter((d) => d.status === '离线').length,
      online: db.devices.filter((d) => d.status === '在线').length,
    }
    return delay(stats)
  },

  async detail(id: string | number) {
    const device = db.devices.find((d) => String(d.id) === String(id))
    if (!device) return delayReject('设备不存在')
    return delay(device)
  },

  async create(payload: DeviceUpsertPayload) {
    const orgId = payload.orgId ? String(payload.orgId) : ''
    const device: DeviceItem = {
      id: nextId(),
      imei: payload.imei,
      serialNumber: payload.serialNumber ?? '',
      name: payload.name,
      type: payload.type ?? '500W',
      orgId,
      orgName: orgId ? findOrgName(db.orgTree, orgId) : '',
      status: '在线',
      battery: 100,
      firmwareVersion: 'V2.1.3',
      longitude: String(payload.longitude ?? ''),
      latitude: String(payload.latitude ?? ''),
      installedAt: todayStr(),
      lastHeartbeatAt: nowStr(),
    }
    db.devices.push(device)
    return delay({ message: '创建成功', id: device.id })
  },

  async update(id: string | number, payload: DeviceUpsertPayload) {
    const idx = db.devices.findIndex((d) => String(d.id) === String(id))
    if (idx < 0) return delayReject('设备不存在')
    const orgId = payload.orgId ? String(payload.orgId) : ''
    db.devices[idx] = {
      ...db.devices[idx],
      imei: payload.imei,
      serialNumber: payload.serialNumber ?? db.devices[idx].serialNumber,
      name: payload.name,
      type: payload.type ?? db.devices[idx].type,
      orgId,
      orgName: orgId ? findOrgName(db.orgTree, orgId) : db.devices[idx].orgName,
      longitude: String(payload.longitude ?? db.devices[idx].longitude),
      latitude: String(payload.latitude ?? db.devices[idx].latitude),
    }
    return delay({ message: '更新成功' })
  },

  async remove(id: string | number) {
    const idx = db.devices.findIndex((d) => String(d.id) === String(id))
    if (idx < 0) return delayReject('设备不存在')
    db.devices.splice(idx, 1)
    return delay({ message: '删除成功' })
  },

  async getConfig(id: string | number) {
    const config = db.deviceConfigs[String(id)] ?? {
      workMode: 'all',
      captureInterval: 30,
      sensitivity: 'medium',
      resolution: '1080P',
      nightVision: true,
      uploadMode: 'realtime',
      heartbeatInterval: 60,
    }
    return delay(config)
  },

  async updateConfig(id: string | number, payload: DeviceConfig) {
    db.deviceConfigs[String(id)] = payload
    return delay({ message: '配置已保存' })
  },

  async importSerialNumbers(serialNumbers: string[]) {
    let created = 0
    let skipped = 0
    serialNumbers.forEach((sn, i) => {
      if (db.devices.some((d) => d.serialNumber === sn)) {
        skipped++
      } else {
        db.devices.push({
          id: nextId(),
          imei: `86${Date.now()}${i}`,
          serialNumber: sn,
          name: `相机-${sn}`,
          type: '500W',
          orgId: '',
          orgName: '',
          status: '在线',
          battery: 100,
          firmwareVersion: 'V2.1.3',
          longitude: '',
          latitude: '',
          installedAt: todayStr(),
          lastHeartbeatAt: nowStr(),
        })
        created++
      }
    })
    return delay({ created, skipped, message: `导入完成，新增 ${created} 台，跳过 ${skipped} 台` })
  },

  async importDevices(items: { serialNumber: string; name: string; type: string; orgId?: string | number; longitude?: number; latitude?: number }[]) {
    let created = 0
    let skipped = 0
    items.forEach((item) => {
      if (db.devices.some((d) => d.serialNumber === item.serialNumber)) {
        skipped++
      } else {
        const orgId = item.orgId ? String(item.orgId) : ''
        db.devices.push({
          id: nextId(),
          imei: `86${Date.now()}${created}`,
          serialNumber: item.serialNumber,
          name: item.name,
          type: item.type,
          orgId,
          orgName: orgId ? findOrgName(db.orgTree, orgId) : '',
          status: '在线',
          battery: 100,
          firmwareVersion: 'V2.1.3',
          longitude: String(item.longitude ?? ''),
          latitude: String(item.latitude ?? ''),
          installedAt: todayStr(),
          lastHeartbeatAt: nowStr(),
        })
        created++
      }
    })
    return delay({ created, skipped, message: `导入完成，新增 ${created} 台，跳过 ${skipped} 台` })
  },
}

// ─── Image API ──────────────────────────────────────────────────────────────

export const imageApi = {
  async query(payload?: { page?: number; pageSize?: number; orgId?: string | number; deviceId?: string | number; keyword?: string; fileType?: string; eventType?: string; smartCategory?: string; date?: string }) {
    let list = [...db.imageRecords]
    if (payload?.orgId) {
      const orgDevices = db.devices.filter((d) => String(d.orgId) === String(payload.orgId)).map((d) => d.id)
      list = list.filter((r) => orgDevices.includes(r.deviceId))
    }
    if (payload?.deviceId) {
      list = list.filter((r) => String(r.deviceId) === String(payload.deviceId))
    }
    if (payload?.keyword) {
      const kw = payload.keyword
      list = list.filter((r) => r.fileName.includes(kw) || r.deviceName.includes(kw) || (r.speciesTag ?? '').includes(kw))
    }
    if (payload?.fileType) {
      list = list.filter((r) => r.fileType === payload.fileType)
    }
    if (payload?.eventType) {
      list = list.filter((r) => r.eventType === payload.eventType)
    }
    if (payload?.smartCategory) {
      list = list.filter((r) => r.smartCategory === payload.smartCategory)
    }
    if (payload?.date) {
      list = list.filter((r) => r.capturedAt.startsWith(payload.date!))
    }
    return delay(paginate(list, payload?.page, payload?.pageSize))
  },

  async orgTree() {
    return delay(db.orgTree)
  },

  async detail(id: string | number) {
    const record = db.imageRecords.find((r) => String(r.id) === String(id))
    if (!record) return delayReject('影像不存在')
    return delay(record)
  },

  async download(id: string | number) {
    const record = db.imageRecords.find((r) => String(r.id) === String(id))
    if (!record) return delayReject('影像不存在')
    return delay({ url: record.filePath, fileName: record.fileName })
  },

  async tag(id: string | number, payload: { species: string; confidence: number; remark?: string }) {
    const record = db.imageRecords.find((r) => String(r.id) === String(id))
    if (!record) return delayReject('影像不存在')
    record.speciesTag = `${payload.species} ${payload.confidence}%`
    return delay({ message: '标注成功' })
  },

  async upload(file: File, deviceId: string | number, options?: { eventType?: string; capturedAt?: string }) {
    const device = db.devices.find((d) => String(d.id) === String(deviceId))
    const record: ImageRecord & { url: string } = {
      id: nextId(),
      deviceId: String(deviceId),
      deviceName: device?.name ?? '',
      deviceSerialNumber: device?.serialNumber ?? '',
      capturedAt: options?.capturedAt ?? nowStr(),
      fileType: file.type.startsWith('video') ? '视频' : '图片',
      fileName: file.name,
      filePath: `/uploads/${file.name}`,
      size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
      eventType: options?.eventType ?? '手动上传',
      speciesTag: '',
      smartCategory: '',
      url: `/uploads/${file.name}`,
    }
    db.imageRecords.push(record)
    return delay(record)
  },

  async liveChannels() {
    return delay(db.devices.filter((d) => d.status === '在线'))
  },
}

// ─── User API ───────────────────────────────────────────────────────────────

export const userApi = {
  async query(payload?: UserQueryPayload) {
    let list = [...db.users]
    const keyword = payload?.keyword?.trim()
    if (keyword) {
      list = list.filter((u) => u.username.includes(keyword) || u.displayName.includes(keyword))
    }
    if (payload?.status && payload.status !== '全部') {
      list = list.filter((u) => u.status === payload.status)
    }
    return delay(paginate(list, payload?.page, payload?.pageSize))
  },

  async create(payload: UserUpsertPayload) {
    if (db.users.some((u) => u.username === payload.username)) {
      return delayReject('用户名已存在')
    }
    const user: UserItem = {
      id: nextId(),
      username: payload.username,
      displayName: payload.displayName,
      roleId: String(payload.roleId),
      roleName: findRoleName(payload.roleId),
      orgId: payload.orgId ? String(payload.orgId) : '',
      orgName: payload.orgId ? findOrgName(db.orgTree, String(payload.orgId)) : '全部',
      status: payload.status === 1 ? '启用' : '禁用',
      createdAt: todayStr(),
    }
    db.users.push(user)
    mockUserPasswords[payload.username] = payload.password || '123456'
    return delay({ message: '创建成功' })
  },

  async update(id: string | number, payload: UserUpsertPayload) {
    const idx = db.users.findIndex((u) => String(u.id) === String(id))
    if (idx < 0) return delayReject('用户不存在')
    db.users[idx] = {
      ...db.users[idx],
      username: payload.username,
      displayName: payload.displayName,
      roleId: String(payload.roleId),
      roleName: findRoleName(payload.roleId),
      orgId: payload.orgId ? String(payload.orgId) : '',
      orgName: payload.orgId ? findOrgName(db.orgTree, String(payload.orgId)) : '全部',
      status: payload.status === 1 ? '启用' : '禁用',
    }
    if (payload.password) {
      mockUserPasswords[payload.username] = payload.password
    }
    return delay({ message: '更新成功' })
  },

  async resetPassword(id: string | number, password: string) {
    const user = db.users.find((u) => String(u.id) === String(id))
    if (!user) return delayReject('用户不存在')
    mockUserPasswords[user.username] = password
    return delay({ message: '密码重置成功' })
  },

  async updateStatus(id: string | number, enabled: boolean) {
    const user = db.users.find((u) => String(u.id) === String(id))
    if (!user) return delayReject('用户不存在')
    user.status = enabled ? '启用' : '禁用'
    return delay({ message: '状态更新成功' })
  },

  async remove(id: string | number) {
    const idx = db.users.findIndex((u) => String(u.id) === String(id))
    if (idx < 0) return delayReject('用户不存在')
    db.users.splice(idx, 1)
    return delay({ message: '删除成功' })
  },
}

// ─── Role API ───────────────────────────────────────────────────────────────

export const roleApi = {
  async query() {
    return delay({ list: db.roles, permissions: mockPermissionTree })
  },

  async create(payload: RoleUpsertPayload) {
    const role: RoleItem = {
      id: nextId(),
      name: payload.name,
      roleCode: payload.roleCode ?? payload.name.toUpperCase(),
      description: payload.description,
      userCount: 0,
      createdAt: todayStr(),
      isSystem: false,
      permissions: payload.permissions,
    }
    db.roles.push(role)
    return delay({ message: '创建成功' })
  },

  async update(id: string | number, payload: RoleUpsertPayload) {
    const idx = db.roles.findIndex((r) => String(r.id) === String(id))
    if (idx < 0) return delayReject('角色不存在')
    if (db.roles[idx].isSystem) return delayReject('系统角色不可编辑')
    db.roles[idx] = {
      ...db.roles[idx],
      name: payload.name,
      roleCode: payload.roleCode ?? db.roles[idx].roleCode,
      description: payload.description,
      permissions: payload.permissions,
    }
    return delay({ message: '更新成功' })
  },

  async remove(id: string | number) {
    const idx = db.roles.findIndex((r) => String(r.id) === String(id))
    if (idx < 0) return delayReject('角色不存在')
    if (db.roles[idx].isSystem) return delayReject('系统角色不可删除')
    db.roles.splice(idx, 1)
    return delay({ message: '删除成功' })
  },
}

// ─── Org API ────────────────────────────────────────────────────────────────

function removeFromOrgTree(nodes: OrgTreeNode[], id: string): OrgTreeNode[] {
  return nodes
    .filter((n) => n.key !== id)
    .map((n) => ({
      ...n,
      children: n.children ? removeFromOrgTree(n.children, id) : undefined,
    }))
}

function addToOrgTree(nodes: OrgTreeNode[], parentId: string | null, newNode: OrgTreeNode): OrgTreeNode[] {
  if (parentId === null || parentId === '') {
    return [...nodes, newNode]
  }
  return nodes.map((n) => {
    if (n.key === parentId) {
      return { ...n, children: [...(n.children ?? []), newNode] }
    }
    if (n.children) {
      return { ...n, children: addToOrgTree(n.children, parentId, newNode) }
    }
    return n
  })
}

function updateOrgTreeNode(nodes: OrgTreeNode[], id: string, title: string, orgCode?: string): OrgTreeNode[] {
  return nodes.map((n) => {
    if (n.key === id) {
      return { ...n, title, orgCode: orgCode ?? n.orgCode }
    }
    if (n.children) {
      return { ...n, children: updateOrgTreeNode(n.children, id, title, orgCode) }
    }
    return n
  })
}

function countOrgDevices(orgId: string): number {
  // 包含子组织的设备
  const childIds = collectChildOrgIds(db.orgTree, orgId)
  return db.devices.filter((d) => childIds.includes(String(d.orgId))).length
}

function collectChildOrgIds(nodes: OrgTreeNode[], id: string): string[] {
  const result: string[] = [id]
  for (const n of nodes) {
    if (n.key === id && n.children) {
      n.children.forEach((c) => result.push(...collectChildOrgIds([c], c.key)))
    } else if (n.children) {
      const found = collectChildOrgIds(n.children, id)
      if (found.length > 1 || found[0] === id) {
        result.push(...found)
      }
    }
  }
  return [...new Set(result)]
}

export const orgApi = {
  async tree() {
    return delay(db.orgTree)
  },

  async detail(id: string | number) {
    const detail = db.orgDetails[String(id)]
    if (!detail) return delayReject('组织不存在')
    const childCount = db.orgTree
      .flatMap((n) => n.children ?? [])
      .filter((c) => c.key === String(id))
      .flatMap((c) => c.children ?? []).length
    const result: OrgDetail = {
      id: String(id),
      name: findOrgName(db.orgTree, String(id)),
      parentId: detail.parentId,
      parentName: detail.parentName,
      orgCode: detail.orgCode,
      description: detail.description,
      createdAt: detail.createdAt,
      deviceCount: countOrgDevices(String(id)),
      memberCount: db.orgMembers.filter((m) => m.userId === String(id)).length,
      childCount,
    }
    return delay(result)
  },

  async members(id: string | number) {
    // 简化：返回所有成员（实际可按组织过滤）
    const members: OrgMember[] = db.orgMembers.map((m) => ({
      id: m.id,
      userId: m.userId,
      roleId: m.roleId,
      user: m.user,
      displayName: m.displayName,
      role: m.role,
      joinedAt: m.joinedAt,
    }))
    return delay(members)
  },

  async devices(id: string | number, payload?: { page?: number; pageSize?: number }) {
    const childIds = collectChildOrgIds(db.orgTree, String(id))
    const list = db.devices.filter((d) => childIds.includes(String(d.orgId)))
    return delay(paginate(list, payload?.page, payload?.pageSize))
  },

  async create(payload: OrgUpsertPayload) {
    const newId = nextId()
    const newNode: OrgTreeNode = {
      key: newId,
      title: payload.name,
      orgCode: payload.orgCode,
    }
    db.orgTree = addToOrgTree(db.orgTree, payload.parentId ? String(payload.parentId) : null, newNode)
    db.orgDetails[newId] = {
      parentId: payload.parentId ? String(payload.parentId) : null,
      parentName: payload.parentId ? findOrgName(db.orgTree, String(payload.parentId)) : '-',
      orgCode: payload.orgCode,
      description: payload.description,
      createdAt: todayStr(),
    }
    return delay({ message: '创建成功' })
  },

  async update(id: string | number, payload: OrgUpsertPayload) {
    db.orgTree = updateOrgTreeNode(db.orgTree, String(id), payload.name, payload.orgCode)
    const detail = db.orgDetails[String(id)]
    if (detail) {
      db.orgDetails[String(id)] = {
        ...detail,
        orgCode: payload.orgCode,
        description: payload.description,
      }
    }
    return delay({ message: '更新成功' })
  },

  async remove(id: string | number) {
    db.orgTree = removeFromOrgTree(db.orgTree, String(id))
    delete db.orgDetails[String(id)]
    return delay({ message: '删除成功' })
  },

  async moveDevices(deviceIds: (string | number)[], targetOrgId: string | number) {
    const orgName = findOrgName(db.orgTree, String(targetOrgId))
    db.devices.forEach((d) => {
      if (deviceIds.some((id) => String(id) === String(d.id))) {
        d.orgId = String(targetOrgId)
        d.orgName = orgName
      }
    })
    return delay({ message: '设备移动成功' })
  },

  async addMember(orgId: string | number, payload: { userId: string | number; roleId: string | number }) {
    const user = db.users.find((u) => String(u.id) === String(payload.userId))
    if (!user) return delayReject('用户不存在')
    db.orgMembers.push({
      id: nextId(),
      userId: String(payload.userId),
      roleId: String(payload.roleId),
      user: user.username,
      displayName: user.displayName,
      role: findRoleName(payload.roleId),
      joinedAt: todayStr(),
    })
    return delay({ message: '成员添加成功' })
  },

  async updateMember(orgId: string | number, memberId: string | number, payload: { roleId: string | number }) {
    const member = db.orgMembers.find((m) => String(m.id) === String(memberId))
    if (!member) return delayReject('成员不存在')
    member.roleId = String(payload.roleId)
    member.role = findRoleName(payload.roleId)
    return delay({ message: '成员更新成功' })
  },

  async removeMember(orgId: string | number, memberId: string | number) {
    const idx = db.orgMembers.findIndex((m) => String(m.id) === String(memberId))
    if (idx < 0) return delayReject('成员不存在')
    db.orgMembers.splice(idx, 1)
    return delay({ message: '成员移除成功' })
  },

  async userOptions() {
    const options: UserOption[] = db.users.map((u) => ({
      id: u.id,
      username: u.username,
      displayName: u.displayName,
    }))
    return delay(options)
  },
}

// ─── Species API ────────────────────────────────────────────────────────────

export const speciesApi = {
  async stats(category: string, _orgId?: string) {
    const list = mockSpeciesStats[category] ?? mockSpeciesStats.animal ?? []
    return delay(list)
  },

  async heatmap(category: string, _orgId?: string) {
    const stats = mockSpeciesStats[category] ?? mockSpeciesStats.animal ?? []
    const species = stats.map((s) => s.title)
    const areas = ['监测站A', '监测站B', '监测站C', '监测站D']
    const data: [number, number, number][] = []
    species.forEach((_, sIdx) => {
      areas.forEach((_, aIdx) => {
        data.push([aIdx, sIdx, Math.floor(Math.random() * 100)])
      })
    })
    return delay({ species, areas, data })
  },

  async images(params: { category: string; species?: string; orgId?: string; page?: number; pageSize?: number }) {
    let list = [...db.speciesImages]
    if (params.species && params.species !== '全部') {
      list = list.filter((img) => img.species === params.species)
    }
    if (params.category && params.category !== '全部') {
      list = list.filter((img) => img.category === params.category)
    }
    return delay(paginate(list, params.page, params.pageSize))
  },
}

// ─── Alert API ──────────────────────────────────────────────────────────────

export const alertApi = {
  async list(params?: { type?: string; resolved?: string; page?: number; pageSize?: number }) {
    let list = [...db.alerts]
    if (params?.type && params.type !== '全部') {
      list = list.filter((a) => a.type === params.type)
    }
    if (params?.resolved === '未读') {
      list = list.filter((a) => !a.isRead)
    } else if (params?.resolved === '已读') {
      list = list.filter((a) => a.isRead)
    }
    return delay(paginate(list, params?.page, params?.pageSize))
  },

  async markRead(id: string) {
    const alert = db.alerts.find((a) => a.id === id)
    if (alert) alert.isRead = true
    return delay({ message: '已标记为已读' })
  },

  async markAllRead() {
    db.alerts.forEach((a) => (a.isRead = true))
    return delay({ message: '已全部标记为已读' })
  },
}

// ─── Species Catalog API ────────────────────────────────────────────────────

export const speciesCatalogApi = {
  async query(params?: { keyword?: string; category?: string; protectionLevel?: string; orgId?: string | number; page?: number; pageSize?: number }) {
    let list = [...db.speciesCatalog]
    const keyword = params?.keyword?.trim()
    if (keyword) {
      list = list.filter((s) => s.name.includes(keyword) || s.code.includes(keyword))
    }
    if (params?.category && params.category !== '全部') {
      list = list.filter((s) => s.category === params.category)
    }
    if (params?.protectionLevel && params.protectionLevel !== '全部') {
      list = list.filter((s) => s.protectionLevel === params.protectionLevel)
    }
    if (params?.orgId) {
      list = list.filter((s) => String(s.orgId) === String(params.orgId))
    }
    return delay(paginate(list, params?.page, params?.pageSize))
  },

  async create(payload: { code: string; name: string; category: string; protectionLevel?: string; location?: string; isCore?: boolean; phylum?: string; className?: string; speciesOrder?: string; family?: string; description?: string; orgId?: string | number }) {
    const item: SpeciesCatalogItem = {
      id: nextId(),
      code: payload.code,
      name: payload.name,
      category: payload.category,
      protectionLevel: payload.protectionLevel ?? '非保护',
      location: payload.location ?? '',
      isCore: payload.isCore ?? false,
      phylum: payload.phylum ?? '',
      className: payload.className ?? '',
      speciesOrder: payload.speciesOrder ?? '',
      family: payload.family ?? '',
      description: payload.description ?? '',
      orgId: payload.orgId ? Number(payload.orgId) : null,
      createdAt: todayStr(),
    }
    db.speciesCatalog.push(item)
    return delay({ message: '创建成功' })
  },

  async update(id: string | number, payload: { code?: string; name?: string; category?: string; protectionLevel?: string; location?: string; isCore?: boolean; phylum?: string; className?: string; speciesOrder?: string; family?: string; description?: string; orgId?: string | number }) {
    const idx = db.speciesCatalog.findIndex((s) => String(s.id) === String(id))
    if (idx < 0) return delayReject('物种不存在')
    db.speciesCatalog[idx] = {
      ...db.speciesCatalog[idx],
      ...payload,
      orgId: payload.orgId != null ? Number(payload.orgId) : db.speciesCatalog[idx].orgId,
    }
    return delay({ message: '更新成功' })
  },

  async remove(id: string | number) {
    const idx = db.speciesCatalog.findIndex((s) => String(s.id) === String(id))
    if (idx < 0) return delayReject('物种不存在')
    db.speciesCatalog.splice(idx, 1)
    return delay({ message: '删除成功' })
  },
}

// ─── Data API ───────────────────────────────────────────────────────────────

export const dataApi = {
  async overview(_orgId?: string) {
    return delay(mockDataOverview)
  },

  async charts(_params?: { startDate?: string; endDate?: string; orgId?: string }) {
    return delay(mockDataCharts)
  },

  async summary(params?: { startDate?: string; endDate?: string; orgId?: string; page?: number; pageSize?: number }) {
    return delay(paginate(mockDailySummary, params?.page, params?.pageSize))
  },
}

// ─── Agent API ──────────────────────────────────────────────────────────────

function generateReply(message: string): AgentReply {
  const msg = message.toLowerCase()

  // 报告生成
  if (msg.includes('报告') || msg.includes('生成')) {
    return {
      blocks: [
        { type: 'text', content: '已基于知识库与历史监测数据，为您生成 2024年1月 生态监测报告。报告涵盖物种监测、设备运行、告警事件及环境因子分析。' },
        {
          type: 'stats',
          items: [
            { label: '总抓拍量', value: 1280, trend: '12.5%', trendDir: 'up' },
            { label: '物种种类', value: 12, trend: '2种', trendDir: 'up' },
            { label: '告警事件', value: 28, trend: '5.2%', trendDir: 'down' },
            { label: '设备在线率', value: '96%', trend: '1.1%', trendDir: 'up' },
          ],
        },
        {
          type: 'report',
          title: '2024年1月 野外守望者生态监测报告',
          period: '2024-01-01 至 2024-01-31',
          sections: [
            { heading: '一、监测概况', content: '本月共部署红外相机5台，覆盖华北、华南3个监测站，累计抓拍1280次，其中野生动物识别980次，有效率达76.6%。监测系统整体运行稳定，设备在线率96%。' },
            { heading: '二、物种监测', content: '共识别到12种野生动物，其中国家一级保护动物梅花鹿抓拍128次，国家二级保护动物赤狐45次、白鹇6次。物种多样性较上月提升2种，生态系统健康状况良好。' },
            { heading: '三、告警分析', content: '本月共触发告警事件28起，同比下降5.2%。其中入侵告警10起、电量告警8起、设备离线7起、其他3起。建议重点关注华北监测站A区域的入侵告警。' },
            { heading: '四、环境因子', content: '本月平均温度12.5°C，降水量5.2mm，风速3.2m/s。满月期间夜间抓拍量较新月增加35%，温度与抓拍量呈正相关（r=0.72）。' },
            { heading: '五、建议措施', content: '1. 及时为低电量设备（相机-002、相机-005）更换电池；\n2. 加强华北监测站A区域的巡护频次；\n3. 升级相机-003固件至V2.2.0以提升识别准确率；\n4. 在华南监测站C增设1台相机以扩大覆盖范围。' },
          ],
        },
      ],
      references: [
        { source: '历史监测数据', snippet: '2024-01 共抓拍 1280 条记录，涉及 12 个物种' },
        { source: '告警记录库', snippet: '本月告警 28 起，入侵告警占比 35.7%' },
        { source: '环境监测数据', snippet: '满月期间夜间抓拍量增加 35%' },
      ],
    }
  }

  // 趋势分析
  if (msg.includes('趋势') || msg.includes('分析')) {
    return {
      blocks: [
        { type: 'text', content: '基于近7天的监测数据，为您分析生态监测趋势。整体抓拍量呈上升趋势，野生动物活动频率增加，告警事件有所下降。' },
        {
          type: 'chart',
          chartType: 'line',
          title: '近7天抓拍量趋势',
          option: {
            tooltip: { trigger: 'axis' },
            legend: { data: ['总抓拍', '野生动物'], textStyle: { color: '#94a8b8' } },
            grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
            xAxis: { type: 'category', boundaryGap: false, data: ['1/10', '1/11', '1/12', '1/13', '1/14', '1/15', '1/16'] },
            yAxis: { type: 'value' },
            series: [
              { name: '总抓拍', type: 'line', smooth: true, data: [45, 62, 38, 75, 52, 89, 68], itemStyle: { color: '#2dd4a8' }, areaStyle: { color: 'rgba(45,212,168,0.15)' } },
              { name: '野生动物', type: 'line', smooth: true, data: [38, 52, 32, 68, 45, 78, 60], itemStyle: { color: '#4a9eff' }, areaStyle: { color: 'rgba(74,158,255,0.12)' } },
            ],
          },
        },
        {
          type: 'stats',
          items: [
            { label: '日均抓拍量', value: 61, trend: '12.5%', trendDir: 'up' },
            { label: '野生动物占比', value: '83%', trend: '3.2%', trendDir: 'up' },
            { label: '告警事件', value: 7, trend: '30%', trendDir: 'down' },
            { label: '活跃物种', value: 8, trend: '2种', trendDir: 'up' },
          ],
        },
        { type: 'text', content: '📊 趋势洞察：本周抓拍量在1月15日达到峰值（89次），与当日温度回升（15°C）相关。野生动物抓拍占比83%，较上周提升3.2个百分点，表明该区域生态活跃度持续向好。建议持续关注温度变化对动物活动的影响。' },
      ],
      references: [
        { source: '历史监测数据', snippet: '2024-01-10 至 2024-01-16 共抓拍 429 条' },
        { source: '环境监测数据', snippet: '1月15日温度 15°C，为本周最高' },
      ],
    }
  }

  // 物种分布
  if (msg.includes('物种') || msg.includes('分布') || msg.includes('鹿') || msg.includes('野猪') || msg.includes('动物')) {
    return {
      blocks: [
        { type: 'text', content: '根据历史监测数据与AI识别模型分析，近期监测到的野生动物主要包括梅花鹿、野猪、赤狐、野兔等，物种分布如下：' },
        {
          type: 'chart',
          chartType: 'pie',
          title: '物种抓拍占比',
          option: {
            tooltip: { trigger: 'item' },
            legend: { orient: 'vertical', left: 'left', textStyle: { color: '#94a8b8' } },
            series: [{
              type: 'pie',
              radius: ['40%', '70%'],
              center: ['60%', '50%'],
              data: [
                { value: 128, name: '梅花鹿', itemStyle: { color: '#2dd4a8' } },
                { value: 96, name: '野猪', itemStyle: { color: '#f0b429' } },
                { value: 72, name: '野兔', itemStyle: { color: '#4a9eff' } },
                { value: 45, name: '赤狐', itemStyle: { color: '#e5484d' } },
                { value: 23, name: '人类', itemStyle: { color: '#a78bfa' } },
              ],
              label: { color: '#e8f0f2' },
            }],
          },
        },
        {
          type: 'table',
          title: '物种分布明细',
          columns: [
            { title: '物种', dataIndex: 'species' },
            { title: '抓拍次数', dataIndex: 'count' },
            { title: '识别置信度', dataIndex: 'confidence' },
            { title: '主要分布区域', dataIndex: 'location' },
            { title: '保护级别', dataIndex: 'protection' },
          ],
          rows: [
            { species: '梅花鹿', count: 128, confidence: '98%', location: '华北监测站A', protection: '国家一级' },
            { species: '野猪', count: 96, confidence: '95%', location: '华北监测站A/B', protection: '非保护' },
            { species: '野兔', count: 72, confidence: '88%', location: '华南监测站C', protection: '非保护' },
            { species: '赤狐', count: 45, confidence: '92%', location: '华南监测站C', protection: '国家二级' },
            { species: '白鹇', count: 6, confidence: '94%', location: '华南监测站C', protection: '国家二级' },
          ],
        },
        { type: 'text', content: '🦌 生态洞察：梅花鹿为本区域优势物种，抓拍次数占比最高（33.7%），主要活动于华北监测站A区域，多在清晨（6:00-9:00）和傍晚（16:00-19:00）活动。野猪活动范围较广，在A、B两个监测站均有分布。建议在华南监测站C增加红外相机，以更全面覆盖赤狐和白鹇的活动区域。' },
      ],
      references: [
        { source: '物种知识库 v3.2', snippet: '梅花鹿（Cervus nippon），国家一级保护动物，晨昏活动' },
        { source: '历史监测数据', snippet: '梅花鹿抓拍 128 次，占比 33.7%' },
        { source: 'AI识别模型', snippet: '平均识别置信度 93.4%' },
      ],
    }
  }

  // 告警分析
  if (msg.includes('告警') || msg.includes('预警') || msg.includes('入侵')) {
    return {
      blocks: [
        { type: 'text', content: '本周共触发告警事件7起，较上周下降30%。告警类型以入侵告警为主，集中在华北监测站A区域。' },
        {
          type: 'stats',
          items: [
            { label: '本周告警', value: 7, trend: '30%', trendDir: 'down' },
            { label: '入侵告警', value: 3, trend: '2起', trendDir: 'down' },
            { label: '电量告警', value: 2, trend: '1起', trendDir: 'down' },
            { label: '高危告警', value: 1, trend: '持平', trendDir: 'down' },
          ],
        },
        {
          type: 'chart',
          chartType: 'bar',
          title: '告警类型分布',
          option: {
            tooltip: { trigger: 'axis' },
            grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
            xAxis: { type: 'category', data: ['入侵告警', '电量告警', '设备离线', '存储不足', '其他'], axisLabel: { color: '#94a8b8' } },
            yAxis: { type: 'value', axisLabel: { color: '#94a8b8' } },
            series: [{ type: 'bar', data: [3, 2, 1, 1, 0], itemStyle: { color: '#e5484d', borderRadius: [4, 4, 0, 0] } }],
          },
        },
        {
          type: 'table',
          title: '近期告警列表',
          columns: [
            { title: '时间', dataIndex: 'time' },
            { title: '类型', dataIndex: 'type' },
            { title: '级别', dataIndex: 'level' },
            { title: '标题', dataIndex: 'title' },
            { title: '区域', dataIndex: 'area' },
          ],
          rows: [
            { time: '2分钟前', type: '告警', level: '高危', title: '相机-003 产生入侵报警', area: '华北A' },
            { time: '5分钟前', type: '警告', level: '中', title: '相机-002 电量低于15%', area: '总部B' },
            { time: '1小时前', type: '告警', level: '高危', title: '监测到疑似人类活动', area: 'D1区域' },
            { time: '6小时前', type: '告警', level: '高危', title: '相机-006 检测到盗猎行为', area: '华北A' },
          ],
        },
        { type: 'text', content: '⚠️ 风险提示：华北监测站A区域本周发生3起入侵告警，占比43%，建议加强该区域巡护频次，并检查相机-003的网络连接状态。相机-002电量仅剩15%，需尽快更换电池。' },
      ],
      references: [
        { source: '告警记录库', snippet: '本周告警 7 起，入侵告警 3 起' },
        { source: '设备运行数据', snippet: '相机-002 电量 15%，相机-003 离线' },
      ],
    }
  }

  // 设备状态
  if (msg.includes('设备') || msg.includes('电量') || msg.includes('在线') || msg.includes('状态')) {
    return {
      blocks: [
        { type: 'text', content: '当前共部署5台红外相机，其中在线3台、告警1台、离线1台、低电量1台。设备整体在线率60%，需关注低电量和离线设备。' },
        {
          type: 'stats',
          items: [
            { label: '在线设备', value: 3, trend: '持平', trendDir: 'up' },
            { label: '离线设备', value: 1, trend: '1台', trendDir: 'down' },
            { label: '低电量', value: 2, trend: '1台', trendDir: 'down' },
            { label: '在线率', value: '60%', trend: '8%', trendDir: 'down' },
          ],
        },
        {
          type: 'table',
          title: '设备运行状态',
          columns: [
            { title: '设备名称', dataIndex: 'name' },
            { title: '状态', dataIndex: 'status' },
            { title: '电量', dataIndex: 'battery' },
            { title: '固件版本', dataIndex: 'firmware' },
            { title: '所属组织', dataIndex: 'org' },
          ],
          rows: [
            { name: '相机-001', status: '在线', battery: '85%', firmware: 'V2.1.3', org: '总部/区域A' },
            { name: '相机-002', status: '告警', battery: '15%', firmware: 'V2.1.3', org: '总部/区域B' },
            { name: '相机-003', status: '离线', battery: '0%', firmware: 'V2.0.8', org: '华北/监测站A' },
            { name: '相机-004', status: '在线', battery: '62%', firmware: 'V2.1.3', org: '华北/监测站B' },
            { name: '相机-005', status: '低电量', battery: '12%', firmware: 'V2.1.0', org: '华南/监测站C' },
          ],
        },
        { type: 'text', content: '🔋 维护建议：\n1. 相机-002（电量15%）和相机-005（电量12%）需立即更换电池；\n2. 相机-003已离线，建议检查网络连接和供电；\n3. 相机-003固件V2.0.8版本较旧，恢复在线后建议升级至V2.2.0；\n4. 相机-005固件V2.1.0也建议升级。' },
      ],
      references: [
        { source: '设备运行数据', snippet: '5台设备，在线3台，低电量2台' },
      ],
    }
  }

  // 默认回复
  return {
    blocks: [
      { type: 'text', content: `您好！我是生态监测AI助手，已接入物种知识库、历史监测数据、环境因子等多源数据。关于"${message}"，您可以尝试以下方向提问：` },
      {
        type: 'stats',
        items: [
          { label: '已接入数据源', value: 6 },
          { label: '物种知识', value: 156 },
          { label: '监测记录', value: 1280 },
          { label: '识别模型', value: 'v3.2' },
        ],
      },
      { type: 'text', content: '💡 我可以帮您：\n• 分析物种分布与活动规律（如"近期物种分布情况"）\n• 生成生态监测趋势分析（如"分析最近一周数据趋势"）\n• 自动生成监测报告（如"生成本月监测报告"）\n• 告警事件分析（如"哪些区域告警频率最高"）\n• 设备运行状态诊断（如"设备电量情况"）' },
    ],
    references: [
      { source: '系统提示', snippet: 'AI Agent 已就绪，支持自然语言查询与报告生成' },
    ],
  }
}

export const agentApi = {
  async sendMessage(message: string): Promise<AgentReply> {
    const reply = generateReply(message)
    return delay(reply, 900 + Math.random() * 600)
  },

  async getDataSources(): Promise<AgentDataSource[]> {
    return delay(mockAgentDataSources as AgentDataSource[])
  },

  async getQuickQuestions(): Promise<string[]> {
    return delay(mockAgentQuickQuestions)
  },

  async getSessions(): Promise<AgentSession[]> {
    return delay(mockAgentSessions as AgentSession[])
  },

  async generateReport(params?: { period?: string }): Promise<AgentReply> {
    const reply = generateReply('生成报告')
    if (params?.period) {
      const reportBlock = reply.blocks.find((b) => b.type === 'report')
      if (reportBlock && reportBlock.type === 'report') {
        reportBlock.period = params.period
      }
    }
    return delay(reply, 1500)
  },
}
