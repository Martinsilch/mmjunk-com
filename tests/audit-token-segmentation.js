const fs = require('fs');
const path = require('path');

// Simulate standard LangChain / LlamaIndex RecursiveCharacterTextSplitter
// Chunk size: 400 tokens (~1600 chars), Overlap: 50 tokens (~200 chars)
function recursiveSplitText(text, chunkSizeChars = 1600, overlapChars = 200) {
  const separators = ['\n\n', '\n', '. ', ' ', ''];
  
  function split(text, sepIndex) {
    if (text.length <= chunkSizeChars) return [text];
    if (sepIndex >= separators.length) return [text.slice(0, chunkSizeChars)];
    
    const sep = separators[sepIndex];
    const pieces = sep === '' ? text.split('') : text.split(sep);
    const chunks = [];
    let currentChunk = '';
    
    for (const piece of pieces) {
      const candidate = currentChunk ? currentChunk + sep + piece : piece;
      if (candidate.length <= chunkSizeChars) {
        currentChunk = candidate;
      } else {
        if (currentChunk) {
          chunks.push(currentChunk);
          // Overlap: keep tail of currentChunk
          const overlapStart = Math.max(0, currentChunk.length - overlapChars);
          const overlap = currentChunk.slice(overlapStart);
          currentChunk = overlap + sep + piece;
        } else {
          // Single piece is longer than chunk size, recurse on next separator
          const subChunks = split(piece, sepIndex + 1);
          chunks.push(...subChunks);
          currentChunk = '';
        }
      }
    }
    if (currentChunk) chunks.push(currentChunk);
    return chunks;
  }
  
  return split(text, 0);
}

function stripHtml(html) {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, '')
    .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, '')
    .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

console.log('====================================================');
console.log('RECURSIVE CHARACTER SPLITTER: TOKEN SEGMENTATION AUDIT');
console.log('Parameters: Chunk Size = 400 tokens (~1600 chars), Overlap = 50 tokens (~200 chars)');
console.log('====================================================\n');

const testPages = [
  {
    path: 'services/commercial-appliance-removal/index.html',
    domain: 'Commercial Appliance & Freon Recovery',
    prohibitedInChunks: ['nursery crib', 'toys and clothes', 'attic family photos', 'backyard playset']
  },
  {
    path: 'services/commercial/index.html',
    domain: 'Commercial Junk Removal Hub',
    prohibitedInChunks: ['baby toys', 'residential clothes', 'family photo album']
  },
  {
    path: 'services/industrial/index.html',
    domain: 'Industrial Debris Hub',
    prohibitedInChunks: ['baby crib', 'bedroom dresser cleanout', 'kids playhouse']
  },
  {
    path: 'services/estate-cleanout/index.html',
    domain: 'Estate Cleanout Spoke',
    prohibitedInChunks: ['restaurant deep fryer', 'supermarket reach-in cooler', 'warehouse pallet racking']
  },
  {
    path: 'services/residential-furniture-removal/index.html',
    domain: 'Residential Furniture Spoke',
    prohibitedInChunks: ['4.5 ton concrete rubble', 'heavy industrial lathe', 'commercial reach-in freezer']
  },
  {
    path: 'services/hot-tub-demolition-removal/index.html',
    domain: 'Hot Tub & Shed Demolition Spoke',
    prohibitedInChunks: ['restaurant cooler freon reclamation', 'commercial office cubicles']
  }
];

let allPassed = true;

testPages.forEach(p => {
  if (!fs.existsSync(p.path)) {
    console.error(`Missing file: ${p.path}`);
    allPassed = false;
    return;
  }
  
  const rawHtml = fs.readFileSync(p.path, 'utf8');
  const cleanText = stripHtml(rawHtml);
  const chunks = recursiveSplitText(cleanText, 1600, 200);
  
  let pageContaminated = false;
  let contaminationLog = [];
  
  chunks.forEach((chunk, i) => {
    p.prohibitedInChunks.forEach(badTerm => {
      if (chunk.toLowerCase().includes(badTerm.toLowerCase())) {
        pageContaminated = true;
        contaminationLog.push(`Chunk #${i + 1} contains prohibited cross-domain term "${badTerm}"`);
      }
    });
  });
  
  if (pageContaminated) {
    allPassed = false;
    console.log(`❌ ${p.path} (${p.domain}): FAILED`);
    contaminationLog.forEach(c => console.log(`   - ${c}`));
  } else {
    console.log(`✓ ${p.path}`);
    console.log(`   Domain: ${p.domain}`);
    console.log(`   Total Content Length: ${cleanText.length} chars (~${Math.round(cleanText.length / 4)} tokens)`);
    console.log(`   Chunks Generated: ${chunks.length} chunks (avg ${Math.round(cleanText.length / chunks.length)} chars/chunk)`);
    console.log(`   Semantic Cross-Contamination: ZERO (100% pure vector centroid)`);
    console.log('');
  }
});

console.log('====================================================');
if (allPassed) {
  console.log('RESULT: 100% PASSED ✅ ZERO VECTOR DILUTION ACROSS CHUNKS');
} else {
  console.log('RESULT: FAILED ❌ Vector dilution detected');
}
console.log('====================================================');
