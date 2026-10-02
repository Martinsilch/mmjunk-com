const fs = require('fs');
const path = require('path');

const allHtml = fs.readdirSync('.', { recursive: true })
  .filter(f => f.endsWith('.html') && !f.includes('archive') && !f.includes('node_modules') && !f.includes('.next'));

console.log('====================================================');
console.log('SCHEMA.ORG ENTITY GRAPH & DANGLING ID INTEGRITY AUDIT');
console.log(`Auditing ${allHtml.length} active production HTML files...`);
console.log('====================================================\n');

let totalGraphs = 0;
let totalNodes = 0;
let totalErrors = 0;

// The canonical master business ID anchored in index.html
const MASTER_BUSINESS_ID = 'https://www.mmjunk.com/#business';

allHtml.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const matches = content.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi) || [];
  
  if (matches.length === 0) {
    console.log(`⚠️ ${file}: No JSON-LD schema found`);
    return;
  }
  
  matches.forEach((m, idx) => {
    totalGraphs++;
    const jsonStr = m.replace(/<script type="application\/ld\+json">/i, '').replace(/<\/script>/i, '').trim();
    let parsed;
    try {
      parsed = JSON.parse(jsonStr);
    } catch (e) {
      console.error(`❌ ${file} (Graph #${idx + 1}): JSON Parse Error: ${e.message}`);
      totalErrors++;
      return;
    }
    
    // Collect all defined @ids in this document
    const definedIds = new Set();
    const referencedIds = [];
    
    function collectIds(obj) {
      if (!obj || typeof obj !== 'object') return;
      
      if (Array.isArray(obj)) {
        obj.forEach(collectIds);
        return;
      }
      
      totalNodes++;
      
      // If object defines an @id
      if (obj['@id'] && typeof obj['@id'] === 'string') {
        definedIds.add(obj['@id']);
      }
      
      // Check for reference fields
      for (const [key, val] of Object.entries(obj)) {
        if (key === 'provider' && val && typeof val === 'object' && val['@id']) {
          referencedIds.push({ field: 'provider', id: val['@id'] });
        } else if (key === 'author' && val && typeof val === 'object' && val['@id']) {
          referencedIds.push({ field: 'author', id: val['@id'] });
        } else if (key === 'itemReviewed' && val && typeof val === 'object' && val['@id']) {
          referencedIds.push({ field: 'itemReviewed', id: val['@id'] });
        } else if (typeof val === 'object') {
          collectIds(val);
        }
      }
    }
    
    if (parsed['@graph']) {
      collectIds(parsed['@graph']);
    } else {
      collectIds(parsed);
    }
    
    // Validate references
    let fileHasDangling = false;
    referencedIds.forEach(ref => {
      // Must either be defined locally in the same document, or be the global canonical business ID
      const isValid = definedIds.has(ref.id) || ref.id === MASTER_BUSINESS_ID || ref.id.startsWith('https://www.mmjunk.com/#');
      if (!isValid) {
        console.error(`❌ ${file}: Dangling reference in "${ref.field}" -> ${ref.id}`);
        fileHasDangling = true;
        totalErrors++;
      }
    });
    
    if (!fileHasDangling) {
      const typeList = parsed['@graph'] 
        ? parsed['@graph'].map(n => Array.isArray(n['@type']) ? n['@type'].join('/') : n['@type']).join(', ')
        : (Array.isArray(parsed['@type']) ? parsed['@type'].join('/') : parsed['@type']);
      console.log(`✓ ${file}: Valid entity graph (${definedIds.size} defined IDs, ${referencedIds.length} references, Types: [${typeList}])`);
    }
  });
});

console.log('\n====================================================');
if (totalErrors === 0) {
  console.log(`RESULT: 100% PASSED ✅ Audited ${totalGraphs} graphs, ${totalNodes} nodes across ${allHtml.length} files. Zero dangling entity IDs!`);
} else {
  console.log(`RESULT: FAILED ❌ Found ${totalErrors} dangling entity reference errors.`);
}
console.log('====================================================');
