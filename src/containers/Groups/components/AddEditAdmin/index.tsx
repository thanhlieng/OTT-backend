import { Button, Col, Form, Input, Row, Space } from 'antd'
import { useCallback } from 'react'
import { Drawer } from '@/components'
import { useActionMutation, useDevice } from '@/hooks'

type Props = {
  open: boolean
  setOpen: (open: boolean) => void
  id?: string
  setId?: (id?: string) => void
}

export const AddEditAdmin: React.FC<Props> = ({ open, setOpen, id, setId }) => {
  const { isMobile } = useDevice()
  const [form] = Form.useForm()
  const { mutate: onAddAdmin } = useActionMutation({
    dependencies: ['ADD_ADMIN'],
    refetchQueries: ['LIST_ADMIN'],
  })

  const onReset = useCallback(() => {
    setOpen(false)
    setId && setId(undefined)
    form.resetFields()
  }, [form, setId, setOpen])

  const onSubmit = useCallback(() => {
    form.submit()
    form.validateFields().then(async (values: { email: string }) => {
      onAddAdmin({
        url: `/api/groups/${id}/add_admin`,
        method: 'POST',
        data: values,
      })
      onReset()
    })
  }, [form, id, onAddAdmin, onReset])

  return (
    <Drawer
      maskClosable={false}
      title="Add new admin"
      onClose={onReset}
      open={open}
      width={isMobile ? '100%' : 500}
      extra={
        <Space>
          <Button onClick={onReset}>Cancel</Button>
          <Button onClick={onSubmit} type="primary">
            Submit
          </Button>
        </Space>
      }
    >
      <Form layout="vertical" form={form}>
        <Row>
          <Col span={24}>
            <Form.Item name="email" label="Email" rules={[{ required: true, message: 'Field required!' }]}>
              <Input placeholder="Enter email" />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Drawer>
  )
}
