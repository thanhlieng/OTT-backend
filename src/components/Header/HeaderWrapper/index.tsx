import { Avatar, Button, Divider, Dropdown, Space, Typography } from 'antd'
import classnames from 'classnames'
import { CommandIcon, MenuIcon } from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'
import Link from 'next/link'
import { useEffect } from 'react'
import { useRecoilState, useSetRecoilState } from 'recoil'
import { LOGO_BLACK_LONG } from '@public/index'
import { useDevice } from '@/hooks'
import { collapsedSidebarState, openCmdkState } from '@/recoil'

type Props = {}

export const HeaderWrapper: React.FC<Props> = () => {
  const { isMobile } = useDevice()
  const setOpenCmdk = useSetRecoilState(openCmdkState)
  const [collapsedSidebar, setCollapsedSidebar] = useRecoilState(collapsedSidebarState)
  const { data: session, status } = useSession()

  useEffect(() => {
    status === 'unauthenticated' &&
      signOut({
        callbackUrl: '/auth/login',
      })
  }, [status])

  return (
    <div className="flex bg-white h-14 items-center px-4 justify-between border-b border-b-LinkWater w-full fixed top-0 right-0 z-50">
      <Space>
        <Button
          onClick={() => {
            setCollapsedSidebar(!collapsedSidebar)
          }}
          type="text"
          icon={<MenuIcon size={16} />}
          className="flex items-center justify-center md:hidden"
        />
        <div className="mr-4">
          <Link href="/">
            <img src={LOGO_BLACK_LONG} alt="bluesea" className={classnames(isMobile ? 'h-4' : 'h-8')} />
          </Link>
        </div>
      </Space>
      <Space>
        <div
          onClick={() => setOpenCmdk(true)}
          className="border border-LinkWater flex items-center justify-center px-3 py-1 rounded cursor-pointer hover:bg-CatskillWhite"
        >
          <Typography.Text className="text-gray-800 text-xs mr-8">Search...</Typography.Text>
          <kbd className="flex items-center text-xs border rounded bg-CatskillWhite p-[2px] ml-2">
            <CommandIcon size={12} className="mr-1" />
            <span>K</span>
          </kbd>
        </div>
        <Divider type="vertical" />
        <Dropdown
          menu={{
            items: [
              {
                key: '0',
                label: (
                  <div>
                    <div className="text-gray-800 text-xs">Signed in as</div>
                    <div className="text-gray-800 font-semibold">{session?.user?.name}</div>
                  </div>
                ),
                disabled: true,
              },
              {
                type: 'divider',
              },
              {
                key: '1',
                label: 'Logout',
                onClick: () => {
                  signOut({
                    callbackUrl: '/auth/login',
                  })
                },
              },
            ],
          }}
        >
          <Avatar size={20} src={session?.user?.image} className="bg-primary border-gray-200 cursor-pointer">
            <span className="font-bold uppercase">{session?.user?.email?.split('')?.[0]}</span>
          </Avatar>
        </Dropdown>
      </Space>
    </div>
  )
}
