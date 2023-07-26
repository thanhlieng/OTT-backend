import { Heatmap, HeatmapConfig } from '@ant-design/plots'

type Props = {
  config: HeatmapConfig
}

const HeatmapChart: React.FC<Props> = ({ config }) => {
  return <Heatmap {...config} />
}

export default HeatmapChart
