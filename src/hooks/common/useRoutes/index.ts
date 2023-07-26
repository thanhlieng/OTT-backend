import { filter } from 'lodash'
import { useSession } from 'next-auth/react'
import { routes as routerData } from '@/routes'

export const useRoutes = () => {
  const { data: session } = useSession()
  const role = ((session?.user || {}) as any).role
  const routes = filter(routerData, (route) => !route.roles || route.roles.indexOf(role) >= 0)

  return {
    routes,
  }
}
