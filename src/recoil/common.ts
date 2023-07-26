import { atom } from 'recoil'
import { recoilPersist } from 'recoil-persist'

const { persistAtom } = recoilPersist()

export const openCmdkState = atom({
  key: 'openCmdk',
  default: false,
})

export const collapsedSidebarState = atom({
  key: 'collapsedSidebar',
  default: false,
  effects: [persistAtom],
})
