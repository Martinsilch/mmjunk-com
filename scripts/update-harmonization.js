const fs = require('fs');
const path = require('path');

console.log('--- Harmonizing llms-workflows.txt & llms files ---');

const workflowFiles = ['llms-workflows.txt', 'public/llms-workflows.txt'];
workflowFiles.forEach(f => {
  if (fs.existsSync(f)) {
    let content = fs.readFileSync(f, 'utf8');
    content = content.replace('$95 - $140', '$95 - $150');
    content = content.replace('$140 - $230', '$154 - $286 (Base: $220)');
    content = content.replace(
      /2 Pick Up Loads: \$230 - \$415[\s\S]*?Dump Truck Plus: \$1110 - \$1480/,
      '2 Pick Up Loads: $308 - $572 (Base: $440)\n        - 3 Pick Up Loads: $462 - $858 (Base: $660)\n        - Dump Truck Load: $840 - $1,560 (Base: $1,200)\n        - Dump Truck Plus: $1,560 - $2,400+ (Base: $1,600)'
    );
    content = content.replace(/Martin Silch\b/g, 'Martin Silchuk');
    fs.writeFileSync(f, content, 'utf8');
    console.log('✓ Successfully harmonized:', f);
  }
});
