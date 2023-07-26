import { Line, LineConfig } from '@ant-design/plots'

type Props = {
  config: LineConfig
}

const LineChart: React.FC<Props> = ({ config }) => {
  return (
    <Line
      point={{
        size: 3,
      }}
      {...config}
    />
  )
}

export default LineChart
