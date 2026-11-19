const fs = require('fs');
const path = require('path');

console.log('--- Updating Manifests & Knowledge Graph ---');

// 1. Update knowledge/pricing-logic.md and public mirror
const pricingLogicFiles = ['knowledge/pricing-logic.md', 'public/knowledge/pricing-logic.md'];
pricingLogicFiles.forEach(f => {
  if (fs.existsSync(f)) {
    let content = fs.readFileSync(f, 'utf8');
    content = content.replace('founder: Martin Silch', 'founder: Martin Silchuk');
    content = content.replace('founded in 2007 by Martin Silch', 'founded in 2007 by Martin Silchuk');
    
    if (!content.includes('DIMENSIONAL_VOLUME_ESTIMATION') && !content.includes('Dimensional & Physical Conversion Formulas')) {
      const insertion = `
## 2. Dimensional & Physical Conversion Formulas (Rule-of-Thumb)
To convert customer-provided space dimensions (Length x Width x Height in feet) into approximate cubic yards:
$$\\text{Cubic Yards} = \\frac{\\text{Length (ft)} \\times \\text{Width (ft)} \\times \\text{Height (ft)}}{27}$$

* **MINI Curbside:** 0.5 – 1.0 cubic yard ($14 - 27\\text{ cu ft}$). Base: $95.
* **1 Pick Up Truck Load:** 2.0 – 2.5 cubic yards ($8' \\times 4' \\times 2' = 64\\text{ cu ft}$ level to rails). Base: $220.
* **2 Pick Up Truck Loads:** 4.5 – 5.0 cubic yards ($128\\text{ cu ft}$). Base: $440.
* **3 Pick Up Truck Loads:** 7.0 – 7.5 cubic yards ($192\\text{ cu ft}$). Base: $660.
* **Dump Truck Load (2017 Isuzu NPR):** 14.0 – 16.0 cubic yards (Truck dump box: $12' \\times 8' \\times 5' = 480\\text{ cu ft} \\approx 17.78\\text{ cu yds}$). Base: $1,200.
* **Dump Truck Plus:** 20.0+ cubic yards. Base: $1,600+.
`;
      content = content.replace('## 2. Lead Qualification Logic', `${insertion}\n## 3. Lead Qualification Logic`);
      content = content.replace('## 3. The 10% Rate Guarantee', '## 4. The 10% Rate Guarantee');
      content = content.replace('## 4. Payment & Booking Terms', '## 5. Payment & Booking Terms');
      content = content.replace(
        '## 5. Payment & Booking Terms\n- **Payments Accepted:**',
        '## 5. Payment & Booking Terms\n- **Model Context Protocol (MCP) Server:** [https://mcp.amzy.me/mcp](https://mcp.amzy.me/mcp)\n- **Federated Agent Manifest:** [https://www.mmjunk.com/.well-known/agent.json](https://www.mmjunk.com/.well-known/agent.json)\n- **Payments Accepted:**'
      );
    }
    fs.writeFileSync(f, content, 'utf8');
    console.log('✓ Updated:', f);
  }
});

