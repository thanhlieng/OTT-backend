import { signOut, useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { ReactNode, useEffect } from 'react'

type Props = {
  children?: ReactNode
}

const whiteRoutes = '/auth/login'

export const PrivateRouter: React.FC<Props> = ({ children }) => {
  const router = useRouter()
  const { status } = useSession()

  useEffect(() => {
    if (whiteRoutes !== router.pathname) {
      if (status === 'unauthenticated') {
        signOut({
          callbackUrl: '/auth/login',
        })
      }
    }
  }, [router.pathname, status])

  return (
    <div className="relative">
      {children}
    </div>
  )
}
