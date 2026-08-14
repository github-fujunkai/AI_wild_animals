import type {
  DeviceConfig,
  DeviceItem,
  ImageRecord,
  OrgTreeNode,
  PermissionNode,
  RoleItem,
  UserItem,
} from '@/types/models'
import type {
  AlertItem,
  DataChartResponse,
  DataOverviewItem,
  DailySummaryItem,
  SpeciesCatalogItem,
  SpeciesImageItem,
  SpeciesStatItem,
} from '@/services/api'

export const overviewCards = [
  { title: '总设备', value: 128, color: '#2dd4a8' },
  { title: '在线设备', value: 96, color: '#4a9eff' },
  { title: '离线设备', value: 24, color: '#f0b429' },
  { title: '告警设备', value: 8, color: '#e5484d' },
]

export const recentAlerts: AlertItem[] = [
  { id: '1', type: '告警', level: 'danger', title: '相机-003 产生入侵报警', message: '相机-003 检测到异常入侵信号，已自动触发报警', isRead: false, time: '2 分钟前' },
  { id: '2', type: '警告', level: 'warning', title: '相机-002 电量低于 15%', message: '相机-002 当前电量仅剩 15%，请及时更换电池', isRead: false, time: '5 分钟前' },
  { id: '3', type: '告警', level: 'danger', title: '监测到疑似人类活动', message: 'D1 区域监测到疑似人类活动，请注意查看相关影像', isRead: false, time: '1 小时前' },
  { id: '4', type: '通知', level: 'default', title: '相机-004 离线超过 1 小时', message: '相机-004 已离线超过 1 小时，请检查网络连接和设备状态', isRead: true, time: '30 分钟前' },
  { id: '5', type: '通知', level: 'default', title: '相机-001 固件 V2.2.0 可升级', message: '相机-001 固件 V2.2.0 可升级，建议尽快更新以获得更好性能', isRead: true, time: '3 小时前' },
  { id: '6', type: '警告', level: 'warning', title: '相机-005 存储空间不足', message: '相机-005 存储空间不足，剩余容量低于 10%，请及时清理', isRead: true, time: '5 小时前' },
]

export const devices: DeviceItem[] = [
  {
    id: '1',
    imei: '860012345678',
    serialNumber: 'SN-001',
    name: '相机-001',
    type: '500W',
    orgId: '1',
    orgName: '总部/区域A',
    status: '在线',
    battery: 85,
    firmwareVersion: 'V2.1.3',
    longitude: '121.4737',
    latitude: '31.2304',
    installedAt: '2024-01-10',
    lastHeartbeatAt: '2026-07-21 12:19:48',
  },
  {
    id: '2',
    imei: '860012345679',
    serialNumber: 'SN-002',
    name: '相机-002',
    type: '500W',
    orgId: '2',
    orgName: '总部/区域B',
    status: '告警',
    battery: 15,
    firmwareVersion: 'V2.1.3',
    longitude: '121.6018',
    latitude: '31.1496',
    installedAt: '2024-01-12',
    lastHeartbeatAt: '2026-07-21 10:08:11',
  },
  {
    id: '3',
    imei: '860012345680',
    serialNumber: 'SN-003',
    name: '相机-003',
    type: '800W',
    orgId: '3',
    orgName: '华北/监测站A',
    status: '离线',
    battery: 0,
    firmwareVersion: 'V2.0.8',
    longitude: '121.3245',
    latitude: '31.1952',
    installedAt: '2024-01-08',
    lastHeartbeatAt: '',
  },
  {
    id: '4',
    imei: '860012345681',
    serialNumber: 'SN-004',
    name: '相机-004',
    type: '500W',
    orgId: '4',
    orgName: '华北/监测站B',
    status: '在线',
    battery: 62,
    firmwareVersion: 'V2.1.3',
    longitude: '121.5021',
    latitude: '31.2105',
    installedAt: '2024-02-15',
    lastHeartbeatAt: '2026-07-21 11:45:22',
  },
  {
    id: '5',
    imei: '860012345682',
    serialNumber: 'SN-005',
    name: '相机-005',
    type: '800W',
    orgId: '6',
    orgName: '华南/监测站C',
    status: '低电量',
    battery: 12,
    firmwareVersion: 'V2.1.0',
    longitude: '121.4821',
    latitude: '31.1654',
    installedAt: '2024-03-01',
    lastHeartbeatAt: '2026-07-21 09:30:15',
  },
]

