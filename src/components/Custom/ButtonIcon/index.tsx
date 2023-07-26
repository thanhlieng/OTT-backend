import { Button, ButtonProps, Tooltip } from 'antd'
import classNames from 'classnames'

type Props = {
  icon?: React.ReactNode
  tooltip?: string
} & ButtonProps

export const ButtonIcon: React.FC<Props> = ({ icon, tooltip, className, ...props }) => {
  return (
    <Tooltip title={tooltip}>
      <Button
        type="text"
        size="small"
        icon={icon}
        className={classNames('flex items-center justify-center', className)}
        {...props}
      />
    </Tooltip>
  )
}
