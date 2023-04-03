Fxsnapshot
==========

Capture a set of images from your local token.

Install node:
https://nodejs.org/en/download/

Clone this repository into its own directory.

Install dependencies:
```
npm install
```

Capture *count* images:
```
node fxsnapshot.js <count>
```

Use custom URL (http://localhost:3301/ by default):
```
node fxsnapshot.js --url="file://..." <count>
```

The script will work only if you use a canvas and call
$fx.preview(). Your token must be launched in parallel.
