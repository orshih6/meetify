import { execFileSync } from 'child_process'
import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { deflateSync, inflateSync } from 'zlib'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

const ICON_SIZE = 1024
const LOGO_SCALE = 0.82
const CORNER_RADIUS = 225
const BACKGROUND = { r: 0x1a, g: 0x1a, b: 0x1c, a: 255 }

const SOURCE_LOGO = join(ROOT, 'logo.png')
const BUILD_DIR = join(ROOT, 'build')
const RESOURCES_ICON = join(ROOT, 'resources', 'icon.png')
const BUILD_ICON = join(BUILD_DIR, 'icon.png')
const BUILD_ICNS = join(BUILD_DIR, 'icon.icns')
const BUILD_ICO = join(BUILD_DIR, 'icon.ico')

const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

function readChunk(buffer, offset) {
  const length = buffer.readUInt32BE(offset)
  const type = buffer.toString('ascii', offset + 4, offset + 8)
  const data = buffer.subarray(offset + 8, offset + 8 + length)
  const crc = buffer.readUInt32BE(offset + 8 + length)
  return { type, data, next: offset + 12 + length, crc }
}

function paethPredictor(a, b, c) {
  const p = a + b - c
  const pa = Math.abs(p - a)
  const pb = Math.abs(p - b)
  const pc = Math.abs(p - c)
  if (pa <= pb && pa <= pc) return a
  if (pb <= pc) return b
  return c
}

function decodePng(buffer) {
  if (!buffer.subarray(0, 8).equals(PNG_SIGNATURE)) {
    throw new Error('Invalid PNG signature')
  }

  let offset = 8
  let width = 0
  let height = 0
  let bitDepth = 0
  let colorType = 0
  const idatParts = []

  while (offset < buffer.length) {
    const chunk = readChunk(buffer, offset)
    offset = chunk.next

    if (chunk.type === 'IHDR') {
      width = chunk.data.readUInt32BE(0)
      height = chunk.data.readUInt32BE(4)
      bitDepth = chunk.data[8]
      colorType = chunk.data[9]
    } else if (chunk.type === 'IDAT') {
      idatParts.push(chunk.data)
    } else if (chunk.type === 'IEND') {
      break
    }
  }

  if (colorType !== 6 || bitDepth !== 8) {
    throw new Error(`Unsupported PNG format (colorType=${colorType}, bitDepth=${bitDepth})`)
  }

  const stride = width * 4
  const raw = inflateSync(Buffer.concat(idatParts))
  const pixels = Buffer.alloc(height * stride)

  let rawOffset = 0
  let prior = Buffer.alloc(stride)

  for (let y = 0; y < height; y++) {
    const filter = raw[rawOffset++]
    const row = Buffer.alloc(stride)

    for (let x = 0; x < stride; x++) {
      const value = raw[rawOffset++]
      const left = x >= 4 ? row[x - 4] : 0
      const up = prior[x]

      switch (filter) {
        case 0:
          row[x] = value
          break
        case 1:
          row[x] = (value + left) & 0xff
          break
        case 2:
          row[x] = (value + up) & 0xff
          break
        case 3:
          row[x] = (value + Math.floor((left + up) / 2)) & 0xff
          break
        case 4: {
          const upLeft = x >= 4 ? prior[x - 4] : 0
          row[x] = (value + paethPredictor(left, up, upLeft)) & 0xff
          break
        }
        default:
          throw new Error(`Unsupported PNG filter ${filter}`)
      }
    }

    row.copy(pixels, y * stride)
    prior = row
  }

  return { width, height, data: pixels }
}

function crc32(buffer) {
  const table =
    crc32.table ??
    (crc32.table = (() => {
      const values = new Uint32Array(256)
      for (let i = 0; i < 256; i++) {
        let c = i
        for (let k = 0; k < 8; k++) {
          c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
        }
        values[i] = c >>> 0
      }
      return values
    })())

  let crc = 0xffffffff
  for (const byte of buffer) {
    crc = table[(crc ^ byte) & 0xff] ^ (crc >>> 8)
  }
  return (crc ^ 0xffffffff) >>> 0
}

function writeChunk(type, data) {
  const typeBuffer = Buffer.from(type, 'ascii')
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length, 0)
  const crcInput = Buffer.concat([typeBuffer, data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(crcInput), 0)
  return Buffer.concat([length, typeBuffer, data, crc])
}

