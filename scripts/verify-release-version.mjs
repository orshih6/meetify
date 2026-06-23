import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
const expectedTag = `v${pkg.version}`

let currentTag = ''
try {
  currentTag = execSync('git describe --tags --exact-match', {
    cwd: root,
    encoding: 'utf8'
  }).trim()
} catch {
  console.error(`No git tag on HEAD. Expected tag: ${expectedTag}`)
  console.error(`Run: git tag ${expectedTag} && git push origin ${expectedTag}`)
  process.exit(1)
}

if (currentTag !== expectedTag) {
  console.error(`Tag mismatch: HEAD is ${currentTag}, package.json is ${pkg.version}`)
  console.error(`Bump package.json or retag as ${expectedTag}`)
  process.exit(1)
}

console.log(`Release version OK: ${pkg.version} (${expectedTag})`)
