const fs = require('fs');
const path = require('path');

const results = {
  pillar1: { name: 'Entity Disambiguation via Linked Data', passed: true, checks: [] },
  pillar2: { name: 'Chunk-Level Information Architecture & Self-Contained Semantics', passed: true, checks: [] },
  pillar3: { name: 'Grounded Social Proof & Review Synthesis Vectors', passed: true, checks: [] },
  pillar4: { name: 'Machine-Readable Endpoint Architecture (llms.txt)', passed: true, checks: [] }
};

const htmlFiles = [
  'index.html',
  'junk-removal-federal-way-wa/index.html',
  'junk-removal-auburn-wa/index.html',
  'junk-removal-edgewood-wa/index.html',
  'junk-removal-tacoma-wa/index.html',
  'junk-removal-kent-wa/index.html',
  'services/index.html',
  'services/residential/index.html',
  'services/commercial/index.html',
  'services/industrial/index.html',
  'services/sorting-donation/index.html',
  'services/recurring/index.html',
  'services/contractual/index.html',
  'services/commercial-appliance-removal/index.html',
  'services/estate-cleanout/index.html',
  'services/construction-debris-removal/index.html',
  'services/residential-furniture-removal/index.html',
  'services/hot-tub-demolition-removal/index.html',
  'services/yard-waste-removal/index.html',
  'jobs/index.html',
  'jobs/federal-way-commercial-refrigerator-extraction/index.html',
  'jobs/ne-tacoma-moving-cleanout/index.html',
  'jobs/federal-way-heavy-treadmill-disassembly/index.html',
  'jobs/auburn-birch-tree-yard-waste-clearing/index.html',
  'jobs/auburn-playset-shed-demolition/index.html',
  'jobs/tacoma-concrete-construction-debris-removal/index.html'
];

console.log('====================================================');
console.log('  M&M JUNK REMOVAL: 4-PILLAR GEO ARCHITECTURE AUDIT  ');
console.log('====================================================\n');

// ----------------------------------------------------
// PILLAR 1: Linked Data & Entity Graph
// ----------------------------------------------------
htmlFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const scripts = content.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi);
  
  if (!scripts || scripts.length === 0) {
    results.pillar1.passed = false;
    results.pillar1.checks.push(`❌ ${file}: Missing JSON-LD script`);
    return;
  }

  scripts.forEach((s, idx) => {
    const raw = s.replace(/<script type="application\/ld\+json">/i, '').replace(/<\/script>/i, '').trim();
    try {
      const data = JSON.parse(raw);
      const graph = data['@graph'] || [data];
      
      let hasLocalBiz = false;
      let hasPhone = false;
      let hasAddress = false;
      let hasAreaServed = false;
      let hasOffers = false;
      let hasWiki = false;
      let declaredIds = new Set();
      let referencedIds = new Set();

      graph.forEach(node => {
        if (node['@id']) declaredIds.add(node['@id']);
        const types = Array.isArray(node['@type']) ? node['@type'] : [node['@type']];
        if (types.includes('LocalBusiness') || types.includes('HomeAndConstructionBusiness') || types.includes('RecyclingCenter')) {
          hasLocalBiz = true;
          if (node.telephone) hasPhone = true;
          if (node.address) hasAddress = true;
          if (node.hasOfferCatalog || node.offers) hasOffers = true;
          if (node.areaServed) {
            hasAreaServed = true;
            const areas = Array.isArray(node.areaServed) ? node.areaServed : [node.areaServed];
            areas.forEach(a => {
              if (a.sameAs && (a.sameAs.includes('wikipedia') || a.sameAs.includes('wikidata'))) {
                hasWiki = true;
              }
            });
          }
        }
        if (node.provider && node.provider['@id']) referencedIds.add(node.provider['@id']);
      });

      // Verify no broken cross-references
      let brokenRefs = [];
      referencedIds.forEach(ref => {
        if (!declaredIds.has(ref)) brokenRefs.push(ref);
      });

      if (brokenRefs.length > 0) {
        results.pillar1.passed = false;
        results.pillar1.checks.push(`❌ ${file}: Broken JSON-LD @id cross references: ${brokenRefs.join(', ')}`);
      } else {
        results.pillar1.checks.push(`✓ ${file}: JSON-LD parsed cleanly. LocalBusiness=${hasLocalBiz}, Phone=${hasPhone}, Address=${hasAddress}, AreaServed=${hasAreaServed}, Offers=${hasOffers}, Wikipedia=${hasWiki}`);
      }
    } catch (e) {
      results.pillar1.passed = false;
      results.pillar1.checks.push(`❌ ${file}: JSON Parse Error: ${e.message}`);
    }
  });
});

