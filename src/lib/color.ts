function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  const v = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)]
}
function lum([r, g, b]: [number, number, number]): number {
  const f = (c: number) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}
export function contrast(a: string, b: string): number {
  const la = lum(hexToRgb(a))
  const lb = lum(hexToRgb(b))
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}
/** Black or white, whichever reads better on the accent. */
export function onColor(accent: string): string {
  return contrast(accent, '#0A0A0A') >= contrast(accent, '#FFFFFF') ? '#0A0A0A' : '#FFFFFF'
}
export function rgba(hex: string, a: number): string {
  const [r, g, b] = hexToRgb(hex)
  return `rgba(${r}, ${g}, ${b}, ${a})`
}
/** CSS custom properties for an event subtree: orange action colour and the chosen page ground. */
export function accentVars(accent: string, ground: 'black' | 'charcoal' = 'black'): Record<string, string> {
  return {
    '--event-ground': ground === 'charcoal' ? '#141414' : '#0A0A0A',
    '--event-accent': accent,
    '--event-accent-on': onColor(accent),
    '--event-accent-soft': rgba(accent, 0.16),
    '--event-accent-glow': rgba(accent, 0.42),
  }
}
