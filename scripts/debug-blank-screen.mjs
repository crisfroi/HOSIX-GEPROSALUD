import { chromium } from 'playwright';

const logs = [];
const pageErrors = [];

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

page.on('console', (msg) => {
  logs.push(`[${msg.type()}] ${msg.text()}`);
});
page.on('pageerror', (err) => {
  pageErrors.push(err.message + '\n' + err.stack);
});
page.on('requestfailed', (req) => {
  logs.push(`[requestfailed] ${req.url()} -> ${req.failure()?.errorText}`);
});

await page.goto('http://localhost:8080/', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(3000);

const rootChildren = await page.evaluate(() => document.getElementById('root')?.childElementCount ?? -1);
const rootHTML = await page.evaluate(() => document.getElementById('root')?.innerHTML?.slice(0, 300) ?? '');

console.log('ROOT_CHILDREN:', rootChildren);
console.log('ROOT_HTML:', rootHTML || '(empty)');
console.log('PAGE_ERRORS:', pageErrors.length ? pageErrors.join('\n---\n') : '(none)');
console.log('CONSOLE_LOGS:', logs.length ? logs.join('\n') : '(none)');

await browser.close();
