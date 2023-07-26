import { AddEditGroup, ManageAdmin, ManagePhoneNumber } from '../components'
import { Button, Col, Form, Input, Row, Space } from 'antd'
import dayjs from 'dayjs'
import { map } from 'lodash'
import { EditIcon, EraserIcon, PhoneIcon, SearchIcon, UserPlusIcon } from 'lucide-react'
import { useRouter } from 'next/router'
import { useCallback, useMemo, useState } from 'react'
import { PageContainer } from '@ant-design/pro-components'
import { ButtonIcon, Card, Table } from '@/components'
import { usePageDataQuery } from '@/hooks'
import { MainLayout } from '@/layouts'

const PATH_NAME = '/admin/groups'

type Datasource = {
  data: any[]
  skip: number
  total: number
}

export const Groups = () => {
  const router = useRouter()
  const [form] = Form.useForm()
  const [openManageAdmin, setOpenManageAdmin] = useState(false)
  const [openManagePhoneNumber, setOpenManagePhoneNumber] = useState(false)
  const [openAddEditGroup, setOpenAddEditGroup] = useState(false)
  const [id, setId] = useState<string>()
  const page = useMemo(() => Number(router.query.page || 0), [router.query.page])
  const page_size = useMemo(() => Number(router.query.page_size || 10), [router.query.page_size])
  const search = useMemo(() => router.query.search, [router.query.search])

  const { data: groups, isLoading } = usePageDataQuery({
    url: '/api/groups/list',
    page,
    page_size,
    dependencies: ['LIST_GROUP', search, page],
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
      ...groups,
      data: map(groups?.data, (item) => ({ ...item, key: item?.id })),
    }),
    [groups]
  )

  const columns: any = useMemo(
    () => [
      {
        title: 'Group name',
        dataIndex: 'name',
        key: 'name',
      },
      {
        title: 'Form feedback',
        dataIndex: 'after_call_feedback',
        key: 'after_call_feedback',
        render: (after_call_feedback: string) => (
          <a target="_blank" href={after_call_feedback}>
            {after_call_feedback}
          </a>
        ),
      },
      {
        title: 'Numbers',
        dataIndex: 'numbers',
        key: 'numbers',
      },
      {
        title: 'Updated at',
        dataIndex: 'updated_at',
        key: 'updated_at',
        render: (_: string, record: any) => dayjs(record?.updated_at || record?.created_at).format('DD/MM/YYYY HH:mm'),
      },
      {
        title: '',
        dataIndex: 'id',
        key: 'id',
        render: (id: string) => (
          <Space>
            <ButtonIcon
              onClick={() => {
                setId(id)
                setOpenManageAdmin(true)
              }}
              icon={<UserPlusIcon size={16} />}
              tooltip="Manage admin"
            />
            <ButtonIcon
              onClick={() => {
                setId(id)
                setOpenManagePhoneNumber(true)
              }}
              icon={<PhoneIcon size={16} />}
              tooltip="Manage phone number"
            />
            <ButtonIcon
              onClick={() => {
                setId(id)
                setOpenAddEditGroup(true)
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
              title: 'Group management',
            },
          ],
        }}
        extra={
          <Button type="primary" onClick={() => setOpenAddEditGroup(true)}>
            Create
          </Button>
        }
      >
        <Form form={form} layout="vertical" onFinish={onSearch}>
          <Row gutter={[8, 16]} className="mb-2">
            <Col span={24} lg={8}>
              <div className="flex items-center">
                <Form.Item name="search" className="mb-0 mr-2 w-full">
                  <Input placeholder="Search by name" className="w-full" />
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
      <ManageAdmin open={openManageAdmin} setOpen={setOpenManageAdmin} id={id} />
      <ManagePhoneNumber open={openManagePhoneNumber} setOpen={setOpenManagePhoneNumber} id={id} />
      <AddEditGroup open={openAddEditGroup} setOpen={setOpenAddEditGroup} id={id} setId={setId} />
    </MainLayout>
  )
}
