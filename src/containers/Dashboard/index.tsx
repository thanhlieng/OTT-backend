import { Col, Row, Typography } from 'antd'
import { PhoneCallIcon } from 'lucide-react'
import { PageContainer } from '@ant-design/pro-components'
import { Card } from '@/components'
import { usePageDataQuery } from '@/hooks'
import { MainLayout } from '@/layouts'

export const Dashboard = () => {
  const { data: phoneNumbersCount } = usePageDataQuery({
    url: '/api/phone_numbers/count',
    dependencies: ['PHONE_NUMBERS_COUNT'],
  })

  return (
    <MainLayout>
      <PageContainer title={false}>
        <Row gutter={[16, 16]}>
          <Col span={24} md={12} lg={6}>
            <Card>
              <div className="flex items-center justify-between mb-2">
                <Typography.Title level={3} className="mb-0 text-sm font-medium">
                  Total phone number
                </Typography.Title>
                <PhoneCallIcon size={16} color="#64748b" />
              </div>
              <Typography.Paragraph className="mb-0 text-2xl font-bold">
                {phoneNumbersCount}
              </Typography.Paragraph>
            </Card>
          </Col>
        </Row>
      </PageContainer>
    </MainLayout>
  )
}
