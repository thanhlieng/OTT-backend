import { Button, Col, Form, Input, Checkbox, Row, Space, Typography } from 'antd'
import { useCallback, useEffect } from 'react'
import { Drawer } from '@/components'
import { useActionMutation, useDevice, usePageDataQuery } from '@/hooks'

type Props = {
  open: boolean
  setOpen: (open: boolean) => void
  id?: string
  setId?: (id?: string) => void
}

export const AddEditGroup: React.FC<Props> = ({ open, setOpen, id, setId }) => {
  const { isMobile } = useDevice()
  const [form] = Form.useForm()
  const { data: group } = usePageDataQuery({
    url: `/api/groups/one/${id}`,
    dependencies: ['ONE_GROUP', id || ''],
    enabled: !!id && !!open,
  })
  const { mutate: onAddGroup } = useActionMutation({
    dependencies: ['ADD_GROUP'],
    refetchQueries: ['LIST_GROUP'],
  })
  const { mutate: onEditGroup } = useActionMutation({
    dependencies: ['EDIT_GROUP'],
    refetchQueries: ['LIST_GROUP'],
  })

  useEffect(() => {
    if (id) {
      form.setFieldsValue({ ...group })
    }
  }, [form, group, id])

  const onReset = useCallback(() => {
    setOpen(false)
    setId && setId(undefined)
    form.resetFields()
  }, [form, setId, setOpen])

  const onSubmit = useCallback(() => {
    form.submit()
    form.validateFields().then(async (values: { 
      name: string; 
      after_call_feedback?: string, 
      bluesea_api?: string,
      bluesea_gateway?: string,
      bluesea_token?: string,
      bluesea_record?: boolean,
    }) => {
      if (id) {
        onEditGroup({
          url: `/api/groups/${id}`,
          method: 'PUT',
          data: values,
        })
      } else {
        onAddGroup({
          url: '/api/groups',
          method: 'POST',
          data: values,
        })
      }
      onReset()
    })
  }, [form, id, onAddGroup, onReset, onEditGroup])

  return (
    <Drawer
      maskClosable={false}
      title={id ? 'Update' : 'Create'}
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
            <Form.Item name="name" label="Group name" rules={[{ required: true, message: 'Field required!' }]}>
              <Input placeholder="Enter group name" />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item name="after_call_feedback" label="Form feedback url">
              <Input placeholder="https://form-url.example" />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item name="bluesea_api" label="Bluesea API">
              <Input placeholder="https://api.bluesea.live" />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item name="bluesea_gateway" label="Bluesea Gateway">
              <Input placeholder="https://gateway.bluesea.live" />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item name="bluesea_token" label="Bluesea Token">
              <Input placeholder="Token here" />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item name="bluesea_record" valuePropName='checked' label="Bluesea Enable Record">
              <Checkbox name='bluesea_record'/>
            </Form.Item>
          </Col>
          {id && <Col span={24}>
            <Form.Item label="Bluesea Hook Endpoint">
              <Typography.Paragraph className='border rounded p-2' copyable>{group?.hook}</Typography.Paragraph>
            </Form.Item>
          </Col>}
        </Row>
      </Form>
    </Drawer>
  )
}
