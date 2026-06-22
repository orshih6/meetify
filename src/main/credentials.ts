import { app, safeStorage } from 'electron'
import { existsSync } from 'fs'
import { mkdir, readFile, unlink, writeFile } from 'fs/promises'
import { join } from 'path'
import type { ApiKeyStatus } from '@shared/ipc'

export const OPENAI_API_KEY_ERROR =
  'OpenAI API key not configured. Add it in Settings → AI Providers.'

function openAiKeyPath(): string {
  return join(app.getPath('userData'), 'credentials', 'openai.enc')
}

async function readStoredOpenAiApiKey(): Promise<string | null> {
  if (!safeStorage.isEncryptionAvailable()) {
    return null
  }

  const filePath = openAiKeyPath()

  if (!existsSync(filePath)) {
    return null
  }

  try {
    const encrypted = await readFile(filePath)
    return safeStorage.decryptString(encrypted)
  } catch {
    return null
  }
}

export function getOpenAiApiKeyStatus(): ApiKeyStatus {
  if (existsSync(openAiKeyPath()) && safeStorage.isEncryptionAvailable()) {
    return { configured: true, source: 'settings' }
  }

  if (process.env.OPENAI_API_KEY?.trim()) {
    return { configured: true, source: 'env' }
  }

  return { configured: false, source: 'none' }
}

export async function getOpenAiApiKey(): Promise<string> {
  const storedKey = await readStoredOpenAiApiKey()

  if (storedKey?.trim()) {
    return storedKey.trim()
  }

  const envKey = process.env.OPENAI_API_KEY?.trim()

  if (envKey) {
    return envKey
  }

  throw new Error(OPENAI_API_KEY_ERROR)
}

export async function setOpenAiApiKey(key: string): Promise<void> {
  const trimmed = key.trim()

  if (!trimmed) {
    throw new Error('API key cannot be empty.')
  }

  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error(
      'Secure storage is not available on this system. Use OPENAI_API_KEY in .env for development.'
    )
  }

  const dir = join(app.getPath('userData'), 'credentials')
  await mkdir(dir, { recursive: true })
  const encrypted = safeStorage.encryptString(trimmed)
  await writeFile(openAiKeyPath(), encrypted)
}

export async function clearOpenAiApiKey(): Promise<void> {
  const filePath = openAiKeyPath()

  if (!existsSync(filePath)) {
    return
  }

  await unlink(filePath)
}
