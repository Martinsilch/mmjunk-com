const fs = require('fs');

const content = fs.readFileSync('index.html', 'utf8');
const regex = /href=["']([^"'#]+)["']/g;
let m;
const trailingLinks = new Set();
while ((m = regex.exec(content)) !== null) {
  const link = m[1];
  if (link.startsWith('http') || link.startsWith('tel:') || link.startsWith('mailto:') || link === '/') {
    continue;
  }
  if (link.endsWith('/')) {
    trailingLinks.add(link);
  }
}

console.log(`Found ${trailingLinks.size} internal links with trailing slash:`);
for (const link of trailingLinks) {
  console.log(` - ${link} => ${link.slice(0, -1)}`);
}
