import { App } from 'antd'

export const useApp = () => {
  const { modal, notification, message } = App.useApp()
  return {
    modal,
    notification,
    message,
  }
}