export const imageRecords: ImageRecord[] = [
  {
    id: '1',
    deviceId: '1',
    deviceName: '相机-001',
    deviceSerialNumber: 'SN-001',
    capturedAt: '2024-01-15 08:30',
    fileType: '图片',
    fileName: 'deer-001.jpg',
    filePath: '/uploads/deer-001.jpg',
    size: '2.5 MB',
    eventType: 'PIR触发',
    speciesTag: '鹿 98%',
    smartCategory: '动物',
  },
  {
    id: '2',
    deviceId: '2',
    deviceName: '相机-002',
    deviceSerialNumber: 'SN-002',
    capturedAt: '2024-01-15 07:15',
    fileType: '视频',
    fileName: 'boar-002.mp4',
    filePath: '/uploads/boar-002.mp4',
    size: '15.8 MB',
    eventType: '定时拍摄',
    speciesTag: '野猪 95%',
    smartCategory: '动物',
  },
  {
    id: '3',
    deviceId: '3',
    deviceName: '相机-003',
    deviceSerialNumber: 'SN-003',
    capturedAt: '2024-01-15 06:45',
    fileType: '图片',
    fileName: 'human-003.jpg',
    filePath: '/uploads/human-003.jpg',
    size: '1.8 MB',
    eventType: '手动抓拍',
    speciesTag: '人类 89%',
    smartCategory: '人',
  },
  {
    id: '4',
    deviceId: '1',
    deviceName: '相机-001',
    deviceSerialNumber: 'SN-001',
    capturedAt: '2024-01-16 09:20',
    fileType: '图片',
    fileName: 'fox-004.jpg',
    filePath: '/uploads/fox-004.jpg',
    size: '3.1 MB',
    eventType: 'PIR触发',
    speciesTag: '狐狸 92%',
    smartCategory: '动物',
  },
  {
    id: '5',
    deviceId: '4',
    deviceName: '相机-004',
    deviceSerialNumber: 'SN-004',
    capturedAt: '2024-01-16 10:05',
    fileType: '视频',
    fileName: 'rabbit-005.mp4',
    filePath: '/uploads/rabbit-005.mp4',
    size: '12.4 MB',
    eventType: '定时拍摄',
    speciesTag: '野兔 88%',
    smartCategory: '动物',
  },
]

export const users: UserItem[] = [
  {
    id: '1',
    username: 'admin',
    displayName: '超级管理员',
    roleId: '1',
    roleName: '超级管理员',
    orgId: '1',
    orgName: '全部',
    status: '启用',
    createdAt: '2024-01-01',
  },
  {
    id: '2',
    username: 'zhangwei',
    displayName: '张伟',
    roleId: '2',
    roleName: '普通监测员',
    orgId: '2',
    orgName: '总部/区域A',
    status: '启用',
    createdAt: '2024-01-10',
  },
  {
    id: '3',
    username: 'lisi',
    displayName: '李四',
    roleId: '3',
    roleName: '组织负责人',
    orgId: '3',
    orgName: '华北/监测站A',
    status: '禁用',
    createdAt: '2024-02-05',
  },
]

export const roles: RoleItem[] = [
  {
    id: '1',
    name: '超级管理员',
    roleCode: 'SUPER_ADMIN',
    description: '全部权限，不可编辑',
    userCount: 1,
    createdAt: '2024-01-01',
    isSystem: true,
    permissions: ['all'],
  },
  {
    id: '2',
    name: '普通监测员',
    roleCode: 'MONITOR',
    description: '查看地图、影像、基础统计',
    userCount: 5,
    createdAt: '2024-01-01',
    isSystem: true,
    permissions: ['home:view', 'images:view', 'devices:view'],
  },
  {
    id: '3',
    name: '组织负责人',
    roleCode: 'ORG_ADMIN',
    description: '组织内设备与成员查看、设备配置',
    userCount: 3,
    createdAt: '2024-01-01',
    isSystem: true,
    permissions: ['home:view', 'images:view', 'devices:view', 'orgs:view', 'orgs:create'],
  },
]

