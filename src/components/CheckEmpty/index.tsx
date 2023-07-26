type Props = {
  condition?: boolean
  children?: React.ReactNode
}

export const CheckEmpty: React.FC<Props> = ({ condition, children }) => {
  return condition ? <>{children}</> : null
}
