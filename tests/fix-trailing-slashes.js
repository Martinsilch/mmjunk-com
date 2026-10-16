const fs = require('fs');
const path = require('path');

// 1. Fix vercel.json redirect destinations: remove trailing slashes except for "/"
const vercelConfigPath = 'vercel.json';
const vercelConfig = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf8'));

let redirectsUpdated = 0;
vercelConfig.redirects = vercelConfig.redirects.map(r => {
  if (r.destination && r.destination.length > 1 && r.destination.endsWith('/')) {
    r.destination = r.destination.slice(0, -1);
    redirectsUpdated++;
  }
  return r;
});

fs.writeFileSync(vercelConfigPath, JSON.stringify(vercelConfig, null, 2) + '\n', 'utf8');
console.log(`Updated ${redirectsUpdated} redirect destinations in vercel.json.`);

// 2. Fix canonical and og:url in all HTML files
const allHtml = fs.readdirSync('.', { recursive: true })
  .filter(f => f.endsWith('.html') && !f.includes('archive'));

let canonicalsUpdated = 0;
let ogsUpdated = 0;

allHtml.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // Replace canonical trailing slashes: https://www.mmjunk.com/xyz/ => https://www.mmjunk.com/xyz
  // but DO NOT touch https://www.mmjunk.com/
  content = content.replace(/(<link\s+rel=["']canonical["']\s+href=["']https:\/\/www\.mmjunk\.com\/[a-zA-Z0-9_\-\/]+?)\/(["'])/gi, (match, prefix, suffix) => {
    if (prefix === 'https://www.mmjunk.com' || prefix === '<link rel="canonical" href="https://www.mmjunk.com') {
      return match;
    }
    canonicalsUpdated++;
    changed = true;
    return `${prefix}${suffix}`;
  });

  // Replace og:url trailing slashes
  content = content.replace(/(<meta\s+property=["']og:url["']\s+content=["']https:\/\/www\.mmjunk\.com\/[a-zA-Z0-9_\-\/]+?)\/(["'])/gi, (match, prefix, suffix) => {
    if (prefix === 'https://www.mmjunk.com' || prefix.endsWith('www.mmjunk.com')) {
      return match;
    }
    ogsUpdated++;
    changed = true;
    return `${prefix}${suffix}`;
  });

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated canonical / og:url in: ${file}`);
  }
});

console.log(`Updated ${canonicalsUpdated} canonical tags and ${ogsUpdated} og:url tags.`);
