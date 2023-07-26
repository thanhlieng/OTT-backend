import { Details } from '../components'
import { Button, Col, DatePicker, Form, Input, Modal, Row, Space, Tag } from 'antd'
import dayjs, { Dayjs } from 'dayjs'
import { map } from 'lodash'
import { EraserIcon, InfoIcon, SearchIcon } from 'lucide-react'
import { useRouter } from 'next/router'
import { useCallback, useMemo, useState } from 'react'
import { PageContainer } from '@ant-design/pro-components'
import { ButtonIcon, Card, Table } from '@/components'
import { usePageDataQuery } from '@/hooks'
import { MainLayout } from '@/layouts'
import { downloadCsv, formatDate } from '@/utils'

const PATH_NAME = '/admin/room-call-logs'

type Datasource = {
  data: any[]
  skip: number
  total: number
}

export const RoomCallLogs = () => {
  const router = useRouter()
  const [form] = Form.useForm()
  const [openDetailsId, setOpenDetailsId] = useState<string | null>(null)
  const [openDatePicker, setOpenDatePicker] = useState(false)
  const [selectedDates, setSelectedDates] = useState<[Dayjs, Dayjs]>([dayjs(), dayjs()])
  const page = useMemo(() => Number(router.query.page || 0), [router.query.page])
  const page_size = useMemo(() => Number(router.query.page_size || 10), [router.query.page_size])
  const search = useMemo(() => router.query.search, [router.query.search])

  const { data: roomCallLogs, isLoading } = usePageDataQuery({
    url: '/api/rooms',
    page,
    page_size,
    dependencies: ['LIST_ROOM_CALL_LOG', search, page],
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
      ...roomCallLogs,
      data: map(roomCallLogs?.data, (item) => ({ ...item, key: item?.id })),
    }),
    [roomCallLogs]
  )

  const onExport = useCallback(() => {
    const file_name = `room_call_logs_${selectedDates?.[0]?.toISOString()}_${selectedDates?.[1]?.toISOString()}.csv`
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    downloadCsv(
      file_name,
      `/api/rooms/exports/csv?begin=${selectedDates?.[0]?.valueOf()}&end=${selectedDates?.[1]?.valueOf()}&timezone=${timezone}`
    )
    setOpenDatePicker(false)
  }, [selectedDates])

  const columns: any = useMemo(
    () => [
      {
        title: 'ID',
        dataIndex: 'id',
        key: 'id',
      },
      {
        title: 'Started at',
        dataIndex: 'started_at',
        key: 'started_at',
        render: (_: string, record: any) => formatDate(record?.started_at || record?.created_at),
      },
      {
        title: 'Ended at',
        dataIndex: 'ended_at',
        key: 'ended_at',
        render: (_: string, record: any) => formatDate(record?.ended_at),
      },
      {
        title: 'From',
        dataIndex: 'from',
        key: 'from',
        render: (from: any) => from?.number,
      },
      {
        title: 'From-Mos',
        dataIndex: 'from',
        key: 'from',
        render: (from: any) => from?.mos?.toFixed(2),
      },
      {
        title: 'To',
        dataIndex: 'to',
        key: 'to',
        render: (to: any) => <div className="break-words">{to?.number}</div>,
        width: 400,
      },
      {
        title: 'To-Mos',
        dataIndex: 'to',
        key: 'to',
        render: (to: any) => to?.mos?.toFixed(2),
      },
      {
        title: 'State',
        dataIndex: 'state',
        key: 'state',
        render: (state: string) => (
          <Tag className="uppercase" color={state === 'answered' ? 'success' : 'error'}>
            {state}
          </Tag>
        ),
      },
      {
        title: 'Connect time',
        dataIndex: 'connect_time',
        key: 'connect_time',
        render: (connect_time: number) => connect_time / 1000,
      },
      {
        title: 'Duration',
        dataIndex: 'duration',
        key: 'duration',
        render: (duration: number) => duration / 1000,
      },
      {
        title: '',
        dataIndex: 'id',
        key: 'id',
        render: (id: any) => (
          <Space>
            <ButtonIcon
              onClick={() => {
                setOpenDetailsId(id)
              }}
              icon={<InfoIcon size={16} />}
              tooltip="Details"
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
              title: 'Room call logs',
            },
          ],
        }}
        extra={
          <Button
            type="primary"
            onClick={() => {
              setOpenDatePicker(true)
            }}
          >
            Export
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
      <Modal
        title="Select date range"
        open={openDatePicker}
        onCancel={() => setOpenDatePicker(false)}
        onOk={() => onExport()}
      >
        <DatePicker.RangePicker
          className="w-full"
          format="DD/MM/YYYY"
          value={selectedDates}
          onChange={(values) => setSelectedDates(values as any)}
        />
      </Modal>
      <Details open={!!openDetailsId} onClosed={() => setOpenDetailsId(null)} id={openDetailsId} />
    </MainLayout>
  )
}
