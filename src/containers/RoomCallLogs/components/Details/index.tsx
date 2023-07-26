import { Col, Divider, Row, Space, Tag, Typography } from 'antd'
import { map } from 'lodash'
import { Fragment } from 'react'
import ReactPlayer from 'react-player'
import { Card, Drawer } from '@/components'
import { useDevice, usePageDataQuery } from '@/hooks'
import { formatDate } from '@/utils'

type Props = {
  open: boolean
  onClosed: () => void
  id?: string | null
}

export const Details: React.FC<Props> = ({ open, onClosed, id }) => {
  const { isMobile } = useDevice()
  const { data: phoneNumber } = usePageDataQuery({
    url: `/api/rooms/${id}`,
    dependencies: ['ONE_PHONE_NUMBER', id],
    enabled: !!id && !!open,
  })

  return (
    <Drawer maskClosable={false} title="Details" onClose={() => onClosed()} open={open} width={isMobile ? '100%' : '70%'}>
      <Card>
        <Row gutter={[16, 16]}>
          <Col span={24} lg={4}>
            <div className="text-left md:text-right font-semibold">ID:</div>
          </Col>
          <Col span={24} lg={20}>
            <Typography.Paragraph className="mb-0 whitespace-pre-wrap">{phoneNumber?.id}</Typography.Paragraph>
          </Col>
          <Col span={24} lg={4}>
            <div className="text-left md:text-right font-semibold">Record Path:</div>
          </Col>
          <Col span={24} lg={20}>
            <Typography.Paragraph className="mb-0 whitespace-pre-wrap">{phoneNumber?.record_path}</Typography.Paragraph>
          </Col>
          <Col span={24} lg={4}>
            <div className="text-left md:text-right font-semibold">Record URI:</div>
          </Col>
          <Col span={24} lg={20}>
            <Typography.Paragraph className="mb-0 whitespace-pre-wrap">{phoneNumber?.record_uri}</Typography.Paragraph>
          </Col>
          <Col span={24} lg={4}>
            <div className="text-left md:text-right font-semibold">Compose:</div>
          </Col>
          <Col span={24} lg={20}>
            <Typography.Paragraph className="mb-0 whitespace-pre-wrap">
              {phoneNumber?.compose_url || phoneNumber?.compose_job_id}
            </Typography.Paragraph>
          </Col>
          <Col span={24}>
            {phoneNumber?.compose_url && (
              <ReactPlayer
                width="100%"
                height={70}
                controls={true}
                url={phoneNumber?.compose_url}
                config={{ file: { forceHLS: true } }}
              />
            )}
          </Col>
        </Row>
      </Card>
      {map(phoneNumber?.calls, (callLog) => (
        <Card className="mt-4" key={callLog?.id}>
          <Row gutter={[16, 16]}>
            <Col span={24} lg={4}>
              <div className="text-left md:text-right font-semibold">CallId:</div>
            </Col>
            <Col span={24} lg={20}>
              <Typography.Paragraph className="mb-0 whitespace-pre-wrap">{callLog?.id}</Typography.Paragraph>
            </Col>
            <Col span={24} lg={4}>
              <div className="text-left md:text-right font-semibold">From:</div>
            </Col>
            <Col span={24} lg={20}>
              <Typography.Paragraph className="mb-0 whitespace-pre-wrap">{callLog?.from_number}</Typography.Paragraph>
            </Col>
            <Col span={24} lg={4}>
              <div className="text-left md:text-right font-semibold">To:</div>
            </Col>
            <Col span={24} lg={20}>
              <Typography.Paragraph className="mb-0 whitespace-pre-wrap">{callLog?.to_number}</Typography.Paragraph>
            </Col>
          </Row>
          {map(callLog?.sessions, (session) => (
            <Fragment key={session?.id}>
              <Divider className="my-2" />
              <div className="mt-4">
                <Row gutter={[16, 16]}>
                  <Col span={24} lg={4}>
                    <div className="text-left md:text-right font-semibold">Number:</div>
                  </Col>
                  <Col span={24} lg={20}>
                    <Typography.Paragraph className="mb-0 whitespace-pre-wrap">{session?.number}</Typography.Paragraph>
                  </Col>
                  <Col span={24} lg={4}>
                    <div className="text-left md:text-right font-semibold">IP:</div>
                  </Col>
                  <Col span={24} lg={20}>
                    <Typography.Paragraph className="mb-0 whitespace-pre-wrap">{session?.ip}</Typography.Paragraph>
                  </Col>
                  <Col span={24} lg={4}>
                    <div className="text-left md:text-right font-semibold">User-Agent:</div>
                  </Col>
                  <Col span={24} lg={20}>
                    <Typography.Paragraph className="mb-0 whitespace-pre-wrap">{session?.user_agent}</Typography.Paragraph>
                  </Col>
                  <Col span={24} lg={4}>
                    <div className="text-left md:text-right font-semibold">Device:</div>
                  </Col>
                  <Col span={24} lg={20}>
                    {map(session?.hook_logs.splice(0, 1), (hookLog) => (
                      <Tag color="red">{`${hookLog?.device} | ${hookLog?.network} | ${hookLog?.os_name} | ${hookLog?.os_version}`}</Tag>
                    ))}
                  </Col>
                  <Col span={24} lg={4}>
                    <div className="text-left md:text-right font-semibold">Joined at:</div>
                  </Col>
                  <Col span={24} lg={20}>
                    {formatDate(session?.joined_at)}
                  </Col>
                  <Col span={24} lg={4}>
                    <div className="text-left md:text-right font-semibold">Leaved at:</div>
                  </Col>
                  <Col span={24} lg={20}>
                    {formatDate(session?.leaved_at)}
                  </Col>
                  <Col span={24} lg={4}>
                    <div className="text-left md:text-right font-semibold">Quality:</div>
                  </Col>
                  <Col span={24} lg={20}>
                    <Space wrap>
                      <Tag color="blue">
                        MOS:{' '}
                        {session?.mos_min != null
                          ? `${session?.mos_min?.toFixed(2)} | ${session?.mos?.toFixed(2)} | ${session?.mos_max?.toFixed(2)}`
                          : 'N/A'}
                      </Tag>
                      <Tag color="cyan">
                        Rtt:{' '}
                        {session?.rtt_min != null
                          ? `${session?.rtt_min?.toFixed(2)} | ${session?.rtt.toFixed(2)} | ${session?.rtt_max.toFixed(2)}`
                          : 'N/A'}
                      </Tag>
                      <Tag color="gold">
                        Jitter:{' '}
                        {session?.jitter_min != null
                          ? `${session?.jitter_min.toFixed(2)} | ${session?.jitter.toFixed(
                              2
                            )} | ${session?.jitter_max.toFixed(2)}`
                          : 'N/A'}
                      </Tag>
                      <Tag color="green">
                        Lost:{' '}
                        {session?.lost_min != null
                          ? `${session?.lost_min.toFixed(2)} | ${session?.lost.toFixed(2)} | ${session?.lost_max.toFixed(2)}`
                          : 'N/A'}
                      </Tag>
                    </Space>
                  </Col>
                </Row>
              </div>
            </Fragment>
          ))}
        </Card>
      ))}
    </Drawer>
  )
}
