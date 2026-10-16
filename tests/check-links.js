const fs = require('fs');
const path = require('path');

const content = fs.readFileSync('index.html', 'utf8');
const regex = /href=["']([^"'#]+)["']/g;
let match;
const links = new Set();
while ((match = regex.exec(content)) !== null) {
  links.add(match[1]);
}

console.log(`Found ${links.size} distinct links in index.html`);
let broken = 0;
for (const link of links) {
  if (link.startsWith('http') || link.startsWith('tel:') || link.startsWith('mailto:') || link.startsWith('javascript:')) {
    continue;
  }
  let target = decodeURIComponent(link);
  if (target.endsWith('/')) {
    target = target.slice(0, -1);
  }
  const existsStatic = fs.existsSync(target) || fs.existsSync(target + '/index.html') || fs.existsSync(target + '.html');
  const existsNext = fs.existsSync(path.join('.next/server/app', target + '.html')) || fs.existsSync('app/[slug]');
  if (!existsStatic && !existsNext) {
    console.error(`❌ BROKEN LINK: "${link}" => File does not exist: "${target}"`);
    broken++;
  } else {
    console.log(`✓ OK: ${link}`);
  }
}

if (broken === 0) {
  console.log('\n✅ ALL INTERNAL LINKS IN INDEX.HTML ARE 100% VALID!');
} else {
  console.error(`\n❌ FOUND ${broken} BROKEN LINKS!`);
  process.exit(1);
}
