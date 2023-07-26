import { Column, ColumnConfig } from '@ant-design/plots'

type Props = {
  config: ColumnConfig
}

const ColumnChart: React.FC<Props> = ({ config }) => {
  return <Column {...config} />
}

export default ColumnChart
