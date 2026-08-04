import { Button, Checkbox, Form, Input, message } from 'antd'
import { useNavigate } from 'react-router-dom'
import { authApi, versionApi } from '@/services/api'
import { useAuthStore } from '@/store/auth-store'
import { useEffect, useState } from 'react'
import loginBg from '@/assets/login-bg.jpg'

const REMEMBER_KEY = 'wild-guardian-remember'
const TENANT_KEY = 'wild-guardian-tenant-code'

// 默认账户（未记住凭据时填充，方便快速登录）
const DEFAULT_CREDENTIALS = { username: 'admin', password: '123456' }

function getRememberedCredentials(): { username: string; password: string; remember: boolean } {
  try {
    const raw = localStorage.getItem(REMEMBER_KEY)
    if (raw) {
      const data = JSON.parse(raw)
      return {
        username: data.username || DEFAULT_CREDENTIALS.username,
        password: data.password || DEFAULT_CREDENTIALS.password,
        remember: true,
      }
    }
  } catch { /* ignore */ }
  // 未记住凭据时，默认填充 admin / 123456，并默认勾选“记住密码”，方便直接点击登录
  return { username: DEFAULT_CREDENTIALS.username, password: DEFAULT_CREDENTIALS.password, remember: true }
}

function saveCredentials(username: string, password: string) {
  localStorage.setItem(REMEMBER_KEY, JSON.stringify({ username, password }))
}

function clearCredentials() {
  localStorage.removeItem(REMEMBER_KEY)
}

interface LoginPageProps {
  tenantCode?: string
}

