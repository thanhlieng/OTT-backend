import { Col, Form, Input, Row, Select, Space, Switch } from 'antd'
import { map } from 'lodash'
import { EraserIcon, SearchIcon } from 'lucide-react'
import { useRouter } from 'next/router'
import { useCallback, useMemo } from 'react'
import { PageContainer } from '@ant-design/pro-components'
import { ButtonIcon, Card, Table } from '@/components'
import { useActionMutation, usePageDataQuery } from '@/hooks'
import { MainLayout } from '@/layouts'
import { UserRole, UserStatus } from '@/types'

const PATH_NAME = '/admin/users'

type Datasource = {
  data: any[]
  skip: number
  total: number
}

export const Users = () => {
  const router = useRouter()
  const [form] = Form.useForm()
  const page = useMemo(() => Number(router.query.page || 0), [router.query.page])
  const page_size = useMemo(() => Number(router.query.page_size || 10), [router.query.page_size])
  const search = useMemo(() => router.query.search, [router.query.search])

  const { data: users, isLoading } = usePageDataQuery({
    url: '/api/users',
    page,
    page_size,
    dependencies: ['LIST_USER', search, page],
    query: {
      ...(search && { search }),
    },
  })

  const { mutate: onEditUser } = useActionMutation({
    dependencies: ['EDIT_USER'],
    refetchQueries: ['LIST_USER'],
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
      ...users,
      data: map(users?.data, (item) => ({ ...item, key: item?.id })),
    }),
    [users]
  )

  const columns: any = useMemo(
    () => [
      {
        title: 'Avatar',
        dataIndex: 'image',
        key: 'image',
        render: (image: string) => <img src={image} alt="avatar" className="w-10 h-10 rounded-full object-cover" />,
      },
      {
        title: 'Email',
        dataIndex: 'email',
        key: 'email',
      },
      {
        title: 'Role',
        dataIndex: 'role',
        key: 'role',
        render: (role: string, record: any) => (
          <Select
            value={role}
            className="w-40"
            options={[
              {
                label: UserRole.SUPPER_ADMIN,
                value: UserRole.SUPPER_ADMIN,
              },
              {
                label: UserRole.ADMIN,
                value: UserRole.ADMIN,
              },
              {
                label: UserRole.USER,
                value: UserRole.USER,
              },
            ]}
            onChange={(value) => {
              onEditUser({
                url: `/api/users/${record?.id}/role`,
                method: 'PUT',
                data: {
                  role: value,
                },
              })
            }}
          />
        ),
      },
      {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        render: (status: string, record: any) => (
          <Switch
            checked={status === UserStatus.ACTIVED}
            onChange={(checked) => {
              onEditUser({
                url: `/api/users/${record?.id}/status`,
                method: 'PUT',
                data: {
                  status: checked ? UserStatus.ACTIVED : UserStatus.INACTIVE,
                },
              })
            }}
          />
        ),
      },
    ],
    [onEditUser]
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
              title: 'User management',
            },
          ],
        }}
      >
        <Form form={form} layout="vertical" onFinish={onSearch}>
          <Row gutter={[8, 16]} className="mb-2">
            <Col span={24} lg={8}>
              <div className="flex items-center">
                <Form.Item name="search" className="mb-0 mr-2 w-full">
                  <Input placeholder="Search by email" className="w-full" />
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
    </MainLayout>
  )
}
