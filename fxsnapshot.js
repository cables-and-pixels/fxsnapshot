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
    url: 'http://localhost:3301/',
    width: 800,
    height: 800,
    timeout: 120,
    captureViewport: false,
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
  if (argv.captureViewport) {
    const capture = await page.screenshot()
    await fs.writeFile(filename, capture, (err) => {
      console.log(err ? err : filename);
    });
  } else {
    const base64 = await page.$eval('canvas', (el) => {
      return el.toDataURL();
    });
    const pureBase64 = base64.replace(/^data:image\/png;base64,/, "");
    const b = Buffer.from(pureBase64, "base64");
    await fs.writeFile(filename, b, (err) => {
      console.log(err ? err : filename);
    });
  }
};

const waitPreview = (page) => {
  return new Promise(async (resolve) => {
    page.evaluate(() => {
      return new Promise((_resolve) => {
        window.addEventListener('fxhash-preview', () => {
          _resolve();
        });
      });
    }).then(resolve);
  });
};

(async () => {

  let browser = await puppeteer.launch({
    ignoreHTTPSErrors: true,
    args: [
      '--use-gl=swiftshader',
    ],
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

  for (let i = 1; i <= total; i++) {
    await page.goto(argv.url);
    await waitPreview(page);
    const fxhash = await page.evaluate(() => window.$fx.hash);
    const iteration = String(i).padStart(4, '0');
    const f = `images/${iteration}-${fxhash}.png`;
    console.log(f);
    await saveFrame(page, f);
  }

  process.exit(0);

})();