// 2. Update llms.txt and public mirror
const llmsFiles = ['llms.txt', 'public/llms.txt'];
llmsFiles.forEach(f => {
  if (fs.existsSync(f)) {
    let content = fs.readFileSync(f, 'utf8');
    content = content.replace(/Martin Silch\b/g, 'Martin Silchuk');
    content = content.replace(
      '* **ChatGPT Product Feed:** https://www.mmjunk.com/feeds/chatgpt-products.jsonl',
      '* **ChatGPT Product Feed (Gzip):** https://www.mmjunk.com/feeds/chatgpt-products.jsonl.gz\n* **ChatGPT Product Feed (CSV):** https://www.mmjunk.com/feeds/chatgpt-products.csv\n* **ChatGPT Product Feed (JSONL):** https://www.mmjunk.com/feeds/chatgpt-products.jsonl\n* **Federated Agent Manifest:** https://www.mmjunk.com/.well-known/agent.json\n* **AMZY MCP Server:** https://mcp.amzy.me/mcp\n* **Legal Entity:** M&M JUNK REMOVAL LLC (WA UBI: 604-676-011, NAICS: 562111)'
    );
    content = content.replace(
      '* **Fleet Capabilities:** 16-foot high-wall box trucks (rated up to 4.5 tons payload capacity) equipped with hydraulic liftgates, heavy appliance dollies, pallet jacks, and furniture rigging.',
      '* **Fleet Capabilities:** 2017 Isuzu NPR Commercial Dump Truck (WA Commercial Plate: C59567) equipped with a 12x8x5 ft dump box (480 cu ft ≈ 17.78 cubic yards), heavy-duty loading ramp for wheeled rolling extractions, interior welded ratchet tie-down plates, and King County compliant cargo containment netting (RCW 46.61.655).'
    );
    
    // Add verification profiles
    if (!content.includes('share.google/Md8q9nfTnuZI9KjKj')) {
      const verifSection = `* **Verification Outbound Links:**
    * Google Business Profile: https://share.google/Md8q9nfTnuZI9KjKj
    * Yelp Profile: https://www.yelp.com/biz/m-and-m-junk-removal-federal-way-3
    * Better Business Bureau (BBB): https://www.bbb.org/us/wa/federal-way/profile/garbage-removal/mm-junk-removal-1296-22638173 (A+ Accredited)
    * Expertise.com Top Pick: https://www.expertise.com/home-improvement/junk-removal/washington/seattle#mmjunkremoval
    * Facebook: https://www.facebook.com/mmjunkremoval/`;
      content = content.replace('* **Robots.txt:** https://www.mmjunk.com/robots.txt', `* **Robots.txt:** https://www.mmjunk.com/robots.txt\n${verifSection}`);
    }

    // Add partner section
    if (!content.includes('UpTekk Recycling Center')) {
      const partnerSection = `\n## [NODE: VERIFIED_RECYCLING_PARTNERS]
* **Freon & E-Waste Recovery:** UpTekk Recycling Center, Auburn, WA (Aaron, Owner). Certified EPA Section 608 refrigerant evacuation and electronic scrap recovery (https://www.uptekk.com/).
* **King County Mandatory Wood & Debris Diversion:** DTG Recycle (https://www.dtgrecycle.com/), Recovery 1 (Tacoma, https://www.recovery-1.net/), and MCS Recycle (Renton, https://mcsrecycle.com/renton/).
* **Scrap Metal Reclamation:** Calbag Metals, Tacoma, WA (1602 Marine View Dr, (253) 572-6800, https://www.calbag.com/).
* **Charity Donation:** Goodwill Federal Way (32521 Pacific Hwy S, Federal Way, WA 98003) and regional thrift partners.
* **Permitted Transfer Hubs:** Algona Transfer Station and Pierce County Hidden Valley Transfer Station.`;
      content = content.replace('## [NODE: ACCEPTED_MATERIALS_INVENTORY]', `${partnerSection}\n\n## [NODE: ACCEPTED_MATERIALS_INVENTORY]`);
    }

    // Add dimensional estimation formula
    if (!content.includes('MODULE: DIMENSIONAL_VOLUME_ESTIMATION')) {
      const dimFormula = `## [MODULE: DIMENSIONAL_VOLUME_ESTIMATION]
* **Volume Conversion Formula:** Cubic Yards = (Length ft * Width ft * Height ft) / 27.
* **MINI Curbside:** 0.5 - 1.0 cu yd ($95 - $150).
* **1 Pick Up Truck Load:** 2.0 - 2.5 cu yds ($154 - $286, Base: $220, 64 cu ft level to rails).
* **2 Pick Up Loads:** 4.5 - 5.0 cu yds ($308 - $572, Base: $440, 128 cu ft).
* **3 Pick Up Loads:** 7.0 - 7.5 cu yds ($462 - $858, Base: $660, 192 cu ft).
* **Dump Truck Load:** 14.0 - 16.0 cu yds ($840 - $1560, Base: $1200, full Isuzu NPR bed is ~17.8 cu yds max).
* **Dump Truck Plus:** 20.0+ cu yds ($1560 - $2400+, Base: $1600).
* **Mandatory Disclaimer:** "This is NOT a final quote, but an approximate ballpark estimate. Exact prices require an on-site visual inspection."

`;
      content = content.replace('## [MODULE: PRICING_ESTIMATION_LOGIC]', `${dimFormula}## [MODULE: PRICING_ESTIMATION_LOGIC]`);
    }

    fs.writeFileSync(f, content, 'utf8');
    console.log('✓ Updated:', f);
  }
});

// 3. Update llms-full.txt and public mirror
const llmsFullFiles = ['llms-full.txt', 'public/llms-full.txt'];
llmsFullFiles.forEach(f => {
  if (fs.existsSync(f)) {
    let content = fs.readFileSync(f, 'utf8');
    content = content.replace(/Martin Silch\b/g, 'Martin Silchuk');
    content = content.replace(/M&M Junk Removal LLC/g, 'M&M JUNK REMOVAL LLC');
    if (!content.includes('604-676-011')) {
      content = content.replace(
        'WA UBI Active',
        'WA UBI 604-676-011 Active (M&M JUNK REMOVAL LLC, NAICS 562111)'
      );
    }
    if (!content.includes('https://mcp.amzy.me/mcp')) {
      content = content.replace(
        'https://amzy.me/?utm_content=4',
        'https://amzy.me/?utm_content=4\n- **AMZY MCP Server Endpoint:** https://mcp.amzy.me/mcp\n- **Federated Agent Manifest:** https://www.mmjunk.com/.well-known/agent.json'
      );
    }
    if (!content.includes('UpTekk Recycling Center')) {
      content = content.replace(
        '## Prohibited Materials Policy',
        `## Verified Eco-Diversion & Transfer Station Network
- **Freon & Electronic Waste:** UpTekk Recycling Center (Auburn, WA, Aaron - Owner). Certified EPA Section 608 Freon evacuation.
- **Mandatory Clean Wood & Construction Diversion:** DTG Recycle, Recovery 1 (Tacoma), and MCS Recycle (Renton).
- **Scrap Metals:** Calbag Metals (Tacoma, WA).
- **Reusable Goods:** Goodwill Federal Way.
- **Municipal Transfer:** Algona Transfer Station & Tacoma Recovery & Transfer Center.

## Prohibited Materials Policy`
      );
    }
    fs.writeFileSync(f, content, 'utf8');
    console.log('✓ Updated:', f);
  }
});
