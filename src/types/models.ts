export type DeviceStatus = '在线' | '离线' | '告警' | '低电量'

export type DeviceItem = {
  id: string
  imei: string
  serialNumber: string
  name: string
  type: string
  orgId?: string | null
  orgName: string
  status: DeviceStatus | string
  battery: number
  firmwareVersion: string
  longitude: string
  latitude: string
  installedAt: string
  lastHeartbeatAt: string
}

export type DeviceConfig = Record<string, unknown>

export type ImageRecord = {
  id: string
  deviceId: string
  deviceName: string
  deviceSerialNumber: string
  capturedAt: string
  fileType: '图片' | '视频'
  fileName: string
  filePath: string
  size: string
  eventType: string
  speciesTag?: string
  smartCategory?: string
}

export type UserItem = {
  id: string
  username: string
  displayName: string
  roleId: string
  roleName: string
  roleCode?: string
  isSystem?: boolean
  isTenantAdmin?: boolean
  orgId?: string | null
  orgName: string
  status: '启用' | '禁用'
  createdAt: string
}

export type RoleItem = {
  id: string
  name: string
  roleCode: string
  description: string
  userCount: number
  createdAt: string
  isSystem: boolean
  permissions: string[]
}

export type OrgTreeNode = {
  key: string
  title: string
  parentId?: string | null
  orgCode?: string
  children?: OrgTreeNode[]
}

export type PermissionNode = {
  key: string
  label: string
  type: string
  children?: PermissionNode[]
}

export type AuthUser = {
  id: string
  username: string
  displayName: string
  roleId: string
  roleName: string
  orgId?: string | null
  orgName: string
  permissions: string[]
  mustChangePassword?: boolean
  tenantId?: string
  tenantName?: string
  tenantStatus?: string
  tenantModules?: string[]
  tenantCode?: string
}

export type OrgDetail = {
  id: string
  name: string
  parentId?: string | number | null
  parentName: string
  orgCode: string
  description: string
  createdAt: string
  deviceCount: number
  memberCount: number
  childCount: number
}

export type OrgMember = {
  id: string
  userId: string
  roleId: string
  user: string
  displayName: string
  role: string
  joinedAt: string
}

export type UserOption = {
  id: string
  username: string
  displayName: string
}
