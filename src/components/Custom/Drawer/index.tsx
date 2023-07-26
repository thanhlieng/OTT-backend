import { Drawer as DrawerAntd, DrawerProps } from 'antd'
import { XIcon } from 'lucide-react'
import { useDevice } from '@/hooks'

type Props = {
  children?: React.ReactNode
} & DrawerProps

export const Drawer: React.FC<Props> = ({ children, ...props }) => {
  const { isMobile } = useDevice()
  return (
    <DrawerAntd width={isMobile ? '100%' : props.width} closeIcon={<XIcon size={16} />} {...props}>
      {children}
    </DrawerAntd>
  )
}
