const fs = require('fs');

const allHtml = fs.readdirSync('.', { recursive: true })
  .filter(f => f.endsWith('.html') && !f.includes('archive') && !f.includes('node_modules') && !f.includes('.next'));
console.log(`Auditing ${allHtml.length} active HTML files...`);

console.log('\n=== CHECKING ALL HTML FILES FOR FIXED INLINE WIDTHS > 280PX ===');
allHtml.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const matches = content.match(/style=["'][^"']*?(?:width|min-width):\s*(\d+)px[^"']*?["']/gi) || [];
  matches.forEach(m => {
    const num = parseInt(m.match(/(?:width|min-width):\s*(\d+)px/i)[1], 10);
    if (num > 280) {
      console.log(`⚠️ ${f}: ${m}`);
    }
  });
});

console.log('\n=== CHECKING ALL HTML FILES FOR LARGE MINMAX GRIDS ===');
allHtml.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const grids = content.match(/grid-template-columns:[^;"']+/gi) || [];
  grids.forEach(g => {
    const m = g.match(/minmax\((\d+)px/);
    if (m && parseInt(m[1], 10) > 240) {
      console.log(`⚠️ ${f}: ${g}`);
    }
  });
});
