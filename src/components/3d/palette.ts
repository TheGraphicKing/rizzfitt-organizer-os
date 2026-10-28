/** Reads Night Court tokens so 3D materials never hard-code colours. */
const cache = new Map<string, string>()
export function token(name: string): string {
  if (cache.has(name)) return cache.get(name)!
  const v = typeof document !== 'undefined' ? getComputedStyle(document.documentElement).getPropertyValue(name).trim() : ''
  // Fallback only if the stylesheet has not loaded yet.
  const out = v || '#ffffff'
  cache.set(name, out)
  return out
}
export const T = {
  get brand() { return token('--brand') },
  get courtSurface() { return token('--court-surface') },
  get courtKitchen() { return token('--court-kitchen') },
  get courtApron() { return token('--court-apron') },
  get courtLine() { return token('--court-line') },
  get ball() { return token('--ball') },
  get badminton() { return token('--court-badminton') },
  get carbon() { return token('--mat-carbon') },
  get gold() { return token('--mat-gold') },
  get silver() { return token('--mat-silver') },
  get bronze() { return token('--mat-bronze') },
  get wood() { return token('--mat-wood') },
  get cork() { return token('--mat-cork') },
  get feather() { return token('--mat-feather') },
  get cricketRed() { return token('--mat-cricket-red') },
  get grip() { return token('--mat-grip') },
  get lightKey() { return token('--light-key') },
  get lightKeySoft() { return token('--light-key-soft') },
  get lightRim() { return token('--light-rim') },
  get lightRimSoft() { return token('--light-rim-soft') },
  get white() { return token('--light-white') },
  get shadow() { return token('--shadow-color') },
  get canvas() { return token('--bg-canvas') },
  get base() { return token('--bg-base') },
  get surface1() { return token('--surface-1') },
  get surface2() { return token('--surface-2') },
  get surface3() { return token('--surface-3') },
  get textPrimary() { return token('--text-primary') },
  get live() { return token('--live') },
  get warning() { return token('--warning') },
  get success() { return token('--success') },
  cat(i: number) { return token(`--cat-${(i % 8) + 1}`) },
}
