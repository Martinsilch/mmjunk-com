const fs = require('fs');

const allHtml = fs.readdirSync('.', { recursive: true })
  .filter(f => f.endsWith('.html') && !f.includes('archive') && !f.includes('.next'));

let totalReplacements = 0;

allHtml.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let fileReplacements = 0;
  
  // Replace internal hrefs ending with /
  content = content.replace(/href=["']((?:\.\.\/)*)(services|jobs|junk-removal-[a-z0-9-]+|privacy-policy)\/([^"'#]*?)["']/gi, (match, prefix, section, sub) => {
    // If sub has trailing slash or sub is empty
    let cleanSub = sub;
    if (cleanSub.endsWith('/')) {
      cleanSub = cleanSub.slice(0, -1);
    }
    const cleanLink = cleanSub ? `${prefix}${section}/${cleanSub}` : `${prefix}${section}`;
    fileReplacements++;
    return `href="${cleanLink}"`;
  });

  if (fileReplacements > 0) {
    fs.writeFileSync(file, content, 'utf8');
    totalReplacements += fileReplacements;
    console.log(`✓ ${file}: Cleaned ${fileReplacements} internal links`);
  }
});

console.log(`\nTotal internal link trailing slashes cleaned: ${totalReplacements}`);
