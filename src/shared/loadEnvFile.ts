import { existsSync, readFileSync } from 'fs'
import { join } from 'path'

export function loadEnvFile(...searchDirs: string[]): void {
  const dirs = searchDirs.length > 0 ? searchDirs : [process.cwd()]

  for (const dir of dirs) {
    const envPath = join(dir, '.env')

    if (!existsSync(envPath)) {
      continue
    }

    const lines = readFileSync(envPath, 'utf8').split('\n')

    for (const line of lines) {
      const trimmed = line.trim()

      if (!trimmed || trimmed.startsWith('#')) {
        continue
      }

      const separatorIndex = trimmed.indexOf('=')

      if (separatorIndex === -1) {
        continue
      }

      const key = trimmed.slice(0, separatorIndex).trim()
      const value = trimmed.slice(separatorIndex + 1).trim()

      if (key && process.env[key] === undefined) {
        process.env[key] = value
      }
    }

    return
  }
}
