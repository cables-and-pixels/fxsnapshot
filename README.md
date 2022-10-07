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

Use custom URL (http://localhost:8080/ by default):
```
node fxsnapshot.js --url="file://..." <count>
```

The script will work only if you use a canvas and call
fxpreview(). Your token must be launched in parallel.
