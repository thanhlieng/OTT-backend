import { GroupIcon, HistoryIcon, LayoutDashboardIcon, PhoneCallIcon, User2Icon } from 'lucide-react'
import { UserRole } from '@/types'

export const routes = [
  {
    path: '/',
    name: 'Dashboard',
    icon: <LayoutDashboardIcon size={16} />,
  },
  {
    path: '/admin/groups',
    name: 'Group manager',
    icon: <GroupIcon size={16} />,
  },
  {
    path: '/admin/phone-number',
    name: 'Phone number',
    icon: <PhoneCallIcon size={16} />,
  },
  {
    path: '/admin/room-call-logs',
    name: 'Room call logs',
    icon: <HistoryIcon size={16} />,
  },
  {
    path: '/admin/users',
    name: 'User manager',
    icon: <User2Icon size={16} />,
    roles: [UserRole.ADMIN, UserRole.SUPPER_ADMIN],
  },
]
