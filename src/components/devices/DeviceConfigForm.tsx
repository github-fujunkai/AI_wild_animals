import { Collapse, Form, Input, InputNumber, Select, Switch, Tag, Typography } from 'antd'
import { DEVICE_PARAM_SCHEMA, DeviceModelType, getParamDefaults } from '@/types/device-params'
import { useState } from 'react'

/**
 * 参数分组定义 - 按 设备配置.md 的模块层级组织
 * 一级模块：基本设置、通讯设置、高级设置、系统设置
 * 二级分组：每个模块下的子分类
 */
const PARAM_MODULES: Array<{
  title: string
  groups: Array<{
    title: string
    keys: string[]
  }>
}> = [
  {
    title: '基本设置',
    groups: [
      {
        title: '拍摄设置',
        keys: ['shootingMode', 'photoResolution', 'shootingNumbers', 'videoResolution', 'videoFrameRate', 'videoLength', 'microPhone', 'loudSpeaker', 'waterMark'],
      },
      {
        title: '时间日期',
        keys: ['ntpService', 'timeFormat'],
      },
      {
        title: 'PIR配置',
        keys: ['triggerInterval', 'pirSensitivity', 'pirStatus'],
      },
    ],
  },
  {
    title: '通讯设置',
    groups: [
      {
        title: '网络设置',
        keys: ['netMode', 'comunicateMode', 'gpsModule', 'bluetoothModule', 'workMode', 'heartbeatInterval'],
      },
      {
        title: 'FTP服务',
        keys: ['ftpServer', 'ftpPort', 'ftpAccount', 'ftpPassword', 'ftpDirectory', 'ftpEncryption'],
      },
      {
        title: 'HTTP服务',
        keys: ['httpServer', 'httpPort', 'httpEncryption'],
      },
    ],
  },
  {
    title: '高级设置',
    groups: [
      {
        title: '定时触发',
        keys: ['timeTriggered1', 'triggerStartTime1', 'triggerEndTime1', 'timeTriggered2', 'triggerStartTime2', 'triggerEndTime2'],
      },
      {
        title: '缩时录影',
        keys: ['timeLapseVideo', 'lapseStartTime', 'lapseEndTime', 'lapseInterval'],
      },
      {
        title: '定时拍摄',
        keys: ['timedCapture', 'captureTime', 'acquisitionInterval'],
      },
      {
        title: '定时发送',
        keys: ['timedTransmission1', 'sendStartTime1', 'sendEndTime1', 'timedTransmission2', 'sendStartTime2', 'sendEndTime2'],
      },
    ],
  },
  {
    title: '系统设置',
    groups: [
      {
        title: '系统信息',
        keys: ['serialNumber', 'imei', 'hwVer', 'softVer', 'MCUVer', 'CPUVer', 'deviceType', 'organizationNames', 'gpsLongitude', 'gpsLatitude'],
      },
      {
        title: '存储管理',
        keys: ['sdCycle'],
      },
    ],
  },
]

/** 模块颜色标识 */
const MODULE_COLORS = ['#1677ff', '#faad14', '#52c41a', '#722ed1']

interface DeviceConfigFormProps {
  form: ReturnType<typeof Form.useForm>[0]
  readonly?: boolean
  deviceType?: DeviceModelType
}

