// fxsnapshot.js

// Based on fxhash website-capture service:
// https://github.com/fxhash/gcloud-functions/tree/master/website-capture

const puppeteer = require('puppeteer');
const fs = require('fs').promises;

const argv = require('yargs')
  .scriptName('fxsnapshot')
  .usage(
    '$0 [options] <count>',
    'Capture a set of images from your local token.',
    (yargs) => {
      yargs.positional('count', {
        describe: 'Number of images to capture',
        type: 'number',
      })
  })
  .default({
    url: 'http://localhost:8080/',
    width: 800,
    height: 800,
    timeout: 120,
  })
  .describe('url', 'Local token url')
  .help()
  .version(false)
  .example([
    ['$0 256', 'Capture 256 images'],
    ['$0 --url="file://.../" 256', 'Use custom url'],
  ])
  .argv;

const viewportSettings = {
  deviceScaleFactor: 1,
  width: argv.width,
  height: argv.height,
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
  await page.setDefaultNavigationTimeout(argv.timeout * 1000);

  if (!page) {
    process.exit(1);
  }

  page.on('error', (err) => {
    console.log('PAGER ERROR:', err);
  });

  let total = parseInt(argv.count);
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
        await page.goto(argv.url);
      }
      else {
        process.exit(0);
      }
    }
  });

  await page.goto(argv.url);

})();
