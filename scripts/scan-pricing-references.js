const fs = require('fs');
const path = require('path');

const TARGETS = [
  '$154', '$286', '$308', '$572', '$462', '$858', '$840', '$1,560', '$1560', '$2,400', '$2400',
  '154', '286', '308', '572', '462', '858', '840', '1560', '2400'
];

const IGNORE_DIRS = ['node_modules', '.next', '.git', 'dist'];

function scanDir(dir, results = {}) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!IGNORE_DIRS.includes(entry.name)) {
        scanDir(fullPath, results);
      }
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (['.html', '.json', '.txt', '.md', '.ts', '.tsx', '.js'].includes(ext)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        const matches = [];
        if (content.includes('$154') || content.includes('$286')) matches.push('$154 - $286 (1 pickup)');
        if (content.includes('$308') || content.includes('$572')) matches.push('$308 - $572 (2 pickups)');
        if (content.includes('$462') || content.includes('$858')) matches.push('$462 - $858 (3 pickups)');
        if (content.includes('$840') || content.includes('$1,560') || content.includes('$1560')) matches.push('$840 - $1560 (dump truck)');
        if (content.includes('$2,400+') || content.includes('$2400+')) matches.push('$1560 - $2400+ (dump truck plus)');
        if (content.includes('$95 - $130') || content.includes('$95–$130')) matches.push('yard waste $85 - $130');
        if (matches.length > 0) {
          results[fullPath.replace(/\\/g, '/')] = matches;
        }
      }
    }
  }
  return results;
}

const res = scanDir('.');
console.log(JSON.stringify(res, null, 2));