export default function DeviceConfigForm({ form, readonly, deviceType }: DeviceConfigFormProps) {
  const currentDefaults = getParamDefaults(deviceType || '500W')
  const [activeKeys, setActiveKeys] = useState<string[]>(PARAM_MODULES.map((m) => m.title))

  return (
    <Form form={form} layout="vertical" disabled={readonly} initialValues={currentDefaults}>
      <Collapse
        activeKey={activeKeys}
        onChange={(keys) => setActiveKeys(typeof keys === 'string' ? [keys] : keys)}
        ghost
        expandIconPosition="end"
        className="config-collapse"
        items={PARAM_MODULES.map((module, modIdx) => {
          const color = MODULE_COLORS[modIdx % MODULE_COLORS.length]
          const totalParams = module.groups.reduce((sum, g) => sum + g.keys.filter((k) => DEVICE_PARAM_SCHEMA[k]).length, 0)
          const groupCount = module.groups.filter((g) => g.keys.some((k) => DEVICE_PARAM_SCHEMA[k])).length
          return {
            key: module.title,
            label: (
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-3.5 w-1 rounded-sm" style={{ background: color }} />
                <span className="text-sm font-semibold text-slate-100">{module.title}</span>
                <span className="text-xs font-normal text-slate-400">{groupCount}类 · {totalParams}项</span>
              </span>
            ),
            children: (
              <div className="space-y-3">
                {module.groups.map((group) => {
                  const validKeys = group.keys.filter((key) => DEVICE_PARAM_SCHEMA[key])
                  if (validKeys.length === 0) return null
                  return (
                    <div key={group.title}>
                      <div className="category-title">{group.title}({validKeys.length})</div>
                      <div className="param-grid">
                        {validKeys.map((key) => {
                          const schema = DEVICE_PARAM_SCHEMA[key]
                          const defaultValue = deviceType === '800W' && schema.default800W !== undefined
                            ? schema.default800W
                            : schema.default
                          return readonly
                            ? renderReadonlyCard(key, schema, form)
                            : renderFieldCard(key, schema, defaultValue)
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            ),
          }
        })}
      />
    </Form>
  )
}

/** 渲染可编辑参数卡片 */
function renderFieldCard(key: string, schema: typeof DEVICE_PARAM_SCHEMA[string], defaultValue: unknown) {
  const defaultDisplay = defaultValue != null && defaultValue !== '' ? String(defaultValue) : '—'

  let inputNode: React.ReactNode
  if (schema.type === 'list' && schema.list) {
    inputNode = (
      <Form.Item key={key} name={key} initialValue={defaultValue} noStyle>
        <Select className="param-select" options={schema.list.map((item) => ({ label: item.title, value: item.value }))} />
      </Form.Item>
    )
  } else if (schema.type === 'boolean') {
    inputNode = (
      <Form.Item key={key} name={key} valuePropName="checked" initialValue={defaultValue} noStyle>
        <Switch />
      </Form.Item>
    )
  } else if (schema.type === 'number') {
    inputNode = (
      <Form.Item key={key} name={key} initialValue={defaultValue} noStyle>
        <InputNumber className="param-input" />
      </Form.Item>
    )
  } else {
    const rules: Array<Record<string, unknown>> = []
    if (schema.regex) {
      rules.push({ pattern: new RegExp(schema.regex), message: `请输入有效的${schema.desc}` })
    }
    inputNode = (
      <Form.Item key={key} name={key} initialValue={defaultValue} rules={rules} noStyle>
        <Input className="param-input" placeholder={defaultDisplay !== '—' ? defaultDisplay : '输入值...'} readOnly={schema.readonly} variant={schema.readonly ? 'filled' : undefined} />
      </Form.Item>
    )
  }

  return (
    <div key={key} className="param-card">
      <div className="param-label">
        <div className="param-desc" title={schema.desc}>{schema.desc}</div>
        <div className="param-key" title={key}>{key}</div>
      </div>
      <div className="param-value-area">
        <div className="input-wrap">{inputNode}</div>
      </div>
    </div>
  )
}

/** 渲染只读参数卡片 */
function renderReadonlyCard(key: string, schema: typeof DEVICE_PARAM_SCHEMA[string], form: DeviceConfigFormProps['form']) {
  return (
    <div key={key} className="param-card">
      <div className="param-label">
        <div className="param-desc" title={schema.desc}>{schema.desc}</div>
        <div className="param-key" title={key}>{key}</div>
      </div>
      <div className="param-value-area">
        <div className="input-wrap">
          <Typography.Text className="text-sm text-slate-100">{form.getFieldValue(key) ?? '-'}</Typography.Text>
        </div>
      </div>
    </div>
  )
}