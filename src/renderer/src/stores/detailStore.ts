import { create } from 'zustand'

export type DetailTab = 'summary' | 'transcript'

export const DETAIL_TABS: DetailTab[] = ['summary', 'transcript']

type DetailState = {
  activeTab: DetailTab
  setActiveTab: (tab: DetailTab) => void
  resetDetail: () => void
}

export const useDetailStore = create<DetailState>((set) => ({
  activeTab: 'summary',
  setActiveTab: (tab) => set({ activeTab: tab }),
  resetDetail: () => set({ activeTab: 'summary' })
}))

export function detailTabToIndex(tab: DetailTab): number {
  return DETAIL_TABS.indexOf(tab)
}

export function indexToDetailTab(index: number): DetailTab {
  return DETAIL_TABS[index] ?? 'summary'
}
