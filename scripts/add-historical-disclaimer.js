const fs = require('fs');

const jobSlugs = [
  'federal-way-commercial-refrigerator-extraction',
  'auburn-birch-tree-yard-waste-clearing',
  'auburn-playset-shed-demolition',
  'basketball-court-wall-demolition-renton-skyway',
  'federal-way-heavy-treadmill-disassembly',
  'ne-tacoma-moving-cleanout',
  'tacoma-concrete-construction-debris-removal'
];

const disclaimerHtml = `
      <!-- Historical Service Context Disclaimer -->
      <aside class="job-historical-disclaimer" style="background: #f8fafc; border-left: 4px solid var(--primary); padding: 14px 18px; margin: 20px 0; border-radius: 6px; font-size: 0.88rem; color: #475569; line-height: 1.5;">
        <strong>Historical Field Operational Log:</strong> This case study documents a completed project performed under specific site conditions. Pricing, vehicle routing, disposal fees, and crew allocation reflect historical field parameters at the time of service and do not constitute current binding quotes. For current rates and instant route placement, see our <a href="../../.well-known/pricing.json" style="color: var(--primary); font-weight: 700;">Pricing Engine</a> ($95 base minimum, $220/pickup load equivalent) or <a href="https://amzy.me/?utm_content=4" target="_blank" rel="noopener noreferrer" style="color: var(--primary); font-weight: 700;">Book Online via AMZY</a>.
      </aside>`;

jobSlugs.forEach(slug => {
  const paths = [
    `jobs/${slug}/index.html`,
    `public/jobs/${slug}/index.html`
  ];

  paths.forEach(p => {
    if (fs.existsSync(p)) {
      let content = fs.readFileSync(p, 'utf8');
      if (!content.includes('job-historical-disclaimer')) {
        // Insert right after </header> inside <article class="job-article">
        content = content.replace('</header>', `</header>\n${disclaimerHtml}`);
        fs.writeFileSync(p, content, 'utf8');
        console.log(`Added historical disclaimer to ${p}`);
      }
    }
  });
});
