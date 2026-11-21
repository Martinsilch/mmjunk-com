const fs = require('fs');
const path = require('path');

const targetBase = path.join(__dirname, '..', 'Agentic Files Library');
const brainDir = 'C:\\Users\\local_z5ft2sj\\.gemini\\antigravity\\brain\\bcac344d-f212-4413-b795-8f56305bbc5b';

const manifest = [
  {
    category: '01_AI_Manifests',
    description: 'Core AI crawler manifests, system prompts, few-shot examples, and robot directives.',
    files: [
      { src: 'llms.txt', name: 'llms.txt', desc: 'Primary LLM manifest defining company mission, canonical links, UBI, AMZY booking handoff, 25-city cluster.' },
      { src: 'llms-full.txt', name: 'llms-full.txt', desc: 'Full machine-readable knowledge base: volume tiers ($95-$1,600+), +/-20% variance rules, transfer logistics, disposal rules.' },
      { src: 'llms-workflows.txt', name: 'llms-workflows.txt', desc: 'Agentic conversational state-machine, lead intake sequence, and AMZY handoff protocol.' },
      { src: 'llm-examples.md', name: 'llm-examples.md', desc: 'Few-shot multimodal training pairs, negative prompt handling, boundary enforcement.' },
      { src: 'robots.txt', name: 'robots.txt', desc: 'AI crawler whitelist (GPTBot, ClaudeBot, PerplexityBot, Google-Extended) and feed permissions.' },
    ]
  },
  {
    category: '02_Well_Known_Agent_Protocols',
    description: 'Standardized agent discovery protocols and pricing projection endpoints under /.well-known/.',
    files: [
      { src: '.well-known/agent.json', name: 'agent.json', desc: 'Agent protocol discovery manifest: UBI, fleet specs, eco-partners, dispatch tools, AMZY MCP integration.' },
      { src: '.well-known/pricing.json', name: 'pricing.json', desc: 'Public machine-readable pricing engine projection ($95 hard floor, 3-component pricing, 6 volume tiers, unit rates).' },
      { src: '.well-known/security.txt', name: 'security.txt', desc: 'Standard security disclosure and vulnerability reporting protocol.' },
    ]
  },
  {
    category: '03_Knowledge_Graph_Nodes',
    description: 'Semantic knowledge nodes providing structured, citation-backed facts for search & reasoning engines.',
    files: [
      { src: 'knowledge/index.json', name: 'knowledge-index.json', desc: 'Master atomic knowledge graph indexing all service, operational, and reputation nodes.' },
      { src: 'knowledge/pricing-logic.json', name: 'pricing-logic.json', desc: 'Structured schema of the 3-component pricing engine ($95 floor, +/-20% weight adjustment, labor/access add-ons).' },
      { src: 'knowledge/pricing-logic.md', name: 'pricing-logic.md', desc: 'Operational pricing mechanics, variance caps, and franchise-comparison rules.' },
      { src: 'knowledge/commercial-recurring.md', name: 'commercial-recurring.md', desc: 'B2B commercial recurring hauling specs, invoicing terms, and loading bay protocols.' },
      { src: 'knowledge/estate-cleanout.md', name: 'estate-cleanout.md', desc: 'Full-property cleanout protocols, donation routing, executor coordination.' },
      { src: 'knowledge/industrial-scrap.md', name: 'industrial-scrap.md', desc: 'Ferrous/non-ferrous metals recovery, heavy rigging, machinery decommissioning.' },
      { src: 'knowledge/reputation.json', name: 'reputation.json', desc: 'Customer review dataset: Google & Yelp review metrics (258+ reviews, 5.0 rating).' },
      { src: 'knowledge/youtube-videos.json', name: 'youtube-videos.json', desc: 'Structured video proof catalog, geolocation coordinates, and transcript metadata.' },
      { src: 'knowledge/gsc-indexation-report.json', name: 'gsc-indexation-report.json', desc: 'Search engine indexation baseline and telemetry report.' },
    ]
  },
  {
    category: '04_ChatGPT_Product_Feeds',
    description: 'OpenAI spec-compliant product feeds for ChatGPT shopping and discovery.',
    files: [
      { src: 'feeds/chatgpt-products.csv', name: 'chatgpt-products.csv', desc: '26 service catalog SKUs in standard CSV format.' },
      { src: 'feeds/chatgpt-products.jsonl', name: 'chatgpt-products.jsonl', desc: '26 service catalog SKUs in uncompressed JSONL format.' },
      { src: 'feeds/chatgpt-products.tsv', name: 'chatgpt-products.tsv', desc: '26 service catalog SKUs in standard TSV format.' },
      { src: 'feeds/chatgpt-products.jsonl.gz', name: 'chatgpt-products.jsonl.gz', desc: 'Gzip-compressed JSONL feed required by OpenAI ChatGPT shopping engine.' },
      { src: 'scripts/catalog-source.js', name: 'catalog-source.js', desc: 'Single source of truth catalog defining all 26 services, pricing tiers, and attributes.' },
      { src: 'lib/feeds/chatgptProductFeed.ts', name: 'chatgptProductFeed.ts', desc: 'TypeScript feed engine generating schema-compliant rows and XML/JSON projections.' },
    ]
  },
  {
    category: '05_Automation_Scripts_and_Engines',
    description: 'Automated generation, diagnostic, and synchronization scripts that maintain agentic alignment.',
    files: [
      { src: 'scripts/generate-agent-json.js', name: 'generate-agent-json.js', desc: 'Compiles and validates .well-known/agent.json from live business variables.' },
      { src: 'scripts/generate-product-feed.js', name: 'generate-product-feed.js', desc: 'Builds CSV, TSV, JSONL, and GZIP product feeds from catalog-source.js.' },
      { src: 'scripts/app-wide-diagnostics.js', name: 'app-wide-diagnostics.js', desc: '1,561-check automated QA engine enforcing price harmony, UBI, single H1, and schema integrity.' },
      { src: 'scripts/update-manifests.js', name: 'update-manifests.js', desc: 'Synchronizes pricing matrices across llms.txt, llms-full.txt, and web pages.' },
      { src: 'scripts/scan-pricing-references.js', name: 'scan-pricing-references.js', desc: 'Scans all project files for any legacy or inconsistent pricing references.' },
      { src: 'scripts/sync-reputation.js', name: 'sync-reputation.js', desc: 'Fetches and synchronizes Google and Yelp customer reviews and sentiment metrics.' },
      { src: 'scripts/sync-youtube.js', name: 'sync-youtube.js', desc: 'Fetches job proof videos from YouTube Data API v3 and populates schema metadata.' },
    ]
  },
  {
    category: '06_API_Routes_and_Webhooks',
    description: 'Next.js App Router API endpoints for live agentic feeds and webhook ingestions.',
    files: [
      { src: 'app/api/feeds/chatgpt-products.jsonl/route.ts', name: 'feed-jsonl-route.ts', desc: 'Edge route serving dynamic JSONL feed with appropriate Content-Type & cache headers.' },
      { src: 'app/api/feeds/chatgpt-products.csv/route.ts', name: 'feed-csv-route.ts', desc: 'Edge route serving dynamic CSV product feed.' },
      { src: 'app/api/feeds/chatgpt-products.tsv/route.ts', name: 'feed-tsv-route.ts', desc: 'Edge route serving dynamic TSV product feed.' },
      { src: 'app/api/feeds/chatgpt-products.jsonl.gz/route.ts', name: 'feed-gzip-route.ts', desc: 'Edge route serving gzip-compressed product feed.' },
      { src: 'app/api/webhooks/amzy-job/route.ts', name: 'webhook-amzy-job-route.ts', desc: 'Webhook listener processing completed AMZY dispatches into static job stories.' },
      { src: 'app/api/webhooks/google-reviews/route.ts', name: 'webhook-google-reviews-route.ts', desc: 'Webhook updating Google reviews and aggregate star ratings.' },
      { src: 'app/api/webhooks/yelp/route.ts', name: 'webhook-yelp-route.ts', desc: 'Webhook updating Yelp reviews and aggregate star ratings.' },
      { src: 'app/api/ingest-job/route.ts', name: 'ingest-job-route.ts', desc: 'Endpoint accepting job completion data and triggering automated page generation.' },
    ]
  },
  {
    category: '07_Architecture_Blueprints',
    description: 'Comprehensive strategic engineering blueprints and architectural design documents.',
    files: [
      { src: path.join(brainDir, 'deep-dive-pricing-and-agentic-architecture-blueprint.md'), name: 'deep-dive-pricing-and-agentic-architecture-blueprint.md', desc: 'Deep dive on 3-component pricing engine, +/-20% variance model, and AMZY MCP integration.' },
      { src: path.join(brainDir, 'ai-readiness-10-of-10-blueprint.md'), name: 'ai-readiness-10-of-10-blueprint.md', desc: 'Strategic blueprint to achieve a perfect 10/10 AI readiness score across crawlers.' },
      { src: path.join(brainDir, 'master-implementation-blueprint.md'), name: 'master-implementation-blueprint.md', desc: 'Master blueprint for geographic authority, schema disambiguation, and entity trust.' },
      { src: path.join(brainDir, 'blueprint-3-future-proofing-and-semantic-triggers.md'), name: 'blueprint-3-future-proofing-and-semantic-triggers.md', desc: 'Semantic triggers and future-proofing against AI search engine algorithm updates.' },
      { src: path.join(brainDir, 'audit-2-deep-research-blueprint.md'), name: 'audit-2-deep-research-blueprint.md', desc: 'Audit analysis and comparative research report.' },
      { src: path.join(brainDir, 'ab-test-hero-consolidation-blueprint.md'), name: 'ab-test-hero-consolidation-blueprint.md', desc: 'Consolidation of A/B hero section into canonical single H1 Social Profile layout.' },
    ]
  }
];

