import { create } from 'zustand'

export type DetailTab = 'summary' | 'transcript'

export const DETAIL_TABS: DetailTab[] = ['summary', 'transcript']

type DetailState = {
  activeTab: DetailTab
  askQuery: string
  setActiveTab: (tab: DetailTab) => void
  setAskQuery: (query: string) => void
  submitAskQuery: (sessionId: string) => void
  resetDetail: () => void
}

export const useDetailStore = create<DetailState>((set, get) => ({
  activeTab: 'summary',
  askQuery: '',
  setActiveTab: (tab) => set({ activeTab: tab }),
  setAskQuery: (query) => set({ askQuery: query }),
  submitAskQuery: (sessionId) => {
    const { askQuery } = get()

    if (!askQuery.trim()) {
      return
    }

    console.log('Ask about meeting', { sessionId, query: askQuery.trim() })
    set({ askQuery: '' })
  },
  resetDetail: () => set({ activeTab: 'summary', askQuery: '' })
}))

export function detailTabToIndex(tab: DetailTab): number {
  return DETAIL_TABS.indexOf(tab)
}

export function indexToDetailTab(index: number): DetailTab {
  return DETAIL_TABS[index] ?? 'summary'
}
