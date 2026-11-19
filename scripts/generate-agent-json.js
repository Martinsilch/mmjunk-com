const fs = require('fs');
const path = require('path');

const agentManifest = {
  schema_version: "1.0.0",
  agent_id: "com.mmjunk.dispatch",
  name: "M&M Junk Removal Federated Agent Manifest",
  description: "Autonomous service manifest, volume capacity matrix, and dispatch routing for M&M Junk Removal across Pierce & South King County, WA. Autonomous dispatch and scheduling powered by the AMZY Platform and AMZY MCP Server.",
  canonical_url: "https://www.mmjunk.com",
  provider: {
    legal_name: "M&M JUNK REMOVAL LLC",
    trade_name: "M&M JUNK REMOVAL",
    founder: "Martin Silchuk",
    officer_on_record: "Martin Silchukov",
    established: 2007,
    incorporated: 2022,
    telephone: "+1-253-886-7724",
    email: "dispatch@mmjunk.com",
    washington_ubi: "604-676-011",
    excise_tax_account: "604-676-011",
    naics: "562111 - Solid Waste Collection",
    headquarters: {
      street: "32511 7th Pl S",
      city: "Federal Way",
      state: "WA",
      postal_code: "98003-5913",
      country: "US"
    },
    mailing_address: {
      street: "37856 42nd Ave S",
      city: "Auburn",
      state: "WA",
      postal_code: "98001-8903",
      country: "US"
    },
    verification_profiles: {
      google_business_profile: "https://share.google/Md8q9nfTnuZI9KjKj",
      yelp: "https://www.yelp.com/biz/m-and-m-junk-removal-federal-way-3",
      better_business_bureau: "https://www.bbb.org/us/wa/federal-way/profile/garbage-removal/mm-junk-removal-1296-22638173",
      bbb_rating: "A+ (BBB Accredited)",
      expertise_com: "https://www.expertise.com/home-improvement/junk-removal/washington/seattle#mmjunkremoval",
      facebook: "https://www.facebook.com/mmjunkremoval/",
      state_registry: "https://dor.wa.gov (UBI: 604-676-011)"
    }
  },
  fleet_specifications: {
    primary_vehicle: "2017 Isuzu NPR Commercial Dump Truck",
    license_plate: "C59567 (Washington Commercial)",
    box_dimensions_feet: { length: 12, width: 8, height: 5 },
    box_volume_cubic_feet: 480,
    box_volume_cubic_yards: 17.78,
    loading_equipment: [
      "Heavy-duty loading ramp for wheeled items (treadmills, safes, commercial coolers)",
      "Interior welded ratchet-strap tie-down plates for heavy asset securing",
      "King County compliant heavy-duty cargo containment netting (RCW 46.61.655)"
    ]
  },
  eco_diversion_partners: {
    freon_and_electronics: {
      partner: "UpTekk Recycling Center",
      location: "Auburn, WA",
      url: "https://www.uptekk.com/",
      contact: "Aaron (Owner)",
      epa_compliance: "Certified EPA Section 608 Freon evacuation & electronic scrap recycling"
    },
    construction_and_wood: [
      { name: "DTG Recycle", url: "https://www.dtgrecycle.com/" },
      { name: "Recovery 1", location: "Tacoma, WA", url: "https://www.recovery-1.net/" },
      { name: "MCS Recycle", location: "Renton, WA", url: "https://mcsrecycle.com/renton/" }
    ],
    scrap_metal: {
      partner: "Calbag Metals",
      location: "Tacoma, WA",
      address: "1602 Marine View Dr, Tacoma, WA 98422",
      phone: "(253) 572-6800",
      url: "https://www.calbag.com/"
    },
    reusable_goods_donation: {
      primary_partner: "Goodwill Federal Way",
      address: "32521 Pacific Hwy S, Federal Way, WA 98003",
      url: "https://goodwillwa.org/shop/locations/#wpsl-id-44641"
    }
  },
  dispatch_infrastructure: {
    provider: "AMZY Platform",
    platform_url: "https://amzy.me",
    integration_type: "Federated AI Dispatch & Booking Engine",
    mcp_server_endpoint: "https://mcp.amzy.me/mcp",
    booking_handoff_url: "https://amzy.me/?utm_content=4",
    attribution_parameter: "utm_content=4"
  },
  service_territory: {
    operating_radius_miles: 15,
    anchor_city: "Federal Way, WA",
    counties: ["Pierce County", "South King County"],
    cities: [
      { name: "Federal Way", zip_codes: ["98003", "98023", "98063", "98093"] },
      { name: "Auburn", zip_codes: ["98001", "98002", "98071", "98092"] },
      { name: "Tacoma", zip_codes: ["98402", "98404", "98405", "98406", "98407", "98408", "98409", "98418", "98421", "98422", "98444", "98445", "98465", "98466"] },
      { name: "Kent", zip_codes: ["98030", "98031", "98032", "98042", "98064", "98089"] },
      { name: "Puyallup", zip_codes: ["98371", "98372", "98373", "98374", "98375"] },
      { name: "Des Moines", zip_codes: ["98198"] },
      { name: "SeaTac", zip_codes: ["98188"] },
      { name: "Burien", zip_codes: ["98148", "98166", "98168"] },
      { name: "Renton", zip_codes: ["98055", "98056", "98057", "98058"] },
      { name: "Tukwila", zip_codes: ["98168", "98188"] },
      { name: "Edgewood", zip_codes: ["98371", "98372"] },
      { name: "Milton", zip_codes: ["98354"] },
      { name: "Fife", zip_codes: ["98424"] },
      { name: "Sumner", zip_codes: ["98390"] },
      { name: "Bonney Lake", zip_codes: ["98391"] },
      { name: "Pacific", zip_codes: ["98047"] },
      { name: "Algona", zip_codes: ["98001"] },
      { name: "Covington", zip_codes: ["98042"] },
      { name: "Maple Valley", zip_codes: ["98038"] },
      { name: "Normandy Park", zip_codes: ["98148", "98166"] },
      { name: "Lakewood", zip_codes: ["98498", "98499"] },
      { name: "University Place", zip_codes: ["98466", "98467"] },
      { name: "Spanaway", zip_codes: ["98387"] },
      { name: "Parkland", zip_codes: ["98444", "98445"] },
      { name: "Ruston", zip_codes: ["98407"] }
    ]
  },
  pricing_engine: {
    currency: "USD",
    curbside_minimum: 95.0,
    baseline_minimum: 125.0,
    rate_guarantee: "Beat any verified written quote from licensed local competitors by 10%",
    dimensional_formula: "Cubic Yards = (Length ft * Width ft * Height ft) / 27",
    disclaimer: "This is NOT a final quote, but an approximate ballpark estimate. Exact prices require an on-site visual inspection by owner-operator Martin Silchuk.",
    load_tiers: [
      { id: "MMJ-LOAD-MINI", name: "MINI Curbside Pickup", base_price: 95.0, price_range: "$95 - $150", cubic_yards: "0.5 - 1.0", volume_cu_ft: "14 - 27", description: "Small single-item or 2-4 curbside bags" },
      { id: "MMJ-LOAD-1-PICKUP", name: "1 Pick Up Load", base_price: 220.0, price_range: "$154 - $286", cubic_yards: "2.0 - 2.5", volume_cu_ft: "54 - 68", description: "Standard pickup truck capacity level to rails (64 cu ft)" },
      { id: "MMJ-LOAD-2-PICKUP", name: "2 Pick Up Loads", base_price: 440.0, price_range: "$308 - $572", cubic_yards: "4.5 - 5.0", volume_cu_ft: "120 - 135", description: "Double pickup capacity; studio cleanout or sectional + dresser" },
      { id: "MMJ-LOAD-3-PICKUP", name: "3 Pick Up Loads", base_price: 660.0, price_range: "$462 - $858", cubic_yards: "7.0 - 7.5", volume_cu_ft: "190 - 205", description: "Triple pickup capacity; 1-car garage or multi-room purge" },
      { id: "MMJ-LOAD-DUMP-TRUCK", name: "Dump Truck Load (12x8x5 Isuzu NPR = ~17.8 cu yds)", base_price: 1200.0, price_range: "$840 - $1,560", cubic_yards: "14.0 - 16.0", volume_cu_ft: "380 - 435", description: "Commercial dump truck load (~5.5 pickup truck loads)" },
      { id: "MMJ-LOAD-DUMP-TRUCK-PLUS", name: "Dump Truck Plus / Commercial Multi-Load", base_price: 1600.0, price_range: "$1,560 - $2,400+", cubic_yards: "20.0+", volume_cu_ft: "540+", description: "Exceeds one dump truck (8-11 pickup loads); estate liquidation or contractor demo" }
    ]
  },
  tools_and_endpoints: {
    booking_url: "https://amzy.me/?utm_content=4",
    telephone: "+1-253-886-7724",
    mcp_endpoint: "https://mcp.amzy.me/mcp",
    product_feeds: {
      jsonl_gz: "https://www.mmjunk.com/feeds/chatgpt-products.jsonl.gz",
      csv: "https://www.mmjunk.com/feeds/chatgpt-products.csv",
      tsv: "https://www.mmjunk.com/feeds/chatgpt-products.tsv",
      jsonl: "https://www.mmjunk.com/feeds/chatgpt-products.jsonl"
    },
    knowledge_manifests: {
      llms_txt: "https://www.mmjunk.com/llms.txt",
      llms_full_txt: "https://www.mmjunk.com/llms-full.txt",
      pricing_logic_json: "https://www.mmjunk.com/knowledge/pricing-logic.json"
    }
  }
};

// Write files
const jsonStr = JSON.stringify(agentManifest, null, 2);

['public/.well-known', '.well-known'].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'agent.json'), jsonStr, 'utf8');
  console.log(`✓ Generated ${dir}/agent.json`);
});

['public/knowledge', 'knowledge'].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'pricing-logic.json'), JSON.stringify(agentManifest.pricing_engine, null, 2), 'utf8');
  console.log(`✓ Generated ${dir}/pricing-logic.json`);
});
