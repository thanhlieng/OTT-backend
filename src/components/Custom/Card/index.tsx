import { Card as CardAntd, CardProps } from 'antd'
import classNames from 'classnames'

type Props = {
  children?: React.ReactNode
} & CardProps

export const Card: React.FC<Props> = ({ children, className, ...props }) => {
  return (
    <CardAntd size="small" className={classNames('shadow-sm border-LinkWater', className)} {...props}>
      {children}
    </CardAntd>
  )
}
