import { Pie, PieConfig } from '@ant-design/plots'

type Props = {
  config: PieConfig
}

const PieChart: React.FC<Props> = ({ config }) => {
  return <Pie {...config} />
}

export default PieChart
