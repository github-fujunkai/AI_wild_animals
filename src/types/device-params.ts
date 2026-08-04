/**
 * 设备配置参数定义（来自产品规格）
 * 支持两种设备类型：500W（TRLF33B75-4）和 800W（TRLF55B78-4）
 */

/** 设备类型标识 */
export type DeviceModelType = '500W' | '800W'

export interface DeviceParamSchema {
  desc: string
  type: 'string' | 'list' | 'number' | 'boolean'
  readonly: boolean
  /** 通用默认值（500W） */
  default?: unknown
  /** 800W 设备的默认值，如果不设置则使用 default */
  default800W?: unknown
  list?: Array<{ title: string; value: unknown }>
  regex?: string
}

export const DEVICE_TYPE_OPTIONS: Array<{ label: string; value: DeviceModelType }> = [
  { label: '500W（TRLF33B75-4）', value: '500W' },
  { label: '800W（TRLF55B78-4）', value: '800W' },
]

export const DEVICE_PARAM_SCHEMA: Record<string, DeviceParamSchema> = {
  // ===== 基础信息（只读） =====
  serialNumber: { desc: '设备序列号', type: 'string', readonly: true, default: '' },
  imei: { desc: 'IMEI编号', type: 'string', readonly: true, default: '' },
  hwVer: { desc: '硬件版本', type: 'string', readonly: true, default: '' },
  softVer: { desc: '软件版本', type: 'string', readonly: true, default: '' },
  MCUVer: { desc: 'MCU版本', type: 'string', readonly: true, default: '' },
  CPUVer: { desc: 'CPU版本', type: 'string', readonly: true, default: '' },
  deviceType: { desc: '设备型号', type: 'string', readonly: true, default: '' },
  organizationNames: { desc: '机构名称', type: 'string', readonly: false, default: '' },

  // ===== 拍摄设置 =====
  shootingMode: {
    desc: '拍摄模式',
    type: 'list',
    readonly: false,
    default: 3,
    list: [
      { title: '照片', value: 1 },
      { title: '视频', value: 2 },
      { title: '图片+视频', value: 3 },
    ],
  },
  photoResolution: {
    desc: '照片分辨率',
    type: 'list',
    readonly: false,
    default: 4,
    list: [
      { title: '1MP', value: 1 },
      { title: '3MP', value: 2 },
      { title: '5MP', value: 3 },
      { title: '8MP', value: 4 },
      { title: '12MP', value: 5 },
      { title: '15MP', value: 6 },
      { title: '20MP', value: 7 },
      { title: '24MP', value: 8 },
      { title: '35MP', value: 9 },
    ],
  },
  shootingNumbers: {
    desc: '连拍次数',
    type: 'list',
    readonly: false,
    default: 3,
    list: [
      { title: '1次', value: 1 },
      { title: '2次', value: 2 },
      { title: '3次', value: 3 },
    ],
  },
  videoResolution: {
    desc: '视频分辨率',
    type: 'list',
    readonly: false,
    default: 5,
    default800W: 7,
    list: [
      { title: '240P', value: 1 },
      { title: '480P', value: 2 },
      { title: '720P', value: 3 },
      { title: '960P', value: 4 },
      { title: '1080P', value: 5 },
      { title: '2K', value: 6 },
      { title: '4K', value: 7 },
    ],
  },
  videoFrameRate: {
    desc: '视频帧率',
    type: 'list',
    readonly: false,
    default: 2,
    default800W: 1,
    list: [
      { title: '15FPS', value: 1 },
      { title: '25FPS', value: 2 },
      { title: '30FPS', value: 3 },
    ],
  },
  videoLength: {
    desc: '视频时长',
    type: 'list',
    readonly: false,
    default: 2,
    list: [
      { title: '5秒', value: 1 },
      { title: '10秒', value: 2 },
      { title: '15秒', value: 3 },
      { title: '20秒', value: 4 },
      { title: '30秒', value: 5 },
      { title: '60秒', value: 6 },
    ],
  },
  microPhone: {
    desc: '拾音器',
    type: 'list',
    readonly: false,
    default: 1,
    list: [
      { title: '开启', value: 1 },
      { title: '关闭', value: 2 },
    ],
  },
  loudSpeaker: {
    desc: '扬声器',
    type: 'list',
    readonly: false,
    default: 1,
    list: [
      { title: '开启', value: 1 },
      { title: '关闭', value: 2 },
    ],
  },
  waterMark: {
    desc: '照片水印',
    type: 'list',
    readonly: false,
    default: 1,
    list: [{ title: '开启', value: 1 }, { title: '关闭', value: 2 }],
  },
  ntpService: {
    desc: '网络同步',
    type: 'list',
    readonly: false,
    default: 1,
    list: [{ title: '开启', value: 1 }, { title: '关闭', value: 2 }],
  },
  timeFormat: {
    desc: '时间格式',
    type: 'list',
    readonly: false,
    default: 3,
    list: [
      { title: 'YYYY-MM-DD HH:MM:SS', value: 1 },
      { title: 'DD/MM/YYYY HH:MM:SS', value: 2 },
      { title: 'YYYY-MM-DD', value: 3 },
    ],
  },
  triggerInterval: {
    desc: '感应间隔（秒）',
    type: 'list',
    readonly: false,
    default: 5,
    list: [
      { title: '5秒', value: 1 },
      { title: '10秒', value: 2 },
      { title: '30秒', value: 3 },
      { title: '60秒', value: 4 },
      { title: '120秒', value: 5 },
      { title: '300秒', value: 6 },
    ],
  },
  pirSensitivity: {
    desc: 'PIR灵敏度',
    type: 'list',
    readonly: false,
    default: 2,
    list: [
      { title: '低', value: 1 },
      { title: '中', value: 2 },
      { title: '高', value: 3 },
    ],
  },
  pirStatus: {
    desc: 'PIR状态',
    type: 'list',
    readonly: false,
    default: 1,
    list: [{ title: '开启', value: 1 }, { title: '关闭', value: 2 }],
  },

  // ===== 通讯设置 =====
  netMode: {
    desc: '网络制式',
    type: 'list',
    readonly: false,
    default: 1,
    list: [
      { title: 'Auto', value: 1 },
    ],
  },
  comunicateMode: {
    desc: '通讯模式',
    type: 'list',
    readonly: false,
    default: 1,
    list: [
      { title: '4G', value: 1 },
    ],
  },
  gpsModule: {
    desc: 'GPS定位',
    type: 'list',
    readonly: false,
    default: 1,
    list: [
      { title: '关闭', value: 0 },
      { title: '开启', value: 1 },
    ],
  },
  bluetoothModule: {
    desc: '蓝牙',
    type: 'list',
    readonly: false,
    default: 1,
    list: [
      { title: '关闭', value: 0 },
      { title: '开启', value: 1 },
    ],
  },
  workMode: {
    desc: '发送模式',
    type: 'list',
    readonly: false,
    default: 1,
    list: [
      { title: 'FTP', value: 1 },
      { title: 'HTTP', value: 2 },
      { title: '混合', value: 3 },
    ],
  },
  heartbeatInterval: {
    desc: '心跳间隔',
    type: 'list',
    readonly: false,
    default: 1,
    list: [
      { title: '1小时', value: 1 },
      { title: '24小时', value: 2 },
      { title: '48小时', value: 3 },
      { title: '72小时', value: 4 },
    ],
  },

  // ===== FTP 设置 =====
  ftpServer: {
    desc: 'FTP服务器地址',
    type: 'string',
    readonly: false,
    default: 'ftp.visking.cn',
  },
  ftpPort: {
    desc: 'FTP端口号',
    type: 'string',
    readonly: false,
    default: '50031',
    regex: '^(?:[1-9]\\d{0,3}|[1-5]\\d{4}|6[0-4]\\d{3}|65(?:[0-4]\\d{2}|5(?:[0-2]\\d|3[0-5])))$',
  },
  ftpAccount: {
    desc: 'FTP用户名',
    type: 'string',
    readonly: false,
    default: '',
    regex: '^.{0,30}$',
  },
  ftpPassword: {
    desc: 'FTP密码',
    type: 'string',
    readonly: false,
    default: '',
    regex: '^.{0,30}$',
  },
  ftpDirectory: {
    desc: 'FTP上传目录',
    type: 'string',
    readonly: false,
    default: '/data/test',
    default800W: 'ipc/imei',
  },
  ftpEncryption: {
    desc: 'FTP加密方式',
    type: 'list',
    readonly: false,
    default: 1,
    list: [
      { title: '明文', value: 1 },
      { title: 'TLS', value: 2 },
    ],
  },

  // ===== HTTP 设置 =====
  httpServer: {
    desc: 'HTTP服务器地址',
    type: 'string',
    readonly: false,
    default: 'hunting.visking.cn',
  },
  httpPort: {
    desc: 'HTTP端口号',
    type: 'string',
    readonly: false,
    default: '80',
    regex: '^(?:[1-9]\\d{0,3}|[1-5]\\d{4}|6[0-4]\\d{3}|65(?:[0-4]\\d{2}|5(?:[0-2]\\d|3[0-5])))$',
  },
  httpEncryption: {
    desc: 'HTTP加密方式',
    type: 'list',
    readonly: false,
    default: 1,
    list: [
      { title: '明文', value: 1 },
      { title: 'TLS', value: 2 },
    ],
  },

  // ===== 定时触发1 =====
  timeTriggered1: {
    desc: '定时触发1开关',
    type: 'list',
    readonly: false,
    default: 2,
    list: [{ title: '关闭', value: 0 }, { title: '开启', value: 1 }, { title: '仅预览', value: 2 }],
  },
  triggerStartTime1: {
    desc: '定时触发1开始时间',
    type: 'string',
    readonly: false,
    default: '00:00:00',
    regex: '^(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d$',
  },
  triggerEndTime1: {
    desc: '定时触发1结束时间',
    type: 'string',
    readonly: false,
    default: '23:59:59',
    regex: '^(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d$',
  },

  // ===== 定时触发2 =====
  timeTriggered2: {
    desc: '定时触发2开关',
    type: 'list',
    readonly: false,
    default: 2,
    list: [{ title: '关闭', value: 0 }, { title: '开启', value: 1 }, { title: '仅预览', value: 2 }],
  },
  triggerStartTime2: {
    desc: '定时触发2开始时间',
    type: 'string',
    readonly: false,
    default: '12:00:00',
    regex: '^(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d$',
  },
  triggerEndTime2: {
    desc: '定时触发2结束时间',
    type: 'string',
    readonly: false,
    default: '23:59:59',
    regex: '^(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d$',
  },

  // ===== 缩时录影 =====
  timeLapseVideo: {
    desc: '缩时录影视频',
    type: 'list',
    readonly: false,
    default: 2,
    list: [
      { title: '关闭', value: 0 },
      { title: '开启', value: 1 },
      { title: '仅预览', value: 2 },
    ],
  },
  lapseStartTime: {
    desc: '缩时录影开始时间',
    type: 'string',
    readonly: false,
    default: '00:00:00',
    regex: '^(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d$',
  },
  lapseEndTime: {
    desc: '缩时录影结束时间',
    type: 'string',
    readonly: false,
    default: '00:00:00',
    regex: '^(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d$',
  },
  lapseInterval: {
    desc: '缩时录影间隔（分钟）',
    type: 'number',
    readonly: false,
    default: 1,
  },
  realTimeVideo: {
    desc: '实时视频',
    type: 'list',
    readonly: false,
    default: 2,
    list: [
      { title: '关闭', value: 0 },
      { title: '开启', value: 1 },
      { title: '仅预览', value: 2 },
    ],
  },

  // ===== 定时拍摄 =====
  timedCapture: {
    desc: '定时拍摄',
    type: 'list',
    readonly: false,
    default: 2,
    list: [
      { title: '关闭', value: 0 },
      { title: '开启', value: 1 },
      { title: '仅预览', value: 2 },
    ],
  },
  captureTime: {
    desc: '拍摄时间',
    type: 'string',
    readonly: false,
    default: '00:00:00',
    regex: '^(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d$',
  },
  acquisitionInterval: {
    desc: '采集间隔（秒）',
    type: 'number',
    readonly: false,
    default: 3600,
  },

  // ===== 定时发送1 =====
  timedTransmission1: {
    desc: '定时发送1开关',
    type: 'list',
    readonly: false,
    default: 2,
    list: [{ title: '关闭', value: 0 }, { title: '开启', value: 1 }, { title: '仅预览', value: 2 }],
  },
  sendStartTime1: {
    desc: '发送开始时间1',
    type: 'string',
    readonly: false,
    default: '00:00:00',
    regex: '^(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d$',
  },
  sendEndTime1: {
    desc: '发送结束时间1',
    type: 'string',
    readonly: false,
    default: '23:59:59',
    regex: '^(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d$',
  },

  // ===== 定时发送2 =====
  timedTransmission2: {
    desc: '定时发送2开关',
    type: 'list',
    readonly: false,
    default: 2,
    list: [{ title: '关闭', value: 0 }, { title: '开启', value: 1 }, { title: '仅预览', value: 2 }],
  },
  sendStartTime2: {
    desc: '发送开始时间2',
    type: 'string',
    readonly: false,
    default: '12:00:00',
    regex: '^(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d$',
  },
  sendEndTime2: {
    desc: '发送结束时间2',
    type: 'string',
    readonly: false,
    default: '23:59:59',
    regex: '^(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d$',
  },

  // ===== 系统设置 =====
  gpsLongitude: {
    desc: 'GPS经度',
    type: 'string',
    readonly: false,
    default: '',
  },
  gpsLatitude: {
    desc: 'GPS纬度',
    type: 'string',
    readonly: false,
    default: '',
  },
  sdCycle: {
    desc: '循环存储',
    type: 'list',
    readonly: false,
    default: 1,
    list: [
      { title: '关闭', value: 0 },
      { title: '开启', value: 1 },
    ],
  },
  powerOnPasswordStatus: {
    desc: '开机密码状态',
    type: 'list',
    readonly: false,
    default: 2,
    list: [
      { title: '关闭', value: 0 },
      { title: '开启', value: 1 },
      { title: '已设置', value: 2 },
    ],
  },
  powerOnPassword: {
    desc: '开机密码',
    type: 'string',
    readonly: false,
    default: '',
  },
  languageSet: {
    desc: '语言设置',
    type: 'list',
    readonly: false,
    default: 1,
    list: [
      { title: '中文', value: 1 },
      { title: '英文', value: 2 },
    ],
  },
}

/**
 * 获取指定设备类型的参数默认值
 */
export function getParamDefaults(deviceType: DeviceModelType): Record<string, unknown> {
  const defaults: Record<string, unknown> = {}
  for (const [key, schema] of Object.entries(DEVICE_PARAM_SCHEMA)) {
    if (schema.readonly) {
      defaults[key] = schema.default ?? ''
    } else if (deviceType === '800W' && schema.default800W !== undefined) {
      defaults[key] = schema.default800W
    } else {
      defaults[key] = schema.default
    }
  }
  return defaults
}