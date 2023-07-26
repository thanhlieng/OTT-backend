import { AddEditAdmin } from '..'
import { Button, Space } from 'antd'
import dayjs from 'dayjs'
import { map } from 'lodash'
import { Trash2Icon } from 'lucide-react'
import { useMemo, useState } from 'react'
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

export const ManageAdmin: React.FC<Props> = ({ open, setOpen, id }) => {
  const { isMobile } = useDevice()
  const { modal } = useApp()
  const [openAddEditAdmin, setOpenAddEditAdmin] = useState(false)
  const [page, setPage] = useState(0)
  const { data: groupAdmins } = usePageDataQuery({
    url: `/api/groups/${id}/admins`,
    page,
    page_size: PAGE_SIZE,
    dependencies: ['LIST_ADMIN', id || ''],
    enabled: !!id && !!open,
  })
  const { mutate: onDelAdmin } = useActionMutation({
    dependencies: ['DEL_ADMIN'],
    refetchQueries: ['LIST_ADMIN'],
  })

  const datasource: Datasource = useMemo(
    () => ({
      ...groupAdmins,
      data: map(groupAdmins?.data, (item) => ({ ...item, key: item?.id })),
    }),
    [groupAdmins]
  )

  const columns: any = useMemo(
    () => [
      {
        title: 'Admin',
        dataIndex: 'email',
        key: 'email',
      },
      {
        title: 'Assigned by',
        dataIndex: 'assigned_by',
        key: 'assigned_by',
      },
      {
        title: 'Assigned at',
        dataIndex: 'assigned_at',
        key: 'assigned_at',
        render: (_: string, record: any) => dayjs(record?.assigned_at).format('DD/MM/YYYY HH:mm'),
      },
      {
        title: '',
        dataIndex: 'action',
        key: 'action',
        render: (_: any, record: any) => (
          <Space>
            <ButtonIcon
              onClick={() => {
                modal.confirm({
                  title: 'Are you sure to delete?',
                  onOk: () => {
                    onDelAdmin({
                      url: `/api/groups/${id}/delete_admin`,
                      method: 'POST',
                      data: {
                        email: record?.email,
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
    [id, modal, onDelAdmin]
  )

  return (
    <Drawer
      maskClosable={false}
      title="Manage admin"
      onClose={() => setOpen(false)}
      open={open}
      width={isMobile ? '100%' : '70%'}
      extra={
        <Button type="primary" onClick={() => setOpenAddEditAdmin(true)}>
          Add new
        </Button>
      }
    >
      <Card>
        <Table
          size="small"
          dataSource={datasource.data}
          columns={columns}
          pagination={{
            current: page + 1,
            onChange: (page) => setPage(page - 1),
          }}
        />
      </Card>
      <AddEditAdmin open={openAddEditAdmin} setOpen={setOpenAddEditAdmin} id={id} />
    </Drawer>
  )
}
