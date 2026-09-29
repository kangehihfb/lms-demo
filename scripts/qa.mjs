import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const dir = resolve('evidence'); await mkdir(dir, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const errors = []; page.on('pageerror', error => errors.push(error.message));
try {
  await page.goto('http://127.0.0.1:4173');
  await page.getByRole('button', { name: /^김서연, 20:00반, / }).first().waitFor();
  await page.screenshot({ path: `${dir}/board-desktop.png` });
  console.log((await page.locator('body').innerText()).slice(0, 4000));
  console.log(JSON.stringify({ errors }));
  const original = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  await original.goto('file:///Users/kangeunhwa/lms-board-proto%20%E1%84%87%E1%85%A9%E1%86%A8%E1%84%89%E1%85%A1%E1%84%87%E1%85%A9%E1%86%AB.html');
  await original.locator('.srow').first().waitFor();
  await original.screenshot({ path: `${dir}/reference-desktop.png` });
  await writeFile(`${dir}/initial-qa.json`, JSON.stringify({ errors }, null, 2));
} finally { await browser.close(); }
