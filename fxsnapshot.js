const puppeteer = require('puppeteer');
const fs = require('fs').promises;

if (isNaN(parseInt(process.argv[2]))) {
  console.log('usage: node fxsnapshot.js <count>');
  process.exit(1);
}

const url = 'http://localhost:8080';

const viewportSettings = {
  deviceScaleFactor: 1,
  width: 800,
  height: 800,
};

const saveFrame = async (page, filename) => {
  const base64 = await page.$eval('canvas', (el) => {
    return el.toDataURL();
  });
  const pureBase64 = base64.replace(/^data:image\/png;base64,/, "");
  const b = Buffer.from(pureBase64, "base64");
  await fs.writeFile(filename, b, (err) => {
    console.log(err ? err : filename);
  });
};

(async () => {

  let browser = await puppeteer.launch({
    ignoreHTTPSErrors: true,
  });

  if (!browser) {
    process.exit(1);
  }

  let page = await browser.newPage();
  await page.setViewport(viewportSettings);

  if (!page) {
    process.exit(1);
  }

  page.on('error', (err) => {
    console.log('PAGER ERROR:', err);
  });

  let total = parseInt(process.argv[2]);
  let count = 1;
  page.on('console', async (msg) => {
    const text = msg.text();
    let m = text.match(/TRIGGER PREVIEW/);
    if (m) {
      const fxhash = await page.evaluate(() => window.fxhash);
      const iteration = String(count).padStart(4, '0');
      const f = `images/${iteration}-${fxhash}.png`;
      console.log(f);
      await saveFrame(page, f);
      if (count < total) {
        count += 1;
        await page.goto(url);
      }
      else {
        process.exit(0);
      }
    }
  });

  await page.goto(url);

})();
