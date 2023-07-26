import { Button, Modal } from 'antd'
import { Trash2Icon } from 'lucide-react'

type Props = {
  onOk: () => void
}

export const DeteleConfirm: React.FC<Props> = ({ onOk }) => {
  return (
    <Button
      type="text"
      icon={<Trash2Icon size={16} />}
      onClick={() => {
        Modal.confirm({
          title: 'Are you sure?',
          content: 'Do you want to delete this staff?',
          onOk,
          okButtonProps: {
            danger: true,
          },
          cancelButtonProps: {
            className: 'border-primary text-primary',
          },
        })
      }}
    />
  )
}
