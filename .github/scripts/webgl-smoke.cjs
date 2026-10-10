const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--enable-webgl',
      '--ignore-gpu-blocklist',
      '--enable-unsafe-swiftshader',
      '--use-gl=angle',
      '--use-angle=swiftshader'
    ]
  });

  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.stack || error.message));

    await page.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForSelector('#splashStart', { state: 'visible', timeout: 15000 });
    await page.waitForTimeout(800);

    const initialState = await page.evaluate(() => {
      const canvas = document.querySelector('#gl');
      return {
        hasWebGL: !!canvas?.getContext('webgl'),
        width: canvas?.width || 0,
        height: canvas?.height || 0,
        message: document.querySelector('#topmsg')?.textContent || ''
      };
    });
    if (!initialState.hasWebGL || initialState.width < 8 || initialState.height < 8) {
      throw new Error('WebGL startcontrole mislukt: ' + JSON.stringify(initialState));
    }

    await page.click('#splashStart');
    await page.waitForFunction(() => {
      const menu = document.querySelector('#menu');
      return menu && getComputedStyle(menu).display !== 'none';
    }, null, { timeout: 5000 });

    await page.click('.carPick[data-car="0"]');
    await page.click('#startBtn');
    await page.waitForFunction(() => {
      const menu = document.querySelector('#menu');
      const message = document.querySelector('#topmsg')?.textContent || '';
      return menu && getComputedStyle(menu).display === 'none' && message.includes('gestart');
    }, null, { timeout: 5000 });

    await page.waitForTimeout(1500);

    const gameState = await page.evaluate(() => {
      const canvas = document.querySelector('#gl');
      const gl = canvas?.getContext('webgl');
      const message = document.querySelector('#topmsg')?.textContent || '';
      const menu = document.querySelector('#menu');
      let pixelDiversity = 0;
      let nonBackgroundPixels = 0;
      if (gl && canvas.width >= 8 && canvas.height >= 8) {
        const distinct = new Set();
        const pixel = new Uint8Array(4);
        const xs = [0.18, 0.38, 0.50, 0.62, 0.82];
        const ys = [0.44, 0.54, 0.64, 0.74, 0.84, 0.92];
        for (const y of ys) {
          for (const x of xs) {
            gl.readPixels(
              Math.min(canvas.width - 1, Math.floor(canvas.width * x)),
              Math.min(canvas.height - 1, Math.floor(canvas.height * (1 - y))),
              1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel
            );
            const rgb = [pixel[0], pixel[1], pixel[2]];
            distinct.add(rgb.join(','));
            // Matches render()'s gl.clearColor(.035, .09, .14, 1).
            if (Math.hypot(rgb[0] - 9, rgb[1] - 23, rgb[2] - 36) > 42) nonBackgroundPixels++;
          }
        }
        pixelDiversity = distinct.size;
      }
      return {
        hasWebGL: !!gl,
        width: canvas?.width || 0,
        height: canvas?.height || 0,
        menuHidden: !!menu && getComputedStyle(menu).display === 'none',
        message,
        pixelDiversity,
        nonBackgroundPixels
      };
    });

    if (!gameState.hasWebGL || gameState.width < 8 || gameState.height < 8) {
      throw new Error('Gamecanvas heeft geen geldige grootte: ' + JSON.stringify(gameState));
    }
    if (!gameState.menuHidden) throw new Error('Startmenu verdween niet: ' + JSON.stringify(gameState));
    if (/3D-renderfout|3D starten mislukt|arena lijkt leeg|tekent geen volledig speelveld/i.test(gameState.message)) {
      throw new Error('WebGL-arena faalt: ' + JSON.stringify(gameState));
    }
    if (gameState.pixelDiversity < 5 || gameState.nonBackgroundPixels < 5) {
      throw new Error('De 3D-canvas lijkt leeg of uniform: ' + JSON.stringify(gameState));
    }
    if (pageErrors.length) throw new Error('JavaScript-fouten: ' + pageErrors.join(' | '));

    console.log('WEBGL_SMOKE_TEST_PASS ' + JSON.stringify({ initialState, gameState }));
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error('WEBGL_SMOKE_TEST_FAIL', error.stack || error);
  process.exit(1);
});
