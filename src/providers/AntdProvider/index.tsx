import { App, ConfigProvider } from 'antd'
import enUS from 'antd/locale/en_US'
import { ReactNode } from 'react'

type Props = {
  children?: ReactNode
}

export default ({ children }: Props) => {
  return (
    <ConfigProvider locale={enUS} theme={{ token: { colorPrimary: '#10122f' } }}>
      <App>{children}</App>
    </ConfigProvider>
  )
}
