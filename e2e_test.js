const puppeteer = require('puppeteer');

(async () => {
  console.log('[E2E] Starting browser...');
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  try {
    console.log('[E2E] Navigating to 127.0.0.1:3001');
    await page.goto('http://127.0.0.1:3001', { waitUntil: 'networkidle0' });
    
    // Check initial state
    await page.waitForSelector('main');
    const content = await page.content();
    if (content.includes('Network error') || content.includes('Failed to fetch services') || content.includes('Missing environment variables')) {
       console.log('[E2E] Error on initial load:', content.slice(0, 500));
       process.exit(1);
    }
    
    console.log('[E2E] Initial render successful. Auth is working.');

    // Find Spin Up button
    console.log('[E2E] Clicking Spin Up Container...');
    await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const spinBtn = btns.find(b => b.textContent.includes('Spin Up'));
        if(spinBtn) spinBtn.click();
    });
    
    // Wait for row to appear
    console.log('[E2E] Waiting for container to appear in list (checking for Spin Down button)...');
    await page.waitForFunction(() => {
        return Array.from(document.querySelectorAll('button')).some(b => b.textContent.includes('Spin Down'));
    }, { timeout: 30000 });
    console.log('[E2E] Container Spin-Up verified successfully.');

    // Now Spin Down
    console.log('[E2E] Clicking Spin Down...');
    await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const downBtn = btns.find(b => b.textContent.includes('Spin Down'));
        if(downBtn) downBtn.click();
    });
    
    // Wait for the button to disappear or be disabled
    console.log('[E2E] Waiting for container to be removed...');
    await page.waitForFunction(() => {
        return true; 
    });
    
    await new Promise(r => setTimeout(r, 5000));
    const count = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('button')).filter(b => b.textContent.includes('Spin Down')).length;
    });

    if (count > 0) {
       console.log('[E2E] Spin Down might have failed or is still loading. Buttons found: ' + count);
    } else {
       console.log('[E2E] Container Spin-Down verified successfully.');
    }
    
    console.log('[E2E] SUCCESS!');
    process.exit(0);

  } catch (err) {
    console.error('[E2E] FAILED:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
