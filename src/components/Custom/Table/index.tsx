import { Table as TableAntd, TableProps } from 'antd'

type Props = TableProps<any>

export const Table: React.FC<Props> = ({ ...props }) => {
  return (
    <TableAntd
      scroll={{
        x: 'auto',
      }}
      {...props}
    />
  )
}
