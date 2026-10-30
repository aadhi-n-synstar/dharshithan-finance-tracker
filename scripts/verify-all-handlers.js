const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const app = fs.readFileSync('js/app.js', 'utf8');

const eventAttrs = html.match(/on[a-z]+="[^"]+"/gi) || [];
const methodNames = new Set();

eventAttrs.forEach(attr => {
  const code = attr.replace(/^on[a-z]+="/i, '').replace(/"$/, '').trim();
  const matches = code.match(/app\.([a-zA-Z0-9_]+)/g);
  if (matches) {
    matches.forEach(m => methodNames.add(m.replace('app.', '')));
  }
});

console.log('Total app methods referenced in index.html:', methodNames.size);
const missing = [];
const existing = [];

Array.from(methodNames).sort().forEach(m => {
  // Check if method is defined as `m(` or `async m(` in app.js
  const re = new RegExp(`(^|\\s)(async\\s+)?${m}\\s*\\(`, 'm');
  if (re.test(app)) {
    existing.push(m);
  } else {
    missing.push(m);
  }
});

console.log('\n=== EXISTING METHODS (' + existing.length + ') ===');
console.log(existing.join(', '));

console.log('\n=== MISSING METHODS (' + missing.length + ') ===');
console.log(missing.join(', '));
