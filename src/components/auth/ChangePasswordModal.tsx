import { Form, Input, Modal, message } from 'antd'
import { authApi } from '@/services/api'
import { useAuthStore } from '@/store/auth-store'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'

type ChangePasswordModalProps = {
  open: boolean
  forced?: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function ChangePasswordModal({ open, forced = false, onClose, onSuccess }: ChangePasswordModalProps) {
  const logout = useAuthStore((state) => state.logout)
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()
  const navigate = useNavigate()

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (values.newPassword !== values.confirmPassword) {
        message.error('两次输入的新密码不一致')
        return
      }
      setLoading(true)
      await authApi.changePassword({
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
      })
      message.success('密码修改成功，请重新登录')
      const tenantCode = useAuthStore.getState().user?.tenantCode
        || localStorage.getItem('wild-guardian-tenant-code')
        || ''
      logout()
      navigate(tenantCode ? `/${tenantCode}/login` : '/login', { replace: true })
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      title={forced ? '修改密码' : '修改密码'}
      open={open}
      onOk={handleSubmit}
      onCancel={forced ? undefined : onClose}
      confirmLoading={loading}
      okText="确认修改"
      cancelText={forced ? undefined : '取消'}
      closable={!forced}
      maskClosable={false}
      keyboard={!forced}
      width={440}
    >
      {forced && (
        <p className="mb-4 text-amber-400 text-sm">
          管理员已重置您的密码，请立即修改密码以确保安全。
        </p>
      )}
      <Form form={form} layout="vertical">
        <Form.Item
          name="oldPassword"
          label="原密码"
          rules={[{ required: true, message: '请输入原密码' }]}
        >
          <Input.Password placeholder="请输入原密码" />
        </Form.Item>
        <Form.Item
          name="newPassword"
          label="新密码"
          rules={[
            { required: true, message: '请输入新密码' },
            { min: 6, message: '密码长度不能少于6位' },
          ]}
        >
          <Input.Password placeholder="请输入新密码" />
        </Form.Item>
        <Form.Item
          name="confirmPassword"
          label="确认新密码"
          dependencies={['newPassword']}
          rules={[
            { required: true, message: '请确认新密码' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('newPassword') === value) {
                  return Promise.resolve()
                }
                return Promise.reject(new Error('两次输入的密码不一致'))
              },
            }),
          ]}
        >
          <Input.Password placeholder="请再次输入新密码" />
        </Form.Item>
      </Form>
    </Modal>
  )
}