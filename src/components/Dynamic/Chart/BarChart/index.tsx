import { Bar, BarConfig } from '@ant-design/plots'

type Props = {
  config: BarConfig
}

const BarChart: React.FC<Props> = ({ config }) => {
  return <Bar {...config} />
}

export default BarChart