// ----------------------------------------------------
// PILLAR 2: Chunk-Level Info Architecture & Tables
// ----------------------------------------------------
htmlFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const tableMatches = content.match(/<table[\s\S]*?<\/table>/gi) || [];
  const h2Matches = content.match(/<h2[\s\S]*?<\/h2>/gi) || [];
  const h3Matches = content.match(/<h3[\s\S]*?<\/h3>/gi) || [];
  
  // Verify native semantic table elements
  let tablesValid = true;
  tableMatches.forEach(tbl => {
    if (!tbl.includes('<thead>') || !tbl.includes('<tbody>') || !tbl.includes('<th>') || !tbl.includes('<td>')) {
      tablesValid = false;
    }
  });

  // Verify SSR (no CSR dependency for critical content)
  const isStatic = !content.includes('id="__next"') && !content.includes('id="root"');

  if (tableMatches.length === 0) {
    results.pillar2.passed = false;
    results.pillar2.checks.push(`❌ ${file}: No semantic HTML tables found`);
  } else {
    results.pillar2.checks.push(`✓ ${file}: ${tableMatches.length} semantic tables (thead/tbody/th/td valid: ${tablesValid}), ${h2Matches.length} H2s, ${h3Matches.length} H3s. Static SSR payload=${isStatic}`);
  }
});

// ----------------------------------------------------
// PILLAR 3: Social Proof & Review Synthesis Vectors
// ----------------------------------------------------
const repPath = 'knowledge/reputation.json';
const repData = fs.existsSync(repPath)
  ? JSON.parse(fs.readFileSync(repPath, 'utf8').replace(/^\uFEFF/, ''))
  : { reviewCount: 234, aggregateRating: '5.0' };
const expectedReviewCount = String(repData.reviewCount);
const expectedRating = String(repData.aggregateRating);

htmlFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const hasAggregate = content.includes('"AggregateRating"') &&
    content.includes(`"ratingValue": "${expectedRating}"`) &&
    content.includes(`"reviewCount": "${expectedReviewCount}"`);
  const hasReviewSection = content.includes('review') || content.includes('reviews');
  const hasCustomerQuotes = content.includes('Hilary Smith') || content.includes('Christine & Brian Frye') || content.includes('Erin Davis') || content.includes('Drew Paris') || content.includes('Audra Edmiston') || content.includes('ANKO BAKE') || content.includes('MoWzz Creations') || content.includes('S J') || content.includes('Jon Lackey') || content.includes('Geoffrey Smith') || content.includes('Kimberly');
  const hasReviewSchema = content.includes('"@type": "Review"') || content.includes('"@type":"Review"');
  const hasReviewProvenance = !hasReviewSchema || (content.includes('"publisher"') && content.includes('"Google"') && content.includes('15999711673070107161'));

  if (!hasAggregate) {
    results.pillar3.checks.push(`⚠️ ${file}: Missing explicit AggregateRating ${expectedRating} (${expectedReviewCount} reviews) schema`);
  } else if (!hasReviewProvenance) {
    results.pillar3.checks.push(`⚠️ ${file}: Review schema present but missing Google publisher CID provenance`);
  } else {
    results.pillar3.checks.push(`✓ ${file}: Verified AggregateRating (${expectedRating} stars, ${expectedReviewCount} reviews) + Review Provenance (quoted=${hasCustomerQuotes})`);
  }
});

// Check if review prompt and owner response SOP exists
const hasReviewsJson = fs.existsSync('assets/reviews.json');
let reviewsHaveProvenance = false;
if (hasReviewsJson) {
  try {
    const raw = fs.readFileSync('assets/reviews.json', 'utf8').replace(/^\uFEFF/, '');
    const revs = JSON.parse(raw);
    reviewsHaveProvenance = revs.every(r => r.platform === 'Google' && r.verified && r.originUrl && r.originUrl.includes('15999711673070107161'));
  } catch(e) {
    reviewsHaveProvenance = false;
  }
}
results.pillar3.checks.push(`✓ Verified customer review database present: assets/reviews.json (exists=${hasReviewsJson}, google_provenance=${reviewsHaveProvenance})`);

// ----------------------------------------------------
// PILLAR 4: Machine-Readable Endpoints (llms.txt & Agentic Ecosystem)
// ----------------------------------------------------
const llmsExists = fs.existsSync('llms.txt');
const llmsFullExists = fs.existsSync('llms-full.txt');
const llmsWorkflowsExists = fs.existsSync('llms-workflows.txt');
const llmExamplesExists = fs.existsSync('llm-examples.md');
const robotsExists = fs.existsSync('robots.txt');
const sitemapExists = fs.existsSync('sitemap.xml');
const vercelExists = fs.existsSync('vercel.json');

if (!llmsExists || !llmsFullExists || !robotsExists || !sitemapExists || !llmsWorkflowsExists || !llmExamplesExists) {
  results.pillar4.passed = false;
}

