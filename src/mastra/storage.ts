import { LibSQLStore } from '@mastra/libsql'
import type { MemoryStorage } from '@mastra/core/storage'

export const MEETIFY_RESOURCE_ID = 'meetify-sessions'

const DEFAULT_DB_URL = 'file:./mastra.db'

export function createLibSQLStore(url: string = DEFAULT_DB_URL): LibSQLStore {
  return new LibSQLStore({
    id: 'mastra-storage',
    url
  })
}

export async function getMemoryStore(storage: LibSQLStore): Promise<MemoryStorage> {
  const memory = await storage.getStore('memory')

  if (!memory) {
    throw new Error('LibSQL memory store is not available.')
  }

  return memory
}