export const permissionTree: PermissionNode[] = [
  {
    key: 'home',
    label: '首页',
    type: 'module',
    children: [{ key: 'home:view', label: '查看首页', type: 'action' }],
  },
  {
    key: 'devices',
    label: '设备管理',
    type: 'module',
    children: [
      { key: 'devices:view', label: '查看设备', type: 'action' },
      { key: 'devices:create', label: '新增设备', type: 'action' },
      { key: 'devices:update', label: '编辑设备', type: 'action' },
      { key: 'devices:delete', label: '删除设备', type: 'action' },
      { key: 'devices:config', label: '设备配置', type: 'action' },
    ],
  },
  {
    key: 'images',
    label: '影像数据',
    type: 'module',
    children: [
      { key: 'images:view', label: '查看影像', type: 'action' },
      { key: 'images:download', label: '下载影像', type: 'action' },
      { key: 'images:tag', label: '标注影像', type: 'action' },
      { key: 'images:upload', label: '上传影像', type: 'action' },
    ],
  },
  {
    key: 'orgs',
    label: '组织机构',
    type: 'module',
    children: [
      { key: 'orgs:view', label: '查看组织', type: 'action' },
      { key: 'orgs:create', label: '新增组织', type: 'action' },
      { key: 'orgs:update', label: '编辑组织', type: 'action' },
      { key: 'orgs:delete', label: '删除组织', type: 'action' },
    ],
  },
  {
    key: 'users',
    label: '用户管理',
    type: 'module',
    children: [
      { key: 'users:view', label: '查看用户', type: 'action' },
      { key: 'users:create', label: '新增用户', type: 'action' },
      { key: 'users:update', label: '编辑用户', type: 'action' },
      { key: 'users:delete', label: '删除用户', type: 'action' },
    ],
  },
  {
    key: 'roles',
    label: '角色权限',
    type: 'module',
    children: [
      { key: 'roles:view', label: '查看角色', type: 'action' },
      { key: 'roles:create', label: '新增角色', type: 'action' },
      { key: 'roles:update', label: '编辑角色', type: 'action' },
      { key: 'roles:delete', label: '删除角色', type: 'action' },
    ],
  },
  {
    key: 'species',
    label: 'AI物种分析',
    type: 'module',
    children: [
      { key: 'species:view', label: '查看分析', type: 'action' },
      { key: 'species:animal', label: '动物分析', type: 'action' },
      { key: 'species:plant', label: '植物分析', type: 'action' },
    ],
  },
  {
    key: 'data',
    label: '数据展示',
    type: 'module',
    children: [{ key: 'data:view', label: '查看数据', type: 'action' }],
  },
  {
    key: 'ops',
    label: '设备运维中心',
    type: 'module',
    children: [{ key: 'ops:view', label: '查看运维', type: 'action' }],
  },
  {
    key: 'env',
    label: '环境监测',
    type: 'module',
    children: [{ key: 'env:view', label: '查看环境', type: 'action' }],
  },
  {
    key: 'agent',
    label: '生态AI助手',
    type: 'module',
    children: [
      { key: 'agent:view', label: '使用AI助手', type: 'action' },
      { key: 'agent:report', label: '生成监测报告', type: 'action' },
    ],
  },
]

export const orgTree: OrgTreeNode[] = [
  {
    key: '1',
    title: '野外守望者总部',
    orgCode: 'HQ',
    children: [
      {
        key: '2',
        title: '华北区域',
        orgCode: 'NORTH',
        children: [
          { key: '3', title: '监测站A', orgCode: 'A001' },
          { key: '4', title: '监测站B', orgCode: 'A002' },
        ],
      },
      {
        key: '5',
        title: '华南区域',
        orgCode: 'SOUTH',
        children: [{ key: '6', title: '监测站C', orgCode: 'A003' }],
      },
    ],
  },
]

