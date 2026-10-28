import { test, expect, type Page } from '@playwright/test'

/** docs/12-demo-script.md, end to end at 1440x900. */

async function demo(page: Page) {
  await page.getByRole('button', { name: /Prototype switcher/ }).click()
  await expect(page.getByRole('dialog', { name: 'Prototype switcher' })).toBeVisible()
}
async function persona(page: Page, label: string) {
  await demo(page)
  await page.getByRole('dialog', { name: 'Prototype switcher' }).getByRole('button', { name: new RegExp(`^${label}`) }).click()
}
async function moment(page: Page, label: string) {
  await demo(page)
  await page.getByRole('dialog', { name: 'Prototype switcher' }).getByRole('button', { name: label, exact: true }).click()
}
const cont = (page: Page) => page.getByRole('button', { name: 'Continue' }).click()

test('demo script', async ({ page, context }) => {
  const errors: string[] = []
  const watch = (p: Page) => {
    p.on('pageerror', (e) => errors.push(`${p.url()} ${e.message}`))
    p.on('console', (m) => m.type() === 'error' && errors.push(`${p.url()} ${m.text()}`))
    p.on('request', (r) => {
      const u = r.url()
      if (!u.startsWith('http://localhost') && !u.startsWith('data:') && !u.startsWith('blob:')) errors.push(`external request ${u}`)
    })
  }
  watch(page)
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())

  await test.step('Act 1: first impression', async () => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Run the game. We run everything else.' })).toBeVisible()
    await page.mouse.wheel(0, 1600)
    await expect(page.getByText('Run match day from one screen.')).toBeVisible()
    await page.mouse.wheel(0, 1200)
    await page.getByRole('link', { name: 'Start free' }).first().click()
  })

  let eventId = ''
  await test.step('Act 2: a new organizer sets up a tournament', async () => {
    await page.getByLabel('Mobile number').fill('9000020002')
    await page.getByRole('button', { name: 'Send code' }).click()
    await page.getByLabel('Digit 1').fill('123456')
    await expect(page.getByLabel('Your name')).toHaveValue('Rahul Menon')
    await page.getByRole('button', { name: 'Start setup' }).click()
    // SW-01
    await page.getByLabel('Organization name').fill('Smash Factory Chennai')
    await page.getByRole('combobox', { name: 'City' }).fill('Chenn')
    await page.getByRole('combobox', { name: 'City' }).press('Enter')
    await cont(page)
    // SW-02
    await page.getByLabel('Event name').fill('Chennai Smash Open')
    await page.getByRole('combobox', { name: 'Venue' }).fill('Smash')
    await page.getByRole('combobox', { name: 'Venue' }).press('Enter')
    await page.getByRole('button', { name: 'More courts' }).click()
    await page.getByRole('button', { name: 'More courts' }).click()
    await cont(page)
    // SW-03
    await page.getByRole('button', { name: "Men's Doubles 1", exact: true }).click()
    await page.getByRole('menu').getByRole('button', { name: 'Intermediate - Below 4' }).click()
    await page.keyboard.press('Escape')
    await expect(page.getByText('About 28 teams make 7 groups of 4. Top 2 go to a 16-team knockout with 2 byes.').first()).toBeVisible()
    await cont(page)
    // SW-04
    await page.getByRole('checkbox', { name: 'Best of 3 for finals only' }).click()
    await cont(page)
    // SW-05
    await page.getByRole('button', { name: 'T-shirt size' }).click()
    await page.getByRole('button', { name: 'Connect bank or UPI' }).click()
    await page.getByLabel('UPI ID').fill('smashfactory@okaxis')
    await page.getByLabel('PAN (for KYC)').fill('ABCDE1234F')
    await page.getByRole('button', { name: 'Submit for review' }).click()
    await expect(page.getByText('Under review, usually within a day').first()).toBeVisible()
    await cont(page)
    // SW-06
    await page.getByLabel('Name', { exact: true }).fill('Kavin Raj')
    await page.getByLabel('Mobile number').fill('9000032001')
    await page.getByRole('button', { name: 'Add', exact: true }).click()
    await cont(page)
    // SW-07
    await page.getByRole('radio', { name: 'Charcoal' }).click()
    await page.getByRole('button', { name: /neon/i }).first().click()
    await page.getByLabel('Sponsor name').fill('Marina Juice Co')
    await page.getByRole('button', { name: 'Add sponsor' }).click()
    await cont(page)
    // SW-08 and SW-09
    await expect(page.getByRole('heading', { name: /Looks great, Rahul/ })).toBeVisible()
    await page.getByRole('button', { name: 'Build my event app' }).click()
    await expect(page.getByText('Building your app')).toBeVisible()
    await page.waitForURL(/\/e\/evt-/, { timeout: 15000 })
    eventId = page.url().match(/\/e\/(evt-[^/?]+)/)![1]
    await expect(page.locator('#open-reason')).toHaveText('Payout account under review')
    await expect(page.getByRole('button', { name: 'Open registrations' })).toBeDisabled()
  })

  await test.step('Act 3: Rizzfitt approves', async () => {
    await persona(page, 'Rizzfitt HQ')
    await page.getByRole('link', { name: /Approvals/ }).first().click()
    await page.getByRole('button', { name: /Smash Factory Chennai/ }).first().click()
    await page.getByRole('button', { name: 'Approve', exact: true }).click()
    await persona(page, 'New organizer')
    await expect(page.getByText('5 of 5 done')).toBeVisible()
    await page.getByRole('button', { name: 'Open registrations' }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Open registrations' }).click()
    await expect(page.getByText('Nice. Registrations are open.')).toBeVisible()
    await expect(page.getByRole('img', { name: /QR code/ }).first()).toBeVisible()
    await page.keyboard.press('Escape')
  })

  await test.step('Act 4: a player registers', async () => {
    const site = await context.newPage()
    watch(site)
    await site.goto('/p/chennai-smash-open')
    await site.getByRole('link', { name: 'Register now' }).first().click()
    await site.getByRole('radio', { name: /Mixed Doubles, Open/ }).click()
    await cont(site)
    await site.getByLabel('Mobile number').fill('9000031001')
    await site.getByLabel('First name').fill('Asha')
    await site.getByLabel('Last name').fill('Nair')
    await site.getByRole('radio', { name: 'Woman' }).click()
    await cont(site)
    await site.getByLabel("Partner's mobile").fill('9000031002')
    await site.getByLabel('First name').fill('Varun')
    await site.getByLabel('Last name').fill('Rao')
    await cont(site)
    await cont(site)
    await site.getByRole('checkbox', { name: 'I agree' }).click()
    await cont(site)
    await site.getByRole('button', { name: /Pay ₹1,500 with UPI/ }).click()
    await site.getByRole('button', { name: 'GPay' }).click()
    await expect(site.getByText('YOU ARE IN')).toBeVisible()
    await site.close()
    await page.goto(`/e/${eventId}/registrations`)
    await expect(page.getByText('Asha Nair and Varun Rao').first()).toBeVisible()
    await expect(page.getByText(/1 entries · 2 players · ₹1,500 collected/)).toBeVisible()
  })

  await test.step('Act 5: match day at the Coimbatore Open', async () => {
    await persona(page, 'Organizer')
    await moment(page, 'Match day')
    await expect(page.getByText('Court 2: result waiting')).toBeVisible()
    await expect(page.getByText('Court 3 running 20 min late')).toBeVisible()
    await expect(page.getByText('3 players have not checked in')).toBeVisible()
    await page.getByRole('button', { name: 'Confirm result' }).first().click()
    await expect(page.getByText('Court 2: result waiting')).toHaveCount(0)
    await page.goto('/e/evt-cbe/match-day')
    await page.getByRole('list', { name: 'Courts list' }).getByRole('button', { name: /Court 4/ }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Call next match' }).click()
    await expect(page.getByText('Called to Court 4').first()).toBeVisible()
    await page.keyboard.press('Escape')

    const ump = await context.newPage()
    watch(ump)
    await ump.setViewportSize({ width: 390, height: 844 })
    await ump.goto('/u/evt-cbe-c4')
    await ump.getByRole('button', { name: /I am Yusuf Khan/ }).click()
    await ump.getByRole('button', { name: /Called, tap to start/ }).click()
    await ump.getByRole('button', { name: 'Start match' }).click()
    const pad = ump.getByRole('button', { name: /Point to/ }).first()
    for (let i = 0; i < 3; i++) await pad.click()
    await expect(ump.getByRole('button', { name: /Current score 3/ })).toBeVisible()

    const tv = await context.newPage()
    watch(tv)
    await tv.setViewportSize({ width: 1920, height: 1080 })
    await tv.goto('/tv/evt-cbe/4')
    await expect(tv.getByText("Men's Doubles, Open · 3rd place")).toBeVisible()
    await expect(tv.getByLabel('3', { exact: true }).first()).toBeVisible()
    await pad.click()
    await expect(tv.getByLabel('4', { exact: true }).first()).toBeVisible()
    const live = await context.newPage()
    watch(live)
    await live.goto('/p/coimbatore-open-2026/live')
    await expect(live.getByText('Court 4 · Men\'s Doubles, Open · 3rd place')).toBeVisible()
    await live.close()

    await page.bringToFront()
    await page.getByRole('list', { name: 'Courts list' }).getByRole('button', { name: /Court 2/ }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Move or correct' }).click()
    await page.getByRole('dialog').last().getByRole('button', { name: 'Correct score' }).click()
    await page.getByRole('button', { name: 'Game 1 side A plus' }).click()
    await page.getByLabel('Reason (required)').fill('Umpire missed a point')
    await page.getByRole('button', { name: 'Save correction' }).click()
    await expect(page.getByRole('heading', { name: 'Audit trail' })).toBeVisible()
    await page.keyboard.press('Escape')
    await page.keyboard.press('Escape')

    await tv.goto('/tv/evt-cbe/1')
    await expect(tv.getByText("Men's Doubles, Open · Final")).toBeVisible()
    await tv.close()
    await ump.close()
  })

  await test.step('Act 6: leagues and auctions', async () => {
    await page.goto('/e/evt-fca/auction')
    await expect(page.getByRole('heading', { name: 'Auction room' })).toBeVisible()
    for (let i = 0; i < 2; i++) {
      await expect(page.getByText(/leads$/)).toBeVisible({ timeout: 10000 })
      await page.getByRole('button', { name: 'Sold', exact: true }).click()
      await page.waitForTimeout(600)
    }
    await expect(page.getByText(/19 of 48 players sold/)).toBeVisible()
    await page.goto('/e/evt-szl/ties')
    await page.getByRole('button', { name: 'Malabar Mavericks, round 3' }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Approve', exact: true }).click()
    await expect(page.getByText('1 line-up waiting')).toBeVisible()
  })

  await test.step('Act 7: after the event', async () => {
    await moment(page, 'Finished')
    await page.goto('/e/evt-cbe/results')
    await expect(page.getByRole('button', { name: 'Download certificates' })).toBeVisible()
    await page.getByRole('tab', { name: 'DUPR sync' }).click()
    await expect(page.getByText('Matches not yet on DUPR')).toBeVisible()
    await page.getByRole('tab', { name: 'Reports' }).click()
    await expect(page.getByText('Players missing DUPR ID')).toBeVisible()
    await page.goto('/e/evt-cbe/money')
    await expect(page.getByRole('heading', { name: 'Payouts' })).toBeVisible()
  })

  await test.step('Act 8: scope', async () => {
    await page.goto('/hq/whats-new')
    await expect(page.getByRole('heading', { name: 'Assumptions to confirm' })).toBeVisible()
  })

  expect(errors, errors.join('\n')).toEqual([])
})
