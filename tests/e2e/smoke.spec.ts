import { expect, test } from '@playwright/test'

test('boots and renders the R3F canvas', async ({ page }) => {
  const consoleErrors: string[] = []
  page.on('pageerror', (err) => consoleErrors.push(String(err)))
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })

  // ?skipTitle=1 bypasses the title screen so the smoke doesn't wait on
  // drei's useProgress. The title flow itself is covered visually.
  await page.goto('/?skipTitle=1')

  const canvas = page.locator('.game-canvas canvas')
  await expect(canvas).toBeVisible({ timeout: 15_000 })
  await expect(page.locator('.title-screen')).toHaveCount(0, { timeout: 5_000 })

  const box = await canvas.boundingBox()
  expect(box).not.toBeNull()
  expect(box!.width).toBeGreaterThan(0)
  expect(box!.height).toBeGreaterThan(0)

  expect(consoleErrors, `unexpected console errors: ${consoleErrors.join('\n')}`).toEqual([])
})