let totalCopied = 0;
const report = [];

manifest.forEach(cat => {
  const catDir = path.join(targetBase, cat.category);
  if (!fs.existsSync(catDir)) {
    fs.mkdirSync(catDir, { recursive: true });
  }

  cat.files.forEach(f => {
    const srcPath = path.isAbsolute(f.src) ? f.src : path.join(__dirname, '..', f.src);
    const destPath = path.join(catDir, f.name);

    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, destPath);
      totalCopied++;
      report.push({
        category: cat.category,
        name: f.name,
        src: f.src,
        size: fs.statSync(destPath).size,
        desc: f.desc
      });
      console.log(`✓ Copied [${cat.category}] ${f.name} (${fs.statSync(destPath).size} bytes)`);
    } else {
      console.warn(`⚠️ Source file not found: ${srcPath}`);
    }
  });
});

// Generate comprehensive README.md in Agentic Files Library
let readme = `# Agentic Files Library (Personal Backup & Migration Repository)

> **Personal Use Archive**: This library consolidates all machine-readable manifests, agent discovery protocols, semantic knowledge nodes, ChatGPT product feeds, automation engines, and architecture blueprints powering the **M&M Junk Removal Agentic Architecture**.
> 
> *Use this directory to easily inspect, reference, or copy any agentic component to other projects.*

---

## 📂 Library Table of Contents

| Category | Description | File Count |
| :--- | :--- | :---: |
`;