export const orgDetails: Record<string, { parentId: string | null; parentName: string; orgCode: string; description: string; createdAt: string }> = {
  '1': { parentId: null, parentName: '-', orgCode: 'HQ', description: '野外守望者总部', createdAt: '2024-01-01' },
  '2': { parentId: '1', parentName: '野外守望者总部', orgCode: 'NORTH', description: '华北区域分部', createdAt: '2024-01-02' },
  '3': { parentId: '2', parentName: '华北区域', orgCode: 'A001', description: '监测站A', createdAt: '2024-01-03' },
  '4': { parentId: '2', parentName: '华北区域', orgCode: 'A002', description: '监测站B', createdAt: '2024-01-03' },
  '5': { parentId: '1', parentName: '野外守望者总部', orgCode: 'SOUTH', description: '华南区域分部', createdAt: '2024-01-04' },
  '6': { parentId: '5', parentName: '华南区域', orgCode: 'A003', description: '监测站C', createdAt: '2024-01-05' },
}

export const orgMembers = [
  { id: '1', userId: '1', roleId: '1', user: 'admin', displayName: '管理员', role: '超级管理员', joinedAt: '2024-01-01' },
  { id: '2', userId: '2', roleId: '2', user: 'zhangwei', displayName: '张伟', role: '普通监测员', joinedAt: '2024-01-10' },
  { id: '3', userId: '3', roleId: '3', user: 'lisi', displayName: '李四', role: '组织负责人', joinedAt: '2024-02-05' },
]

// 设备配置（按设备ID）
export const deviceConfigs: Record<string, DeviceConfig> = {
  '1': {
    workMode: 'day',
    captureInterval: 30,
    sensitivity: 'medium',
    resolution: '1080P',
    nightVision: true,
    uploadMode: 'realtime',
    heartbeatInterval: 60,
    schedule: { start: '06:00', end: '20:00' },
  },
  '2': {
    workMode: 'all',
    captureInterval: 60,
    sensitivity: 'high',
    resolution: '720P',
    nightVision: true,
    uploadMode: 'schedule',
    heartbeatInterval: 120,
    schedule: { start: '00:00', end: '23:59' },
  },
  '3': {
    workMode: 'night',
    captureInterval: 15,
    sensitivity: 'low',
    resolution: '1080P',
    nightVision: false,
    uploadMode: 'realtime',
    heartbeatInterval: 90,
    schedule: { start: '18:00', end: '06:00' },
  },
}

// 告警列表（全量，用于告警管理页）
export const alerts: AlertItem[] = [
  ...recentAlerts,
  { id: '7', type: '告警', level: 'danger', title: '相机-006 检测到盗猎行为', message: '相机-006 检测到疑似盗猎行为，已自动上报', isRead: false, time: '6 小时前' },
  { id: '8', type: '警告', level: 'warning', title: '相机-007 信号不稳定', message: '相机-007 网络信号波动较大，请检查天线', isRead: true, time: '8 小时前' },
  { id: '9', type: '通知', level: 'default', title: '系统巡检完成', message: '本周系统巡检已完成，所有设备运行正常', isRead: true, time: '1 天前' },
  { id: '10', type: '告警', level: 'danger', title: '相机-008 检测到火情', message: '相机-008 监测到疑似火情，已自动报警', isRead: false, time: '1 天前' },
]

