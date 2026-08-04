import { App as AntApp, ConfigProvider, theme } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { BrowserRouter } from 'react-router-dom'
import { AppRouter } from '@/router'

export default function App() {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#2dd4a8',
          colorInfo: '#2dd4a8',
          colorSuccess: '#2dd4a8',
          colorWarning: '#fbbf24',
          colorError: '#f87171',
          colorBgBase: '#0b141d',
          colorBgContainer: '#101a25',
          colorBgElevated: '#0f1924',
          colorBorder: 'rgba(255, 255, 255, 0.1)',
          colorText: '#e8f0f2',
          colorTextSecondary: '#94a8b8',
          borderRadius: 12,
        },
        components: {
          Layout: {
            bodyBg: 'transparent',
            headerBg: 'transparent',
            siderBg: '#101a25',
          },
          Menu: {
            darkItemBg: 'transparent',
            darkSubMenuItemBg: 'transparent',
            darkItemSelectedBg: 'rgba(45, 212, 168, 0.14)',
            darkItemSelectedColor: '#2dd4a8',
            darkItemColor: '#cbd5e1',
            itemBorderRadius: 10,
          },
          Card: {
            colorBgContainer: 'rgba(20, 32, 45, 0.5)',
          },
          Table: {
            colorBgContainer: 'transparent',
            headerBg: 'transparent',
            rowHoverBg: 'rgba(45, 212, 168, 0.08)',
            borderColor: 'rgba(255, 255, 255, 0.08)',
          },
          Modal: {
            contentBg: '#0f1924',
            headerBg: '#0f1924',
            footerBg: '#0f1924',
          },
          Drawer: {
            colorBgElevated: '#0f1924',
          },
          Input: {
            colorBgContainer: '#101a25',
            activeBorderColor: '#2dd4a8',
            hoverBorderColor: '#2dd4a8',
          },
          Select: {
            selectorBg: '#101a25',
            optionSelectedBg: 'rgba(45, 212, 168, 0.12)',
            optionActiveBg: 'rgba(255, 255, 255, 0.04)',
          },
          DatePicker: {
            activeBorderColor: '#2dd4a8',
            hoverBorderColor: '#2dd4a8',
          },
          Button: {
            defaultBg: '#101a25',
            defaultBorderColor: 'rgba(255, 255, 255, 0.1)',
            defaultColor: '#e8f0f2',
            primaryShadow: 'none',
          },
        },
      }}
    >
      <AntApp>
        <BrowserRouter>
          <AppRouter />
        </BrowserRouter>
      </AntApp>
    </ConfigProvider>
  )
}