manifest.forEach(cat => {
  const count = cat.files.filter(f => {
    const srcPath = path.isAbsolute(f.src) ? f.src : path.join(__dirname, '..', f.src);
    return fs.existsSync(srcPath);
  }).length;
  readme += `| [**${cat.category.replace(/_/g, ' ')}**](#${cat.category.toLowerCase()}) | ${cat.description} | **${count} files** |\n`;
});

readme += `\n**Total Archived Files:** **${totalCopied} files**\n\n---\n\n`;

manifest.forEach(cat => {
  readme += `## <a id="${cat.category.toLowerCase()}"></a>📁 ${cat.category.replace(/_/g, ' ')}\n\n`;
  readme += `_${cat.description}_\n\n`;
  readme += `| File Name | Original Source Path | Description |\n`;
  readme += `| :--- | :--- | :--- |\n`;

  cat.files.forEach(f => {
    const displaySrc = path.isAbsolute(f.src) ? path.basename(f.src) + ' (Brain Artifact)' : f.src;
    readme += `| \`${f.name}\` | \`${displaySrc}\` | ${f.desc} |\n`;
  });
  readme += `\n---\n\n`;
});

readme += `## 🚀 How to Reuse in Another Project

1. **Root AI Manifests (\`01_AI_Manifests\`)**:
   - Copy \`llms.txt\`, \`llms-full.txt\`, \`llms-workflows.txt\`, \`llm-examples.md\`, and \`robots.txt\` directly into the web root of your target site.
2. **Agent Discovery Protocols (\`02_Well_Known_Agent_Protocols\`)**:
   - Copy \`agent.json\` and \`pricing.json\` into the \`/.well-known/\` directory of your target domain.
3. **Knowledge Engine Nodes (\`03_Knowledge_Graph_Nodes\`)**:
   - Deploy these atomic JSON/MD files into \`/knowledge/\` and expose them via public URLs with \`Content-Type: application/json\` and \`text/markdown\`.
4. **ChatGPT Product Feeds (\`04_ChatGPT_Product_Feeds\`)**:
   - Host \`chatgpt-products.jsonl.gz\` and \`chatgpt-products.csv\` under \`/feeds/\` and submit to OpenAI Merchant Portal.
5. **Automation & Validation Scripts (\`05_Automation_Scripts_and_Engines\`)**:
   - Add \`generate-agent-json.js\`, \`generate-product-feed.js\`, and \`app-wide-diagnostics.js\` into your build/pre-commit pipeline.
6. **Architecture Blueprints (\`07_Architecture_Blueprints\`)**:
   - Comprehensive reference documents detailing the exact algorithms, prompt structures, and multi-tier pricing models.
`;

fs.writeFileSync(path.join(targetBase, 'README.md'), readme, 'utf8');
console.log(`\n🎉 Successfully archived ${totalCopied} files and generated README.md in Agentic Files Library!`);
