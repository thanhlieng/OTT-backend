import { AddEditPhoneNumber } from '../components'
import { Button, Col, Form, Input, Row, Space, Tag } from 'antd'
import dayjs from 'dayjs'
import { map } from 'lodash'
import { EditIcon, EraserIcon, SearchIcon } from 'lucide-react'
import { useRouter } from 'next/router'
import { useCallback, useMemo, useState } from 'react'
import { PageContainer } from '@ant-design/pro-components'
import { ButtonIcon, Card, Table } from '@/components'
import { usePageDataQuery } from '@/hooks'
import { MainLayout } from '@/layouts'

const PATH_NAME = '/admin/phone-number'

type Datasource = {
  data: any[]
  skip: number
  total: number
}

export const PhoneNumber = () => {
  const router = useRouter()
  const [form] = Form.useForm()
  const [openAddEditPhoneNumber, setOpenAddEditPhoneNumber] = useState(false)
  const [id, setId] = useState<string>()
  const page = useMemo(() => Number(router.query.page || 0), [router.query.page])
  const page_size = useMemo(() => Number(router.query.page_size || 10), [router.query.page_size])
  const search = useMemo(() => router.query.search, [router.query.search])

  const { data: admins, isLoading } = usePageDataQuery({
    url: '/api/phone_numbers/list',
    page,
    page_size,
    dependencies: ['LIST_PHONE_NUMBER', search, page],
    query: {
      ...(search && { search }),
    },
  })

  const onSearch = useCallback(
    (values: { search: string }) => {
      router.push({
        pathname: PATH_NAME,
        query: {
          ...router.query,
          search: values?.search,
        },
      })
    },
    [router]
  )

  const onReset = useCallback(() => {
    router.push({
      pathname: PATH_NAME,
      query: {},
    })
    form.resetFields()
  }, [form, router])

  const onChangePage = useCallback(
    (page: number) => {
      router.push({
        pathname: PATH_NAME,
        query: {
          ...router.query,
          page,
        },
      })
    },
    [router]
  )

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
        title: 'Name',
        dataIndex: 'name',
        key: 'name',
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
        render: (state: string) => <Tag className="uppercase" color={state === 'ACTIVE' ? 'success' : 'error'}>{state}</Tag>,
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
                setId(number)
                setOpenAddEditPhoneNumber(true)
              }}
              icon={<EditIcon size={16} />}
              tooltip="Edit"
            />
          </Space>
        ),
        width: 100,
        fixed: 'right',
        align: 'center',
      },
    ],
    []
  )

  return (
    <MainLayout>
      <PageContainer
        breadcrumb={{
          items: [
            {
              title: 'Home',
              onClick: () => router.push('/'),
              className: 'cursor-pointer',
            },
            {
              title: 'Phone number',
            },
          ],
        }}
        extra={
          <Button type="primary" onClick={() => setOpenAddEditPhoneNumber(true)}>
            Create
          </Button>
        }
      >
        <Form form={form} layout="vertical" onFinish={onSearch}>
          <Row gutter={[8, 16]} className="mb-2">
            <Col span={24} lg={8}>
              <div className="flex items-center">
                <Form.Item name="search" className="mb-0 mr-2 w-full">
                  <Input placeholder="Search by phone number" className="w-full" />
                </Form.Item>
                <Space>
                  <ButtonIcon
                    onClick={onReset}
                    tooltip="Reset"
                    type="default"
                    size="middle"
                    icon={<EraserIcon size={16} />}
                  />
                  <ButtonIcon
                    htmlType="submit"
                    tooltip="Search"
                    type="primary"
                    size="middle"
                    icon={<SearchIcon size={16} />}
                  />
                </Space>
              </div>
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
              onChange: (page) => onChangePage(page - 1),
              total: datasource.total,
              pageSize: page_size,
              showSizeChanger: false,
            }}
          />
        </Card>
      </PageContainer>
      <AddEditPhoneNumber open={openAddEditPhoneNumber} setOpen={setOpenAddEditPhoneNumber} id={id} setId={setId} />
    </MainLayout>
  )
}
