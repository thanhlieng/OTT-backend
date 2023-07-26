import { Spin } from 'antd'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
} from 'lucide-react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { ReactNode } from 'react'
import { useRecoilState } from 'recoil'
import { ProLayout } from '@ant-design/pro-components'
import { LOGO_BLACK_LONG } from '@public'
import { Cmdk, HeaderWrapper } from '@/components'
import { useDevice, useRoutes } from '@/hooks'
import { collapsedSidebarState } from '@/recoil'

type Props = {
  children?: ReactNode
}

export const MainLayout: React.FC<Props> = ({ children }) => {
  const { isMobile } = useDevice()
  const { status } = useSession()
  const { routes } = useRoutes()

  const [collapsedSidebar, setCollapsedSidebar] = useRecoilState(collapsedSidebarState)
  return (
    <ProLayout
      layout="mix"
      logo={LOGO_BLACK_LONG}
      title=""
      collapsed={collapsedSidebar}
      onCollapse={(collapsed) => isMobile && setCollapsedSidebar(collapsed)}
      collapsedButtonRender={() => (
        <div
          onClick={() => setCollapsedSidebar(!collapsedSidebar)}
          className="w-6 h-6 shadow rounded-full flex items-center justify-center absolute top-4 -right-3 z-50 bg-white cursor-pointer"
        >
          {collapsedSidebar ? <ChevronRightIcon size={16} /> : <ChevronLeftIcon size={16} />}
        </div>
      )}
      menu={{
        collapsedShowGroupTitle: true,
      }}
      contentStyle={{
        backgroundColor: '#f6f8fa',
      }}
      headerRender={false}
      fixedHeader
      locale="en-US"
      route={{
        routes,
      }}
      menuItemRender={(menuItemProps, defaultDom) => {
        return <Link href={menuItemProps.path || '/'}>{defaultDom}</Link>
      }}
      menuDataRender={(menuList) => {
        return menuList.map((item) => {
          return {
            ...item,
            icon: item.icon,
            children: item.children,
          }
        })
      }}
    >
      <div className="pt-14">
        <HeaderWrapper />
        <div className="min-h-[calc(100vh-56px)] relative">
          {status === 'unauthenticated' && (
            <div className="absolute top-0 left-0 w-full h-full z-50 bg-white flex items-center justify-center">
              <Spin spinning />
            </div>
          )}
          {children}
        </div>
        <Cmdk />
      </div>
    </ProLayout>
  )
}