export default function LoginPage({ tenantCode: tenantCodeProp }: LoginPageProps) {
  const navigate = useNavigate()
  const setSession = useAuthStore((state) => state.setSession)
  const [versionInfo, setVersionInfo] = useState<{ version: string; buildTime: string } | null>(null)
  const [tenantName, setTenantName] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const saved = getRememberedCredentials()

  // tenantCode from URL path takes priority, fallback to prop
  const tenantCode = tenantCodeProp || ''

  useEffect(() => {
    versionApi.getVersion().then(setVersionInfo).catch(() => {})
  }, [])

  useEffect(() => {
    // If tenant code is provided, save it and try to resolve tenant name
    if (tenantCode) {
      localStorage.setItem(TENANT_KEY, tenantCode)
      authApi.resolveTenant(tenantCode).then((data: { name: string }) => {
        setTenantName(data.name)
      }).catch(() => {
        setTenantName(null)
      })
    } else {
      // Try to load saved tenant code
      const savedTenantCode = localStorage.getItem(TENANT_KEY)
      if (savedTenantCode) {
        authApi.resolveTenant(savedTenantCode).then((data: { name: string }) => {
          setTenantName(data.name)
        }).catch(() => {
          setTenantName(null)
        })
      } else {
        localStorage.removeItem(TENANT_KEY)
      }
    }
  }, [tenantCode])

  return (
    <div
      className="relative flex min-h-screen items-center justify-end overflow-hidden bg-[#0d1b2a]"
      style={{ backgroundImage: `url(${loginBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      {/* 半透明遮罩 */}
      <div className="pointer-events-none absolute inset-0 bg-[rgba(10,15,24,0.3)]" />

      {/* 登录卡片 - 靠右 */}
      <div
        className="login-container relative z-10 mr-[80px] ml-[20px] w-full max-w-[420px] overflow-hidden rounded-[20px] border border-white/[0.18] bg-[rgba(15,25,35,0.35)] shadow-[0_24px_80px_rgba(0,0,0,0.5),0_0_1px_rgba(255,255,255,0.1)_inset]"
        style={{ backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', animation: 'loginIn 0.6s cubic-bezier(0.4, 0, 0.2, 1)' }}
      >
        {/* Header */}
        <div className="border-b border-white/[0.08] bg-gradient-to-br from-[rgba(45,212,168,0.1)] to-[rgba(26,41,64,0.8)] px-8 pb-11 pt-11 text-center">
          <h1 className="mb-2 text-[26px] font-semibold tracking-[0.03em] text-slate-50">
            野外守望者 <span className="text-[#2dd4a8]">2.0</span>
          </h1>
          {tenantName ? (
            <p className="text-[13px] text-[#2dd4a8]">{tenantName}</p>
          ) : (
            <p className="text-[13px] text-slate-400">野生动物智慧保护监测系统</p>
          )}
        </div>

        {/* Form */}
        <div className="px-8 py-9">
          <Form
            layout="vertical"
            initialValues={{ username: saved.username, password: saved.password, remember: saved.remember }}
            onFinish={async (values) => {
              try {
                setLoading(true)
                const effectiveTenantCode = tenantCode || localStorage.getItem(TENANT_KEY) || ''
                const result = await authApi.login({
                  username: values.username,
                  password: values.password,
                  tenantCode: effectiveTenantCode || undefined,
                })
                if (values.remember) {
                  saveCredentials(values.username, values.password)
                } else {
                  clearCredentials()
                }
                setSession({
                  token: result.token,
                  user: {
                    ...result.user,
                    tenantCode: effectiveTenantCode || result.user.tenantCode,
                  },
                })
                message.success('登录成功')
                navigate('/home')
              } catch (error) {
                const nextMessage = error instanceof Error ? error.message : '登录失败'
                message.error(nextMessage)
              } finally {
                setLoading(false)
              }
            }}
          >
            <div className="mb-[22px]">
              <label className="mb-2 block text-[13px] font-medium text-slate-400">👤 账号</label>
              <Form.Item
                name="username"
                rules={[{ required: true, message: '请输入账号' }]}
                className="!mb-0"
              >
                <Input
                  size="large"
                  placeholder="请输入用户名"
                  className="!rounded-[10px] !border-white/[0.08] !bg-[rgba(15,25,35,0.6)] !text-slate-100 placeholder:!text-slate-500 focus:!border-[#2dd4a8] focus:!shadow-[0_0_0_3px_rgba(45,212,168,0.1)]"
                />
              </Form.Item>
            </div>
            <div className="mb-[22px]">
              <label className="mb-2 block text-[13px] font-medium text-slate-400">🔒 密码</label>
              <Form.Item
                name="password"
                rules={[{ required: true, message: '请输入密码' }]}
                className="!mb-0"
              >
                <Input.Password
                  size="large"
                  placeholder="请输入密码"
                  className="!rounded-[10px] !border-white/[0.08] !bg-[rgba(15,25,35,0.6)] !text-slate-100 placeholder:!text-slate-500 focus:!border-[#2dd4a8] focus:!shadow-[0_0_0_3px_rgba(45,212,168,0.1)]"
                />
              </Form.Item>
            </div>
            <div className="mb-5 flex items-center justify-between">
              <Form.Item name="remember" valuePropName="checked" noStyle>
                <Checkbox className="text-slate-400">记住密码</Checkbox>
              </Form.Item>
              <a className="text-[13px] text-[#2dd4a8] hover:text-[#2dd4a8]/80">忘记密码？</a>
            </div>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              loading={loading}
              className="!h-[44px] !rounded-[10px] !text-[15px] !font-semibold !tracking-[0.05em]"
            >
              登 录
            </Button>
          </Form>
        </div>

        {/* Footer */}
        <div className="border-t border-white/[0.06] bg-[rgba(0,0,0,0.15)] px-8 py-[18px] text-center">
          <p className="mb-1 text-[12px] text-slate-500">野外守望者 - 守护自然，科技赋能</p>
          {versionInfo && (
            <p className="text-[12px] text-slate-600">v{versionInfo.version} · {versionInfo.buildTime}</p>
          )}
        </div>
      </div>

      <style>{`
        @keyframes loginIn {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  )
}