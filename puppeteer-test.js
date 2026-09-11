import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure().errorText));

  try {
    await page.goto('http://localhost:5173/login');
    await page.waitForSelector('input[type="email"]');
    await page.type('input[type="email"]', 'arnol@gmail.com');
    await page.type('input[type="password"]', 'arnol0');
    await page.click('button[type="submit"]');
    
    await page.waitForNavigation();
    console.log('Logged in!');
    
    await new Promise(r => setTimeout(r, 2000));
    
    // Find the Gestionar Usuarios button
    const buttons = await page.$$('button');
    let btnClicked = false;
    for (const btn of buttons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes('Gestionar Usuarios')) {
        await btn.click();
        console.log('Clicked Gestionar Usuarios');
        btnClicked = true;
        break;
      }
    }
    
    if (!btnClicked) {
      console.log('Button not found. Trying to expand sidebar...');
      // It might be inside the accordion? But the accordion for system users is separate?
      // Wait, is 'Gestionar Usuarios' inside an accordion?
    }
    
    await new Promise(r => setTimeout(r, 3000));
  } catch(e) {
    console.error('TEST SCRIPT ERROR:', e);
  } finally {
    await browser.close();
  }
})();
