// Runs automatically after `npm version patch/minor/major`
// Updates the version badge in docs/index.html

const fs = require('fs');
const path = require('path');

const pkg = require('../package.json');
const version = pkg.version;

const htmlPath = path.join(__dirname, '../docs/index.html');
let html = fs.readFileSync(htmlPath, 'utf8');

// Replace <div class="logo-version">vX.X.X</div>
html = html.replace(
  /<div class="logo-version">v[^<]+<\/div>/,
  `<div class="logo-version">v${version}</div>`
);

fs.writeFileSync(htmlPath, html);
console.log(`docs/index.html updated to v${version}`);
