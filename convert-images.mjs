import sharp from 'sharp'
import { readdir, unlink } from 'node:fs/promises'
import { join } from 'node:path'

const root = join(process.cwd(), 'public', 'assets', 'imgs')
const quality = 80

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      yield* walk(full)
    } else {
      yield full
    }
  }
}

for await (const file of walk(root)) {
  const lower = file.toLowerCase()
  const isJpg = lower.endsWith('.jpg') || lower.endsWith('.jpeg')
  const isPng = lower.endsWith('.png')

  if (!isJpg && !isPng) continue
  if (file.includes(`${join('media')}`) || file.includes(`${join('search')}`)) continue

  const dot = file.lastIndexOf('.')
  const out = `${file.slice(0, dot)}.webp`

  try {
    await sharp(file).webp({ quality }).toFile(out)
    await unlink(file)
    console.log(`${file.replace(root, '')} -> ${out.replace(root, '')}`)
  } catch (error) {
    console.error(`FAIL ${file}: ${error.message}`)
  }
}
