import { CanvasTexture, SRGBColorSpace } from 'three'

const cache = new Map<string, CanvasTexture>()

/** Text drawn into a canvas texture (no font downloads; uses the page's loaded font). */
export function textTexture(
  text: string,
  opts: { w?: number; h?: number; bg?: string; color?: string; size?: number; weight?: number; sub?: string; subColor?: string; stripe?: string; radius?: number } = {},
): CanvasTexture {
  const key = JSON.stringify([text, opts])
  if (cache.has(key)) return cache.get(key)!
  const w = opts.w ?? 256
  const h = opts.h ?? 256
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')!
  if (opts.bg) {
    ctx.fillStyle = opts.bg
    const r = opts.radius ?? 0
    ctx.beginPath()
    ctx.roundRect(0, 0, w, h, r)
    ctx.fill()
  }
  if (opts.stripe) {
    ctx.fillStyle = opts.stripe
    ctx.fillRect(0, h - h * 0.12, w, h * 0.12)
  }
  const family = getComputedStyle(document.body).fontFamily || 'sans-serif'
  ctx.fillStyle = opts.color ?? getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim()
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const size = opts.size ?? Math.round(h * 0.42)
  ctx.font = `${opts.weight ?? 700} ${size}px ${family}`
  const lines = text.split('\n')
  const lh = size * 1.05
  const top = h / 2 - ((lines.length - 1) * lh) / 2 - (opts.sub ? size * 0.3 : 0)
  lines.forEach((l, i) => ctx.fillText(l, w / 2, top + i * lh, w * 0.9))
  if (opts.sub) {
    ctx.fillStyle = opts.subColor ?? 'rgba(255,255,255,0.7)'
    ctx.font = `600 ${Math.round(size * 0.38)}px ${family}`
    ctx.fillText(opts.sub, w / 2, top + lines.length * lh + size * 0.1, w * 0.9)
  }
  const tex = new CanvasTexture(c)
  tex.colorSpace = SRGBColorSpace
  tex.anisotropy = 4
  cache.set(key, tex)
  return tex
}