// 物种目录
export const speciesCatalog: SpeciesCatalogItem[] = [
  {
    id: '1',
    code: 'MAM-001',
    name: '梅花鹿',
    category: '哺乳动物',
    protectionLevel: '国家一级',
    location: '华北区域',
    isCore: true,
    phylum: '脊索动物门',
    className: '哺乳纲',
    speciesOrder: '偶蹄目',
    family: '鹿科',
    description: '梅花鹿是中型鹿，雄鹿有角，身上有白色梅花斑点',
    orgId: 1,
    createdAt: '2024-01-05',
  },
  {
    id: '2',
    code: 'MAM-002',
    name: '野猪',
    category: '哺乳动物',
    protectionLevel: '非保护',
    location: '华北区域',
    isCore: false,
    phylum: '脊索动物门',
    className: '哺乳纲',
    speciesOrder: '偶蹄目',
    family: '猪科',
    description: '野猪是家猪的祖先，适应力强，分布广泛',
    orgId: 1,
    createdAt: '2024-01-06',
  },
  {
    id: '3',
    code: 'MAM-003',
    name: '赤狐',
    category: '哺乳动物',
    protectionLevel: '国家二级',
    location: '华南区域',
    isCore: true,
    phylum: '脊索动物门',
    className: '哺乳纲',
    speciesOrder: '食肉目',
    family: '犬科',
    description: '赤狐是狐属中分布最广的物种，毛色呈红棕色',
    orgId: 1,
    createdAt: '2024-01-07',
  },
  {
    id: '4',
    code: 'AVI-001',
    name: '白鹇',
    category: '鸟类',
    protectionLevel: '国家二级',
    location: '华南区域',
    isCore: true,
    phylum: '脊索动物门',
    className: '鸟纲',
    speciesOrder: '鸡形目',
    family: '雉科',
    description: '白鹇是大型鸡类，雄鸟上体白色而有黑纹，雌鸟通体橄榄褐色',
    orgId: 1,
    createdAt: '2024-01-08',
  },
  {
    id: '5',
    code: 'MAM-004',
    name: '野兔',
    category: '哺乳动物',
    protectionLevel: '非保护',
    location: '华北区域',
    isCore: false,
    phylum: '脊索动物门',
    className: '哺乳纲',
    speciesOrder: '兔形目',
    family: '兔科',
    description: '野兔是常见的野生兔类，奔跑速度快',
    orgId: 1,
    createdAt: '2024-01-09',
  },
]

// 物种统计
export const speciesStats: Record<string, SpeciesStatItem[]> = {
  animal: [
    { title: '梅花鹿', value: 128, confidence: 98 },
    { title: '野猪', value: 96, confidence: 95 },
    { title: '赤狐', value: 45, confidence: 92 },
    { title: '野兔', value: 72, confidence: 88 },
    { title: '人类', value: 23, confidence: 89 },
  ],
  plant: [
    { title: '蕨类植物', value: 156, confidence: 91 },
    { title: '苔藓', value: 89, confidence: 86 },
    { title: '野生花卉', value: 64, confidence: 83 },
  ],
}

// 物种图片
export const speciesImages: SpeciesImageItem[] = [
  { id: '1', species: '梅花鹿', confidence: 98, location: '监测站A', time: '2024-01-15 08:30', category: '动物', fileName: 'deer-001.jpg' },
  { id: '2', species: '野猪', confidence: 95, location: '监测站A', time: '2024-01-15 07:15', category: '动物', fileName: 'boar-002.mp4' },
  { id: '3', species: '人类', confidence: 89, location: '监测站B', time: '2024-01-15 06:45', category: '人', fileName: 'human-003.jpg' },
  { id: '4', species: '赤狐', confidence: 92, location: '监测站A', time: '2024-01-16 09:20', category: '动物', fileName: 'fox-004.jpg' },
  { id: '5', species: '野兔', confidence: 88, location: '监测站C', time: '2024-01-16 10:05', category: '动物', fileName: 'rabbit-005.mp4' },
  { id: '6', species: '白鹇', confidence: 94, location: '监测站C', time: '2024-01-17 11:30', category: '鸟类', fileName: 'pheasant-006.jpg' },
]

// 数据展示 - 概览
export const dataOverview: DataOverviewItem[] = [
  { title: '总抓拍量', value: 1280, trend: '12.5%', trendDir: 'up' },
  { title: '野生动物', value: 980, trend: '8.3%', trendDir: 'up' },
  { title: '告警事件', value: 28, trend: '5.2%', trendDir: 'down' },
  { title: '设备离线', value: 3, trend: '1.1%', trendDir: 'down' },
]

// 数据展示 - 图表
export const dataCharts: DataChartResponse = {
  captures: [
    { date: '2024-01-10', value: 45 },
    { date: '2024-01-11', value: 62 },
    { date: '2024-01-12', value: 38 },
    { date: '2024-01-13', value: 75 },
    { date: '2024-01-14', value: 52 },
    { date: '2024-01-15', value: 89 },
    { date: '2024-01-16', value: 68 },
  ],
  trends: [
    {
      name: '哺乳动物',
      data: [
        { date: '2024-01-10', value: 25 },
        { date: '2024-01-11', value: 38 },
        { date: '2024-01-12', value: 22 },
        { date: '2024-01-13', value: 45 },
        { date: '2024-01-14', value: 30 },
        { date: '2024-01-15', value: 52 },
        { date: '2024-01-16', value: 41 },
      ],
    },
    {
      name: '鸟类',
      data: [
        { date: '2024-01-10', value: 12 },
        { date: '2024-01-11', value: 18 },
        { date: '2024-01-12', value: 9 },
        { date: '2024-01-13', value: 22 },
        { date: '2024-01-14', value: 15 },
        { date: '2024-01-15', value: 28 },
        { date: '2024-01-16', value: 19 },
      ],
    },
  ],
}

