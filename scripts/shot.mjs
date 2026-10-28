// Usage: node scripts/shot.mjs <outDir> <path> [path...]  (env W,H for viewport; env WAIT ms)
import { chromium } from '@playwright/test'
const [outDir, ...paths] = process.argv.slice(2)
const W = Number(process.env.W ?? 1440)
const H = Number(process.env.H ?? 900)
const WAIT = Number(process.env.WAIT ?? 900)
const FULL = process.env.FULL === '1'
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] })
const fsm = await import('fs')
const STATE = 'screenshots/.state.json'
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, storageState: fsm.existsSync(STATE) ? STATE : undefined })
const page = await ctx.newPage()
const errors = []
page.on('console', (m) => { if (m.type() === 'error') errors.push(`[console] ${m.text()}`) })
page.on('pageerror', (e) => errors.push(`[pageerror] ${e.message}`))
page.on('requestfailed', (r) => errors.push(`[reqfail] ${r.url()}`))
page.on('request', (r) => { const u = r.url(); if (!u.startsWith('http://localhost') && !u.startsWith('data:') && !u.startsWith('blob:')) errors.push(`[external] ${u}`) })
const fs = await import('fs')
fs.mkdirSync(outDir, { recursive: true })
for (const p of paths) {
  const [path, action] = p.split('|')
  await page.goto(`http://localhost:5173${path}`, { waitUntil: 'networkidle' }).catch((e) => errors.push(`[goto] ${path} ${e.message}`))
  if (action === 'reset') {
    await page.waitForTimeout(1500)
    for (let i = 0; i < 3; i++) { try { await page.evaluate(() => localStorage.clear()); break } catch { await page.waitForTimeout(1000) } }
    await page.reload({ waitUntil: 'networkidle' })
  }
  if (action?.startsWith('scroll:')) { await page.waitForTimeout(800); await page.mouse.wheel(0, Number(action.slice(7))); }
  if (action?.startsWith('moment:')) {
    await page.waitForTimeout(800)
    await page.getByRole('button', { name: /Demo/ }).first().click()
    await page.getByRole('button', { name: action.slice(7), exact: true }).click()
    await page.waitForTimeout(600)
    await page.goto(`http://localhost:5173${path}`, { waitUntil: 'networkidle' })
  }
  if (action?.startsWith('click:')) { await page.waitForTimeout(600); const t = action.slice(6)
    const btn = page.getByRole('button', { name: t, exact: true }).or(page.getByRole('tab', { name: t, exact: true })).or(page.getByRole('link', { name: t, exact: true })).first()
    await (await btn.count() ? btn : page.getByText(t).first()).click().catch((e) => errors.push('[click] ' + e.message)) }
  await page.waitForTimeout(WAIT)
  const name = (p.replace(/[/?=&|:]+/g, '_').replace(/^_/, '') || 'root') + `-${W}`
  await page.screenshot({ path: `${outDir}/${name}.png`, fullPage: FULL })
  console.log('shot', name)
}
await ctx.storageState({ path: STATE })
console.log(errors.length ? errors.join('\n') : 'no errors')
await browser.close()
