import { AddEditPhoneNumber } from '../AddEditPhoneNumber'
import { Button, Col, Form, Input, Row, Space, Tag } from 'antd'
import dayjs from 'dayjs'
import { map } from 'lodash'
import { EditIcon, EraserIcon, ForwardIcon, SearchIcon, Trash2Icon } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { ButtonIcon, Card, Drawer, Table, useApp } from '@/components'
import { useActionMutation, useDevice, usePageDataQuery } from '@/hooks'

type Props = {
  open: boolean
  setOpen: (open: boolean) => void
  id?: string
}

const PAGE_SIZE = 10

type Datasource = {
  data: any[]
  skip: number
  total: number
}

export const ManagePhoneNumber: React.FC<Props> = ({ open, setOpen, id }) => {
  const { isMobile } = useDevice()
  const [form] = Form.useForm()
  const { modal } = useApp()
  const [openAddEditPhoneNumber, setOpenAddEditPhoneNumber] = useState(false)
  const [page, setPage] = useState(0)
  const [idPhoneNumber, setIdPhoneNumber] = useState<string>()
  const [search, setSearch] = useState<string>()

  const { data: admins, isLoading } = usePageDataQuery({
    url: `/api/groups/${id}/numbers`,
    page,
    page_size: PAGE_SIZE,
    dependencies: ['LIST_PHONE_NUMBER_GROUP', id, search, page],
    enabled: !!id && !!open,
    query: {
      ...(search && { search }),
    },
  })
  const { mutate: onDelPhoneNumber } = useActionMutation({
    dependencies: ['DEL_PHONE_NUMBER_GROUP'],
    refetchQueries: ['LIST_PHONE_NUMBER_GROUP'],
  })
  const { mutate: onManagePhoneNumber } = useActionMutation({
    dependencies: ['MANAGE_PHONE_NUMBER_GROUP'],
    refetchQueries: ['LIST_PHONE_NUMBER_GROUP'],
  })

  const onSearch = useCallback((values: { search: string }) => {
    setSearch(values.search)
  }, [])

  const onReset = useCallback(() => {
    setSearch(undefined)
    form.resetFields()
  }, [form])

  const datasource: Datasource = useMemo(
    () => ({
      ...admins,
      data: map(admins?.data, (item) => ({ ...item, key: item?.number })),
    }),
    [admins]
  )

  const columns: any = useMemo(
    () => [
      {
        title: 'Number',
        dataIndex: 'number',
        key: 'number',
      },
      {
        title: 'Tokens',
        dataIndex: 'push_tokens',
        key: 'push_tokens',
      },
      {
        title: 'Alias',
        dataIndex: 'alias_for_number',
        key: 'alias_for_number',
      },
      {
        title: 'Number',
        dataIndex: 'number',
        key: 'number',
      },
      {
        title: 'Manage by',
        dataIndex: 'manage_by',
        key: 'manage_by',
      },
      {
        title: 'Groups',
        dataIndex: 'groups',
        key: 'groups',
        render: (groups: any[]) => map(groups).join(', '),
      },
      {
        title: 'State',
        dataIndex: 'state',
        key: 'state',
        render: (state: string) => (
          <Tag className="uppercase" color={state === 'ACTIVE' ? 'success' : 'error'}>
            {state}
          </Tag>
        ),
      },
      {
        title: 'Updated at',
        dataIndex: 'updated_at',
        key: 'updated_at',
        render: (_: string, record: any) => dayjs(record?.updated_at || record?.created_at).format('DD/MM/YYYY HH:mm'),
      },
      {
        title: '',
        dataIndex: 'number',
        key: 'number',
        render: (number: any) => (
          <Space>
            <ButtonIcon
              onClick={() => {
                onManagePhoneNumber({
                  url: `/api/groups/${id}/manage_number`,
                  method: 'POST',
                  data: {
                    number,
                  },
                })
              }}
              icon={<ForwardIcon size={16} />}
              tooltip="Manage"
            />
            <ButtonIcon
              onClick={() => {
                setIdPhoneNumber(number)
                setOpenAddEditPhoneNumber(true)
              }}
              icon={<EditIcon size={16} />}
              tooltip="Edit"
            />
            <ButtonIcon
              onClick={() => {
                modal.confirm({
                  title: 'Are you sure to delete?',
                  onOk: () => {
                    onDelPhoneNumber({
                      url: `/api/groups/${id}/delete_number`,
                      method: 'POST',
                      data: {
                        number,
                      },
                    })
                  },
                })
              }}
              icon={<Trash2Icon size={16} />}
              tooltip="Delete"
            />
          </Space>
        ),
        width: 100,
        fixed: 'right',
        align: 'center',
      },
    ],
    [id, modal, onDelPhoneNumber, onManagePhoneNumber]
  )

  return (
    <Drawer
      maskClosable={false}
      title="Manage phone number"
      onClose={() => setOpen(false)}
      open={open}
      width={isMobile ? '100%' : '70%'}
      extra={
        <Button type="primary" onClick={() => setOpenAddEditPhoneNumber(true)}>
          Add new
        </Button>
      }
    >
      <Form form={form} layout="vertical" onFinish={onSearch}>
        <Row gutter={[8, 16]} className="mb-2">
          <Col span={24} lg={12}>
            <Form.Item name="search" className="mb-0">
              <Input placeholder="Search by phone number" />
            </Form.Item>
          </Col>
          <Col>
            <Space>
              <ButtonIcon onClick={onReset} tooltip="Reset" type="default" size="middle" icon={<EraserIcon size={16} />} />
              <ButtonIcon htmlType="submit" tooltip="Search" type="primary" size="middle" icon={<SearchIcon size={16} />} />
            </Space>
          </Col>
        </Row>
      </Form>
      <Card>
        <Table
          loading={isLoading}
          size="small"
          dataSource={datasource.data}
          columns={columns}
          pagination={{
            current: page + 1,
            onChange: (page) => setPage(page - 1),
            total: datasource.total,
            pageSize: 10,
            showSizeChanger: false,
          }}
        />
      </Card>
      <AddEditPhoneNumber
        open={openAddEditPhoneNumber}
        setOpen={setOpenAddEditPhoneNumber}
        idPhoneNumber={idPhoneNumber}
        setIdPhoneNumber={setIdPhoneNumber}
        idGroup={id}
      />
    </Drawer>
  )
}
