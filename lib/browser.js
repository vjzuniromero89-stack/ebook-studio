import puppeteer from 'puppeteer-core';

async function launch() {
  // Local: usa CHROME_PATH si existe. En Vercel: @sparticuz/chromium.
  if (process.env.CHROME_PATH) {
    return puppeteer.launch({ executablePath: process.env.CHROME_PATH, headless: true, args: ['--no-sandbox'] });
  }
  const chromium = (await import('@sparticuz/chromium')).default;
  return puppeteer.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: true,
    defaultViewport: { width: 1200, height: 1600 },
  });
}

export async function withPage(fn) {
  const browser = await launch();
  try {
    const page = await browser.newPage();
    return await fn(page);
  } finally {
    await browser.close().catch(() => {});
  }
}

async function load(page, html) {
  try {
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 25000 });
  } catch {
    // si alguna fuente o imagen tarda demasiado, seguimos con lo que haya cargado
  }
  await page.evaluate(() => Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 5000))])).catch(() => {});
}

export async function htmlToPdf(page, html) {
  await load(page, html);
  return Buffer.from(await page.pdf({ preferCSSPageSize: true, printBackground: true }));
}

export async function htmlToJpg(page, html, width = 1600, height = 2560) {
  await page.setViewport({ width, height, deviceScaleFactor: 1 });
  await load(page, html);
  return Buffer.from(await page.screenshot({ type: 'jpeg', quality: 92, fullPage: false }));
}
