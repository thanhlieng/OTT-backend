import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import CommandPalette, { filterItems, getItemIndex } from 'react-cmdk'
import 'react-cmdk/dist/cmdk.css'
import { useRecoilState } from 'recoil'
import { openCmdkState } from '@/recoil'

export const Cmdk = () => {
  const router = useRouter()
  const [openCmdk, setOpenCmdk] = useRecoilState(openCmdkState)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const down = (e: { key: string; metaKey: any; ctrlKey: any; preventDefault: () => void }) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpenCmdk((open) => !open)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [setOpenCmdk])

  const filteredItems = filterItems(
    [
      {
        heading: 'Page',
        id: 'dashboard',
        items: [
          {
            id: 'dashboard',
            children: 'Dashboard',
            onClick: () => {
              router.push('/')
            },
          },
          {
            id: 'groups',
            children: 'Group manager',
            onClick: () => {
              router.push('/admin/groups')
            },
          },
          {
            id: 'phone-number',
            children: 'Phone number',
            onClick: () => {
              router.push('/admin/phone-number')
            },
          },
          {
            id: 'room-call-logs',
            children: 'Room call logs',
            onClick: () => {
              router.push('/admin/room-call-logs')
            },
          },
        ],
      },
    ],
    search
  )

  return (
    <CommandPalette onChangeSearch={setSearch} onChangeOpen={setOpenCmdk} search={search} isOpen={openCmdk} page="root">
      <CommandPalette.Page id="root">
        {filteredItems.length ? (
          filteredItems.map((list) => (
            <CommandPalette.List key={list.id} heading={list.heading}>
              {list.items.map(({ id, ...rest }) => (
                <CommandPalette.ListItem key={id} index={getItemIndex(filteredItems, id)} {...rest} />
              ))}
            </CommandPalette.List>
          ))
        ) : (
          <CommandPalette.FreeSearchAction />
        )}
      </CommandPalette.Page>
      <CommandPalette.Page id="projects">{/* Projects page */}</CommandPalette.Page>
    </CommandPalette>
  )
}
