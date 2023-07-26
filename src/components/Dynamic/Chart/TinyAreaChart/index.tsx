import { TinyArea, TinyAreaConfig } from '@ant-design/plots'

type Props = {
  config: TinyAreaConfig
}

const TinyAreaChart: React.FC<Props> = ({ config }) => {
  return <TinyArea {...config} />
}

export default TinyAreaChart
