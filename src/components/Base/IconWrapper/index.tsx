type Props = {
  children?: React.ReactNode
}

export const IconWrapper: React.FC<Props> = ({ children }) => {
  return <div className="flex items-center justify-center">{children}</div>
}
