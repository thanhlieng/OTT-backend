import { Button, Col, Form, Input, Row, Select, Space, Switch } from 'antd'
import { map } from 'lodash'
import { useCallback, useEffect } from 'react'
import { Drawer } from '@/components'
import { useActionMutation, useDevice, usePageDataQuery } from '@/hooks'

type Props = {
  open: boolean
  setOpen: (open: boolean) => void
  id?: string
  setId?: (id?: string) => void
}

const PAGE_SIZE = 10000

export const AddEditPhoneNumber: React.FC<Props> = ({ open, setOpen, id, setId }) => {
  const { isMobile } = useDevice()
  const [form] = Form.useForm()
  const { data: groups } = usePageDataQuery({
    url: '/api/groups/list',
    page: 0,
    page_size: PAGE_SIZE,
    dependencies: ['LIST_GROUP'],
  })
  const { data: phoneNumber } = usePageDataQuery({
    url: `/api/phone_numbers/one/${id}`,
    dependencies: ['ONE_PHONE_NUMBER', id || ''],
    enabled: !!id && !!open,
  })
  const { mutate: onAddPhoneNumber } = useActionMutation({
    dependencies: ['ADD_PHONE_NUMBER'],
    refetchQueries: ['LIST_PHONE_NUMBER'],
  })
  const { mutate: onEditPhoneNumber } = useActionMutation({
    dependencies: ['EDIT_PHONE_NUMBER'],
    refetchQueries: ['LIST_PHONE_NUMBER'],
  })

  useEffect(() => {
    if (id) {
      form.setFieldsValue({ ...phoneNumber })
    }
  }, [form, phoneNumber, id])

  const onReset = useCallback(() => {
    setOpen(false)
    setId && setId(undefined)
    form.resetFields()
  }, [form, setId, setOpen])

  const onSubmit = useCallback(() => {
    form.submit()
    form.validateFields().then(async (values: any) => {
      if (id) {
        onEditPhoneNumber({
          url: `/api/phone_numbers/${id}`,
          method: 'PUT',
          data: {
            ...values,
            manage_by: values.manage_by?.split('___')?.[0],
            groups: map(values.groups, (item) => item?.split('___')?.[0]),
          },
        })
      } else {
        onAddPhoneNumber({
          url: `/api/phone_numbers`,
          method: 'POST',
          data: {
            ...values,
            manage_by: values.manage_by?.split('___')?.[0],
            groups: map(values.groups, (item) => item?.split('___')?.[0]),
          },
        })
      }
      onReset()
    })
  }, [form, id, onAddPhoneNumber, onEditPhoneNumber, onReset])

  return (
    <Drawer
      maskClosable={false}
      title={id ? 'Edit number' : 'Add new number'}
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
      <Form
        layout="vertical"
        form={form}
        initialValues={{
          state: 'ACTIVE',
        }}
      >
        <Row>
          <Col span={24}>
            <Form.Item name="number" label="Phone number" rules={[{ required: true, message: 'Field required!' }]}>
              <Input placeholder="Enter phone number" disabled={!!id} />
            </Form.Item>
            <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Field required!' }]}>
              <Input placeholder="Enter name" />
            </Form.Item>
            <Form.Item name="password" label="Password" rules={[{ required: true, message: 'Field required!' }]}>
              <Input placeholder="" />
            </Form.Item>
            {id && (
              <>
                <Form.Item name="alias_for_number" label="Alias for">
                  <Input placeholder="" />
                </Form.Item>
                <Form.Item name="sip_in" label="SIP call in" valuePropName="checked">
                  <Switch />
                </Form.Item>
                <Form.Item name="sip_out" label="SIP call out" valuePropName="checked">
                  <Switch />
                </Form.Item>
                <Form.Item name="avatar" label="Avatar link">
                  <Input placeholder="" />
                </Form.Item>
                <Form.Item name="state" label="State">
                  <Select
                    options={[
                      {
                        label: 'Active',
                        value: 'ACTIVE',
                      },
                      {
                        label: 'Suspended',
                        value: 'SUSPENDED',
                      },
                    ]}
                  />
                </Form.Item>
                {/* TODO: save theo id group */}
                <Form.Item name="manage_by" label="Manage by">
                  <Select
                    allowClear
                    options={map(groups?.data, (group, index) => ({
                      label: group.name,
                      value: `${group.name}___${index}`,
                    }))}
                  />
                </Form.Item>
                <Form.Item name="groups" label="Groups">
                  <Select
                    allowClear
                    mode="multiple"
                    options={map(groups?.data, (group, index) => ({
                      label: group.name,
                      value: `${group.name}___${index}`,
                    }))}
                  />
                </Form.Item>
              </>
            )}
          </Col>
        </Row>
      </Form>
    </Drawer>
  )
}
