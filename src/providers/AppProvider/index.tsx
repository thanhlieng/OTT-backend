import { PrivateRouter } from '..'
import dynamic from 'next/dynamic'
import { ReactNode, useState } from 'react'
import { RecoilRoot } from 'recoil'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

type Props = {
  children?: ReactNode
}

const AntdProvider = dynamic(() => import('@/providers/AntdProvider'), { ssr: false })

export const AppProvider: React.FC<Props> = ({ children }) => {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <RecoilRoot>
      <QueryClientProvider client={queryClient}>
        <AntdProvider>
          <PrivateRouter>{children}</PrivateRouter>
        </AntdProvider>
      </QueryClientProvider>
    </RecoilRoot>
  )
}
