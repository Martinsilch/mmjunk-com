# M&M Junk Removal (MMJunk.com) — System & Ecosystem Manifest

**Version:** 5.0.0  
**Domain:** [https://www.mmjunk.com](https://www.mmjunk.com)  
**Maintained By:** M&M Junk Removal LLC (Founded 2007 by Martin Silch)  
**Primary Dispatch:** (253) 886-7724 | **Online Scheduler:** [AMZY Dispatch](https://amzy.me/?utm_content=4)  
**Google Review Provenance CID:** `15999711673070107161` (5.0 ★, 258+ Verified Reviews)  

---

## 1. Executive Summary & Purpose

MMJunk.com is an enterprise-grade local service platform built for **ultra-fast web performance**, **state-of-the-art Generative Engine Optimization (GEO)**, and **automated local SEO dominance**. 

Unlike conventional WordPress or template-based junk hauling websites, MMJunk.com operates as an **integrated programmatic ecosystem** combining:
1. **Zero-Latency Static Pre-rendering (SSG)** across all municipal spoke pages and service hubs.
2. **Dynamic Geographic Internal Linking Mesh** powered by the Haversine distance formula to circulate PageRank horizontally across neighboring cities.
3. **Automated Real-Time Telemetry Ingestion** via webhooks (scale tickets, dump receipts, YouTube field proof, verified Google/Yelp reviews).
4. **Machine-Readable AI Layer (`/llms.txt`)** structured for AI search engines (ChatGPT Search, Perplexity, Claude, Gemini, Google Search Generative Experience).
5. **Unified Tag Management & Tracking** via Google Tag Manager (`GTM-5QB83C38`) with instant GA4 and Google Ads event dispatching.

---

## 2. Complete Ecosystem Architecture

```mermaid
flowchart TD
    subgraph Operational_Inputs [Field Telemetry & Ingestion]
        Truck[Field Hauling Truck] -->|Scale Ticket / Job Log| AMZY_API[/api/ingest-job]
        GReviews[Google My Business] -->|Review Webhook| GRev_API[/api/webhooks/google-reviews]
        YelpReviews[Yelp Business] -->|Review Webhook| Yelp_API[/api/webhooks/yelp]
        YouTube[YouTube Shorts] -->|Field Videos| YT_API[/api/sync/youtube]
    end

    subgraph Core_Engine [Data Layer & Resolution]
        AMZY_API --> DB[(Prisma ORM / SQLite)]
        GRev_API --> DB
        Yelp_API --> DB
        YT_API --> DB
        GeoResolver[lib/geo-resolver.ts<br/>25 Municipalities + GPS + Haversine Mesh]
    end

    subgraph Build_And_SSG [Next.js App Router v14]
        DB --> SSG_Builder[Next.js SSG / ISR Engine]
        GeoResolver --> SSG_Builder
        SSG_Builder --> HubSpoke[51 Pre-rendered Static Pages]
        HubSpoke --> MasterLocations[/locations Hub]
        HubSpoke --> CitySpokes[/junk-removal-*-wa Spokes]
        HubSpoke --> JobCases[/jobs/* Job Proof Cases]
        HubSpoke --> ServiceClusters[/services/* Service Hubs]
    end

    subgraph Vercel_Edge [Edge CDN & Security]
        HubSpoke --> VercelCDN[Vercel Global Edge Network]
        VercelCDN --> EdgeCache[Edge Cache & Revalidation Tags]
    end

    subgraph Consuming_Clients [End Users & AI Agents]
        VercelCDN --> Browsers[Web Visitors - 0ms Render Blocking]
        VercelCDN --> GTM[Google Tag Manager GTM-5QB83C38]
        VercelCDN --> LLMs[AI Agents via /llms.txt, /llms-full.txt]
    end
```

---

## 3. Core Subsystems

### Subsystem A: The Geographic Mesh Engine (`lib/geo-resolver.ts`)
* **25 Authorized Municipalities:** Every city across South King and Pierce Counties is registered with strict metadata:
  * Official City Name, County (`King County` | `Pierce County`), Authorized ZIP Codes.
  * Exact GPS Coordinates `[latitude, longitude]`.
  * Canonical Wikidata URI (e.g. `https://www.wikidata.org/wiki/Q852586` for Federal Way).
  * Hyper-local neighborhood clusters, primary transit corridors (e.g. SR-18, I-5, SR-167), certified regional transfer stations, and donation non-profit partners.
* **Haversine Distance Algorithm (`getNearbyMunicipalities`):**
  * Rather than creating spammy sitewide footer links, every city spoke page dynamically computes its **top 4 physically adjacent neighbors**.
  * Renders the **"Also Serving Nearby Communities"** component on each spoke page with exact driving distances, connecting corridors, and keyword-rich anchor text.
  * **SEO Benefit:** Creates a topographic mesh that circulates PageRank horizontally, eliminates orphan/doorway page risk, and boosts organic rankings in cross-municipal border zones.
* **Semantic Neighborhood Clustering & Micro-Entity Containment (`getNeighborhoodEntities`):**
  * Over 100+ micro-neighborhoods (e.g. Twin Lakes, Campus Reserve, Lakeland Hills, Proctor District, Point Ruston) are mapped to their specific postal codes and centroid coordinates.
  * **Google-Compliant `containedInPlace` Schema:** Injects structured `Place` entities into `areaServed` and `AchieveAction` schemas nested within the parent Wikidata City entity, capturing hyper-local queries without triggering Google Search Console breadcrumb errors.
  * **Visible On-Page Badges:** Renders interactive postal-code-anchored neighborhood badges (e.g. `📍 Twin Lakes (98023)`) linking search intent directly to local service areas.

### Subsystem B: Hub-and-Spoke Hierarchy
* **Master Location Hub (`app/locations/page.tsx`):**
  * Serves as the central directory categorizing operations by regional sectors (King County South, Pierce County North, Valley Logistics Corridor).
* **25 Municipal Spokes (`app/[slug]/page.tsx`):**
  * URL pattern: `/junk-removal-[city]-wa`
  * Features 8 distinct content sections: Hero & Instant Booking, Localized Pricing Matrix, Verified Field Telemetry Table, Local Client Reviews, Social Proof/YouTube signals, Geographic Mesh Links, and localized FAQs.
* **Verified Job Stories (`app/jobs/[slug]/page.tsx`):**
  * Real customer case studies documenting equipment used, landfill tickets, tonnage hauled, and neighborhood context.
* **Service Cluster Landing Pages (`services/`):**
  * 12 distinct service hubs (Residential, Commercial, Industrial, Appliance Removal, Estate Cleanout, Hot Tub Demolition, Yard Waste, etc.).

### Subsystem C: Telemetry & Ingestion Pipelines
* `/api/ingest-job`: Receives webhook payloads when a truck completes a haul, logging weight, disposal facility, and receipts.
* `/api/webhooks/google-reviews`: Digests new 5-star Google reviews and validates Google CID provenance (`15999711673070107161`). (See [**Google Review Pipeline & Growth Architecture (`docs/GOOGLE_REVIEWS_PIPELINE.md`)**](file:///c:/Users/local_z5ft2sj/Documents/M&M%20Junk%20Removal/Dev/MMJunk.com/docs/GOOGLE_REVIEWS_PIPELINE.md)).
* `/api/webhooks/yelp`: Ingests verified Yelp reviews.
* `/api/sync/youtube`: Syncs field videos directly from YouTube into localized city showcases.
* **Instant Invalidation:** Ingestion endpoints invoke Next.js `revalidatePath()` and `revalidateTag()` to update static edge caches within seconds.

### Subsystem D: The 4-Pillar Generative Engine Optimization (GEO) Layer
MMJunk.com strictly adheres to the 4-Pillar GEO architecture verified by `tests/audit-pillars.js`:
1. **Pillar 1: Entity Disambiguation via Linked Data:**
   * Full Schema.org JSON-LD graphs on every page (`LocalBusiness`, `HomeAndConstructionBusiness`, `RecyclingCenter`).
   * Explicit Wikidata and Wikipedia URIs in `areaServed`.
   * Unbroken `@id` cross-referencing.
2. **Pillar 2: Chunk-Level Semantic Info Architecture:**
   * Native semantic HTML tables (`<thead>`, `<tbody>`, `<th>`, `<td>`) displaying the AMZY Pricing Matrix.
   * Completely static SSR/SSG rendering — zero dependency on client-side JavaScript to render text or pricing.
3. **Pillar 3: Grounded Social Proof & Review Synthesis Vectors:**
   * Verified `AggregateRating` (5.0 stars, 258 verified reviews).
   * Verified Google review provenance linked to CID `15999711673070107161`.
   * Grounded customer quotes from real clients across Auburn, Federal Way, Tacoma, Kent, etc.
4. **Pillar 4: Machine-Readable Endpoint Architecture:**
   * `/llms.txt`: Master AI router and brand constitution.
   * `/llms-full.txt`: Full technical compendium, transfer logistics, and prohibited hazardous materials policy.
   * `/llms-workflows.txt`: Step-by-step agentic execution flows for AI models.
   * `/llm-examples.md`: Few-shot training pairs and geographic boundary enforcement directives.
   * `/knowledge/`: Atomic markdown nodes (`pricing-logic.md`, `estate-cleanout.md`, `reputation.json`, `index.json`).

### Subsystem E: Conversion Tracking & Analytics
* **Google Tag Manager Container:** `GTM-5QB83C38` embedded in `<head>` and `<body>` across all 51 Next.js pages and static fallback templates.
* **Event Dispatcher (`gtag_report_conversion`):**
  * Dispatches conversion events directly to `window.dataLayer`.
  * Fires on all AMZY scheduling links (`https://amzy.me/?utm_content=4`) and telephone clicks (`tel:2538867724`).
  * Mapped to Google Ads Conversion ID `AW-1064983468/urRRCJDHq6obEKy36fsD`.

---

## 4. Build System & Quality Verification

### Production Build Command
```bash
# Compiles all TypeScript, generates Prisma artifacts, minifies assets, and builds 51 static SSG pages:
npm run build
# Or directly via Node:
node ./node_modules/next/dist/bin/next build
```

### Automated Compliance Testing Suite
```bash
# 1. Automated 4-Pillar GEO Compliance Audit (Schema, Semantic Tables, Social Proof, llms.txt):
node tests/audit-pillars.js

# 2. Comprehensive 53-URL Route & Live Link Audit:
node tests/audit-53-urls.js

# 3. Asset Minification (CSS & JS):
node scripts/minify-assets.js
```

---

## 5. Directory & File Guide

```
MMJunk.com/
├── app/
│   ├── [slug]/page.tsx           # Dynamic Spoke Page Engine (25 city pages + Mesh Links)
│   ├── jobs/[slug]/page.tsx      # Job Proof Case Study Engine
│   ├── locations/page.tsx        # Master Regional Location Hub
│   ├── layout.tsx                # Global Root Layout (GTM-5QB83C38 + Favicons)
│   ├── sitemap.ts                # Dynamic XML Sitemap Generator
│   └── api/                      # Telemetry & Webhook Ingestion Routes
├── lib/
│   ├── geo-resolver.ts           # 25 Cities, Coordinates, Metadata & Haversine Mesh
│   ├── db.ts                     # Prisma Database Client
│   └── reputation.ts             # Centralized Review & Rating Metrics
├── knowledge/                    # Atomic Knowledge Graph Nodes (Pricing, Protocols)
├── public/                       # Static Assets, Fallback HTML, Favicons
├── tests/
│   ├── audit-pillars.js          # Core 4-Pillar GEO Compliance Test
│   └── audit-53-urls.js          # Full URL & Schema Validator
├── index.html                    # High-Performance Static Homepage (98-100 PageSpeed)
├── llms.txt                      # Master LLM Router
├── llms-full.txt                 # Extended Technical Documentation
├── llms-workflows.txt            # AI Agent Interaction Workflows
├── llm-examples.md               # Multimodal Few-Shot Examples
├── robots.txt                    # Crawler Directives (Whitelisting AI Bots)
├── SYSTEM_MANIFEST.md            # This System Manifest
└── README.md                     # Repository Guide & Quick Start
```

---

## 6. Deployment & Hosting Protocol

* **Repository:** `https://github.com/Martinsilch/mmjunk-com.git` (`main` branch)
* **Hosting Platform:** Vercel Edge Network
* **Edge Invalidation:** On every `git push origin main`, Vercel automatically runs the production build and deploys to the global edge within 30 seconds.
* **Cache Strategy:** Static files (`index.html`, assets, pre-rendered SSG pages) are cached globally with stale-while-revalidate headers. Dynamic webhooks trigger selective on-demand cache revalidation.