function encodePng(width, height, rgba) {
  const stride = width * 4
  const filtered = Buffer.alloc(height * (1 + stride))

  for (let y = 0; y < height; y++) {
    const rowStart = y * (1 + stride)
    filtered[rowStart] = 0
    rgba.copy(filtered, rowStart + 1, y * stride, y * stride + stride)
  }

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0

  const idat = deflateSync(filtered, { level: 9 })

  return Buffer.concat([
    PNG_SIGNATURE,
    writeChunk('IHDR', ihdr),
    writeChunk('IDAT', idat),
    writeChunk('IEND', Buffer.alloc(0))
  ])
}

function findAlphaBounds(image) {
  const { width, height, data } = image
  let top = height
  let left = width
  let right = -1
  let bottom = -1

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alpha = data[(y * width + x) * 4 + 3]
      if (alpha > 8) {
        if (x < left) left = x
        if (x > right) right = x
        if (y < top) top = y
        if (y > bottom) bottom = y
      }
    }
  }

  if (right < left || bottom < top) {
    throw new Error('Logo image has no visible pixels')
  }

  return { left, top, right, bottom }
}

function cropImage(image, bounds) {
  const cropWidth = bounds.right - bounds.left + 1
  const cropHeight = bounds.bottom - bounds.top + 1
  const data = Buffer.alloc(cropWidth * cropHeight * 4)

  for (let y = 0; y < cropHeight; y++) {
    for (let x = 0; x < cropWidth; x++) {
      const src = ((bounds.top + y) * image.width + (bounds.left + x)) * 4
      const dst = (y * cropWidth + x) * 4
      data[dst] = image.data[src]
      data[dst + 1] = image.data[src + 1]
      data[dst + 2] = image.data[src + 2]
      data[dst + 3] = image.data[src + 3]
    }
  }

  return { width: cropWidth, height: cropHeight, data }
}

function resizeImage(image, targetMax) {
  const scale = targetMax / Math.max(image.width, image.height)
  const width = Math.max(1, Math.round(image.width * scale))
  const height = Math.max(1, Math.round(image.height * scale))
  const data = Buffer.alloc(width * height * 4)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const srcX = Math.min(image.width - 1, Math.floor((x + 0.5) / scale - 0.5))
      const srcY = Math.min(image.height - 1, Math.floor((y + 0.5) / scale - 0.5))
      const src = (srcY * image.width + srcX) * 4
      const dst = (y * width + x) * 4
      data[dst] = image.data[src]
      data[dst + 1] = image.data[src + 1]
      data[dst + 2] = image.data[src + 2]
      data[dst + 3] = image.data[src + 3]
    }
  }

  return { width, height, data }
}

function isInsideRoundedRect(x, y, size, radius) {
  const edge = size - 1
  const corners = [
    { cx: radius, cy: radius },
    { cx: edge - radius, cy: radius },
    { cx: radius, cy: edge - radius },
    { cx: edge - radius, cy: edge - radius }
  ]

  if (x < radius && y < radius) {
    const dx = x - corners[0].cx
    const dy = y - corners[0].cy
    return dx * dx + dy * dy <= radius * radius
  }

  if (x > edge - radius && y < radius) {
    const dx = x - corners[1].cx
    const dy = y - corners[1].cy
    return dx * dx + dy * dy <= radius * radius
  }

  if (x < radius && y > edge - radius) {
    const dx = x - corners[2].cx
    const dy = y - corners[2].cy
    return dx * dx + dy * dy <= radius * radius
  }

  if (x > edge - radius && y > edge - radius) {
    const dx = x - corners[3].cx
    const dy = y - corners[3].cy
    return dx * dx + dy * dy <= radius * radius
  }

  return true
}

function createIconCanvas(logo) {
  const data = Buffer.alloc(ICON_SIZE * ICON_SIZE * 4)
  const offsetX = Math.floor((ICON_SIZE - logo.width) / 2)
  const offsetY = Math.floor((ICON_SIZE - logo.height) / 2)

  for (let y = 0; y < ICON_SIZE; y++) {
    for (let x = 0; x < ICON_SIZE; x++) {
      const dst = (y * ICON_SIZE + x) * 4

      if (!isInsideRoundedRect(x, y, ICON_SIZE, CORNER_RADIUS)) {
        data[dst] = 0
        data[dst + 1] = 0
        data[dst + 2] = 0
        data[dst + 3] = 0
        continue
      }

      data[dst] = BACKGROUND.r
      data[dst + 1] = BACKGROUND.g
      data[dst + 2] = BACKGROUND.b
      data[dst + 3] = BACKGROUND.a
    }
  }

  for (let y = 0; y < logo.height; y++) {
    for (let x = 0; x < logo.width; x++) {
      const canvasX = offsetX + x
      const canvasY = offsetY + y

      if (canvasX < 0 || canvasY < 0 || canvasX >= ICON_SIZE || canvasY >= ICON_SIZE) {
        continue
      }

      const src = (y * logo.width + x) * 4
      const alpha = logo.data[src + 3] / 255
      if (alpha <= 0) continue

      const dst = (canvasY * ICON_SIZE + canvasX) * 4
      const inv = 1 - alpha
      data[dst] = Math.round(logo.data[src] * alpha + data[dst] * inv)
      data[dst + 1] = Math.round(logo.data[src + 1] * alpha + data[dst + 1] * inv)
      data[dst + 2] = Math.round(logo.data[src + 2] * alpha + data[dst + 2] * inv)
      data[dst + 3] = Math.round(255 * alpha + data[dst + 3] * inv)
    }
  }

  return { width: ICON_SIZE, height: ICON_SIZE, data }
}