// 数据展示 - 每日汇总
export const dailySummary: DailySummaryItem[] = [
  { date: '2024-01-10', totalCaptures: 45, wildlife: 38, emptyCaptures: 5, humanTriggers: 2, alertEvents: 1, deviceOffline: 0 },
  { date: '2024-01-11', totalCaptures: 62, wildlife: 52, emptyCaptures: 6, humanTriggers: 4, alertEvents: 2, deviceOffline: 1 },
  { date: '2024-01-12', totalCaptures: 38, wildlife: 32, emptyCaptures: 4, humanTriggers: 2, alertEvents: 0, deviceOffline: 0 },
  { date: '2024-01-13', totalCaptures: 75, wildlife: 68, emptyCaptures: 5, humanTriggers: 2, alertEvents: 1, deviceOffline: 1 },
  { date: '2024-01-14', totalCaptures: 52, wildlife: 45, emptyCaptures: 5, humanTriggers: 2, alertEvents: 0, deviceOffline: 0 },
  { date: '2024-01-15', totalCaptures: 89, wildlife: 78, emptyCaptures: 7, humanTriggers: 4, alertEvents: 3, deviceOffline: 2 },
  { date: '2024-01-16', totalCaptures: 68, wildlife: 60, emptyCaptures: 6, humanTriggers: 2, alertEvents: 1, deviceOffline: 1 },
]

// 租户信息
export const tenants: Record<string, { name: string; code: string }> = {
  default: { name: '野外守望者总部', code: 'default' },
  demo: { name: '演示租户', code: 'demo' },
}

// 模拟登录用户密码表
export const userPasswords: Record<string, string> = {
  admin: '123456',
  zhangwei: '123456',
  lisi: '123456',
}

// ─── AI 助手 mock 数据 ─────────────────────────────────────────────────────

export const agentDataSources = [
  { name: '物种知识库', status: 'ready', count: 156, updatedAt: '2024-01-15 08:00', desc: '含国家一/二级保护动物分类学信息' },
  { name: '历史监测数据', status: 'ready', count: 1280, updatedAt: '2024-01-16 12:00', desc: '近6个月红外相机抓拍记录' },
  { name: '环境监测数据', status: 'ready', count: 856, updatedAt: '2024-01-16 09:00', desc: '气象、月相、地形等环境因子' },
  { name: '设备运行数据', status: 'ready', count: 5, updatedAt: '2024-01-16 12:30', desc: '设备电量、在线状态、固件版本' },
  { name: '告警记录库', status: 'indexing', count: 28, updatedAt: '2024-01-16 11:00', desc: '入侵告警、电量告警、设备离线' },
]

export const agentQuickQuestions = [
  '近期野生动物物种分布情况如何？',
  '分析最近一周的监测数据趋势',
  '生成本月生态监测报告',
  '哪些区域告警频率最高？',
  '梅花鹿的监测记录和活动规律',
  '对比本月与上月设备运行状态',
]

export const agentSessions = [
  { id: '1', title: '物种分布查询', time: '2 小时前', messageCount: 5, preview: '近期监测到的物种主要包括梅花鹿、野猪...' },
  { id: '2', title: '月度监测报告生成', time: '昨天', messageCount: 8, preview: '已为您生成 2024年1月 生态监测报告...' },
  { id: '3', title: '告警趋势分析', time: '2 天前', messageCount: 3, preview: '本周告警事件共 7 起，较上周下降 30%...' },
  { id: '4', title: '设备电量预警分析', time: '3 天前', messageCount: 4, preview: '当前有 2 台设备电量低于 20%...' },
]