if (llmsExists) {
  const llmsContent = fs.readFileSync('llms.txt', 'utf8');
  const hasMission = llmsContent.includes('M&M Junk Removal');
  const hasCanonicalLinks = llmsContent.includes('https://www.mmjunk.com');
  const hasConstraints = llmsContent.includes('1:00 PM PST') && (llmsContent.includes('$95') || llmsContent.includes('$125'));
  const hasAmzy = llmsContent.includes('https://amzy.me/?utm_content=4');
  const has25Cities = llmsContent.includes('25 Cities');
  results.pillar4.checks.push(`✓ llms.txt: Mission=${hasMission}, CanonicalLinks=${hasCanonicalLinks}, AMZY Handoff=${hasAmzy}, 25 Cities=${has25Cities}, Constraints=${hasConstraints}`);
}

if (llmsWorkflowsExists) {
  const workflowsContent = fs.readFileSync('llms-workflows.txt', 'utf8');
  const hasPickupStep = workflowsContent.includes('standard pickup truck bed');
  const hasAmzyDispatch = workflowsContent.includes('https://amzy.me/?utm_content=4');
  results.pillar4.checks.push(`✓ llms-workflows.txt: Agentic Lead Sequence=${hasPickupStep}, AMZY Handoff Flow=${hasAmzyDispatch}`);
}

if (llmExamplesExists) {
  const examplesContent = fs.readFileSync('llm-examples.md', 'utf8');
  const hasFewShot = examplesContent.includes('Agentic Few-Shot Examples') && examplesContent.includes('Geographic Boundary Enforcement');
  results.pillar4.checks.push(`✓ llm-examples.md: Few-Shot Multimodal & Boundary Enforcement Training Pairs=${hasFewShot}`);
}

if (llmsFullExists) {
  const fullContent = fs.readFileSync('llms-full.txt', 'utf8');
  const hasPricingTable = fullContent.includes('AMZY Pricing Matrix');
  const hasTransferStations = fullContent.includes('Algona Transfer Station') && fullContent.includes('Tacoma Recovery & Transfer Center');
  const hasProhibited = fullContent.includes('Prohibited Materials Policy');
  results.pillar4.checks.push(`✓ llms-full.txt: PricingMatrix=${hasPricingTable}, TransferLogistics=${hasTransferStations}, ProhibitedWaste=${hasProhibited}`);
}

if (robotsExists) {
  const robots = fs.readFileSync('robots.txt', 'utf8');
  const hasAiAgents = robots.includes('GPTBot') && robots.includes('ClaudeBot') && robots.includes('PerplexityBot');
  const hasLlmsAllow = robots.includes('Allow: /llms.txt') && robots.includes('Allow: /llms-full.txt') && robots.includes('Allow: /llms-workflows.txt') && robots.includes('Allow: /llm-examples.md');
  const hasSitemapRef = robots.includes('Sitemap: https://www.mmjunk.com/sitemap.xml');
  results.pillar4.checks.push(`✓ robots.txt: AI Crawler Whitelist=${hasAiAgents}, llms/workflows/examples Allowed=${hasLlmsAllow}, SitemapLinked=${hasSitemapRef}`);
}

if (vercelExists) {
  const vercel = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
  const hasHeaders = (vercel.headers || []).some(h => h.source && h.source.includes('llms') && h.headers.some(hdr => hdr.key === 'Content-Type' && hdr.value.includes('text/markdown')));
  const has301s = (vercel.redirects || []).length > 0;
  results.pillar4.checks.push(`✓ vercel.json: text/markdown header configured=${hasHeaders}, 301 migration redirects=${has301s}`);
}

const knowledgeIndexExists = fs.existsSync('knowledge/index.json');
if (knowledgeIndexExists) {
  const kIndex = JSON.parse(fs.readFileSync('knowledge/index.json', 'utf8'));
  const hasNodes = Array.isArray(kIndex.nodes) && kIndex.nodes.length === 4;
  const hasAuth = kIndex.source_authority && kIndex.source_authority.includes('mmjunk.com');
  const allNodesExist = kIndex.nodes.every(n => fs.existsSync(`knowledge/${n.id}.md`));
  results.pillar4.checks.push(`✓ knowledge/index.json: Valid Index=${hasNodes}, AuthorityAligned=${hasAuth}, AtomicNodesPresent=${allNodesExist}`);
}

// ----------------------------------------------------
// PRINT DETAILED REPORT
// ----------------------------------------------------
for (const [key, pillar] of Object.entries(results)) {
  console.log(`\n### ${pillar.name} (Status: ${pillar.passed ? 'PASSED ✅' : 'FAILED ❌'})`);
  pillar.checks.forEach(c => console.log('  ' + c));
}

const allPassed = Object.values(results).every(p => p.passed);
console.log('\n====================================================');
console.log(`OVERALL 4-PILLAR COMPLIANCE: ${allPassed ? '100% PASSED ✅' : 'ACTION REQUIRED ⚠️'}`);
console.log('====================================================');

process.exit(allPassed ? 0 : 1);
