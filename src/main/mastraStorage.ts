import { app } from 'electron'
import { join } from 'path'
import type { MemoryStorage } from '@mastra/core/storage'
import { createLibSQLStore, getMemoryStore } from '../mastra/storage'
import type { LibSQLStore } from '@mastra/libsql'

let storage: LibSQLStore | null = null
let memory: MemoryStorage | null = null
let initPromise: Promise<void> | null = null

export async function initMastraStorage(): Promise<void> {
  if (memory) {
    return
  }

  if (initPromise) {
    await initPromise
    return
  }

  initPromise = (async () => {
    const dbPath = join(app.getPath('userData'), 'meetify.db')
    storage = createLibSQLStore(`file:${dbPath}`)
    await storage.init()
    memory = await getMemoryStore(storage)
  })()

  await initPromise
}

export function getElectronMemoryStore(): MemoryStorage {
  if (!memory) {
    throw new Error('Mastra storage is not initialized. Call initMastraStorage() first.')
  }

  return memory
}