function createIco(buffers) {
  const count = buffers.length
  const headerSize = 6
  const entrySize = 16
  const offset = headerSize + entrySize * count
  let currentOffset = offset
  const entries = []

  for (const buf of buffers) {
    const width = buf.readUInt32BE(16)
    const height = buf.readUInt32BE(20)
    entries.push({ width, height, size: buf.length, offset: currentOffset })
    currentOffset += buf.length
  }

  const out = Buffer.alloc(currentOffset)
  out.writeUInt16LE(0, 0)
  out.writeUInt16LE(1, 2)
  out.writeUInt16LE(count, 4)

  let pos = 6
  for (const entry of entries) {
    out.writeUInt8(entry.width >= 256 ? 0 : entry.width, pos)
    out.writeUInt8(entry.height >= 256 ? 0 : entry.height, pos + 1)
    out.writeUInt8(0, pos + 2)
    out.writeUInt8(0, pos + 3)
    out.writeUInt16LE(1, pos + 4)
    out.writeUInt16LE(32, pos + 6)
    out.writeUInt32LE(entry.size, pos + 8)
    out.writeUInt32LE(entry.offset, pos + 12)
    pos += 16
  }

  let imgPos = offset
  for (const buf of buffers) {
    buf.copy(out, imgPos)
    imgPos += buf.length
  }

  return out
}

function generateIcns(iconPath) {
  const iconsetDir = join(BUILD_DIR, 'icon.iconset')
  rmSync(iconsetDir, { recursive: true, force: true })
  mkdirSync(iconsetDir, { recursive: true })

  const mappings = [
    [16, 'icon_16x16.png'],
    [32, 'icon_16x16@2x.png'],
    [32, 'icon_32x32.png'],
    [64, 'icon_32x32@2x.png'],
    [128, 'icon_128x128.png'],
    [256, 'icon_128x128@2x.png'],
    [256, 'icon_256x256.png'],
    [512, 'icon_256x256@2x.png'],
    [512, 'icon_512x512.png']
  ]

  for (const [size, name] of mappings) {
    execFileSync('sips', [
      '-z',
      String(size),
      String(size),
      iconPath,
      '--out',
      join(iconsetDir, name)
    ])
  }

  copyFileSync(iconPath, join(iconsetDir, 'icon_512x512@2x.png'))
  execFileSync('iconutil', ['-c', 'icns', iconsetDir, '-o', BUILD_ICNS])
  rmSync(iconsetDir, { recursive: true, force: true })
}

function generateIco(iconPath) {
  const tempDir = join(BUILD_DIR, '.ico-tmp')
  rmSync(tempDir, { recursive: true, force: true })
  mkdirSync(tempDir, { recursive: true })
  const sizes = [16, 32, 48, 64, 128, 256]
  const pngBuffers = sizes.map((size) => {
    const file = join(tempDir, `icon-${size}.png`)
    execFileSync('sips', ['-z', String(size), String(size), iconPath, '--out', file])
    return readFileSync(file)
  })

  writeFileSync(BUILD_ICO, createIco(pngBuffers))
  rmSync(tempDir, { recursive: true, force: true })
}

function main() {
  mkdirSync(BUILD_DIR, { recursive: true })

  const source = decodePng(readFileSync(SOURCE_LOGO))
  const bounds = findAlphaBounds(source)
  const cropped = cropImage(source, bounds)
  const targetMax = Math.round(ICON_SIZE * LOGO_SCALE)
  const resized = resizeImage(cropped, targetMax)
  const icon = createIconCanvas(resized)
  const png = encodePng(icon.width, icon.height, icon.data)

  writeFileSync(BUILD_ICON, png)
  writeFileSync(RESOURCES_ICON, png)
  generateIcns(BUILD_ICON)
  generateIco(BUILD_ICON)

  console.log(`Generated ${BUILD_ICON}`)
  console.log(`Generated ${RESOURCES_ICON}`)
  console.log(`Generated ${BUILD_ICNS}`)
  console.log(`Generated ${BUILD_ICO}`)
}

main()
