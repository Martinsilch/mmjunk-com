const fs = require('fs');
const path = require('path');

// Read current index.html as base
const baseHtml = fs.readFileSync('index.html', 'utf8');

// Switcher Bar Component HTML
function getSwitcherBar(activeVersion) {
  return `
  <!-- PREVIEW MODE SWITCHER BAR -->
  <div class="preview-switcher-bar">
    <div class="preview-switcher-inner">
      <div class="preview-label">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style="flex-shrink:0;"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
        <span>UI/UX Preview: <strong>Hero Redesign</strong></span>
      </div>
      <div class="preview-nav-group">
        <a href="/preview-1" class="preview-nav-btn ${activeVersion === 1 ? 'preview-nav-btn--active' : ''}">
          ${activeVersion === 1 ? '● ' : ''}Concept 1: Operator Badge
        </a>
        <a href="/preview-2" class="preview-nav-btn ${activeVersion === 2 ? 'preview-nav-btn--active' : ''}">
          ${activeVersion === 2 ? '● ' : ''}Concept 2: Social Profile & Bio
        </a>
        <a href="/preview-3" class="preview-nav-btn ${activeVersion === 3 ? 'preview-nav-btn--active' : ''}">
          ${activeVersion === 3 ? '● ' : ''}Concept 3: Split-Screen Console
        </a>
        <a href="/" class="preview-nav-btn preview-nav-btn--return">
          ← Live Site
        </a>
      </div>
    </div>
  </div>
  `;
}

// Common styles for previews
const previewSharedStyles = `
<style id="preview-enhancement-styles">
/* Switcher Bar */
.preview-switcher-bar {
  position: sticky;
  top: 0;
  z-index: 999999;
  background: #090d16;
  border-bottom: 2px solid #ea580c;
  padding: 10px 16px;
  font-family: var(--font-sans);
  color: #ffffff;
  box-shadow: 0 4px 20px rgba(0,0,0,0.4);
}
.preview-switcher-inner {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
}
.preview-label {
  font-weight: 700;
  font-size: 0.88rem;
  color: #f97316;
  display: flex;
  align-items: center;
  gap: 8px;
}
.preview-nav-group {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.preview-nav-btn {
  padding: 6px 14px;
  border-radius: 9999px;
  font-size: 0.82rem;
  font-weight: 600;
  background: rgba(255,255,255,0.08);
  color: #e2e8f0;
  border: 1px solid rgba(255,255,255,0.15);
  transition: all 0.2s ease;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.preview-nav-btn:hover {
  background: rgba(234, 88, 12, 0.2);
  border-color: #ea580c;
  color: #ffffff;
}
.preview-nav-btn--active {
  background: #ea580c !important;
  color: #ffffff !important;
  border-color: #ea580c !important;
  box-shadow: 0 0 12px rgba(234, 88, 12, 0.6);
}
.preview-nav-btn--return {
  background: transparent;
  border-color: rgba(255,255,255,0.25);
  color: #94a3b8;
}

/* Verified checkmark SVG icon helper */
.verified-check-svg {
  display: inline-block;
  vertical-align: middle;
  color: #38bdf8;
  flex-shrink: 0;
}

/* Pulse animation */
@keyframes online-pulse {
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
  70% { transform: scale(1); box-shadow: 0 0 0 8px rgba(34, 197, 94, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
}
.pulse-online {
  animation: online-pulse 2s infinite;
}

/* ============================================================
   CONCEPT 1 STYLES: Operator Profile Badge in Hero
   ============================================================ */
.operator-profile-badge {
  display: flex;
  align-items: center;
  gap: 18px;
  background: rgba(15, 23, 42, 0.88);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border: 1px solid rgba(255, 255, 255, 0.16);
  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(234, 88, 12, 0.25);
  border-radius: 18px;
  padding: 16px 22px;
  margin: 0 0 24px 0;
  max-width: 740px;
}
.operator-avatar-box {
  position: relative;
  flex-shrink: 0;
  width: 82px;
  height: 82px;
}
.operator-avatar-img {
  width: 82px;
  height: 82px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #ea580c;
  display: block;
}
.operator-status-indicator {
  position: absolute;
  bottom: 0px;
  right: 0px;
  width: 18px;
  height: 18px;
  background: #22c55e;
  border: 3px solid #0f172a;
  border-radius: 50%;
}
.operator-badge-info {
  flex: 1;
  min-width: 0;
}
.operator-badge-header {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.operator-badge-name {
  font-size: 1.35rem;
  font-weight: 800;
  color: #ffffff;
  letter-spacing: -0.01em;
  margin: 0;
  line-height: 1.2;
}
.operator-badge-role {
  font-size: 0.88rem;
  color: #cbd5e1;
  margin: 4px 0 0 0;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.operator-chips-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  flex-wrap: wrap;
}
.operator-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.76rem;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.08);
  color: #e2e8f0;
  border: 1px solid rgba(255, 255, 255, 0.1);
}
.operator-chip--gold {
  background: rgba(245, 158, 11, 0.15);
  border-color: rgba(245, 158, 11, 0.35);
  color: #fbbf24;
}
.operator-badge-actions {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
@media (max-width: 640px) {
  .operator-profile-badge {
    flex-direction: column;
    align-items: flex-start;
    gap: 14px;
    padding: 14px 16px;
  }
  .operator-avatar-box {
    width: 68px;
    height: 68px;
  }
  .operator-avatar-img {
    width: 68px;
    height: 68px;
  }
  .operator-badge-actions {
    width: 100%;
  }
  .operator-badge-actions .btn {
    width: 100%;
    text-align: center;
    justify-content: center;
  }
}

/* ============================================================
   CONCEPT 2 STYLES: Social Profile Header & Bio Feed
   ============================================================ */
.concept2-hero-wrap {
  position: relative;
  background: #090d16;
  color: #ffffff;
  padding-bottom: 50px;
}
.concept2-cover {
  position: relative;
  height: 290px;
  overflow: hidden;
  background: #0b1120;
}
.concept2-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.8;
}
.concept2-cover-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(9,13,22,0.15) 0%, rgba(9,13,22,0.7) 70%, #090d16 100%);
}
.concept2-card-container {
  max-width: 1160px;
  margin: -80px auto 0;
  padding: 0 20px;
  position: relative;
  z-index: 5;
}
.concept2-profile-card {
  background: #111827;
  border: 1px solid #1f2937;
  border-radius: 24px;
  padding: 24px 28px;
  box-shadow: 0 24px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06);
}
.concept2-top-row {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}
.concept2-identity {
  display: flex;
  align-items: flex-end;
  gap: 20px;
}
.concept2-avatar-lg {
  width: 114px;
  height: 114px;
  border-radius: 50%;
  border: 4px solid #111827;
  box-shadow: 0 0 0 3px #ea580c;
  object-fit: cover;
  margin-top: -57px;
  background: #1f2937;
  flex-shrink: 0;
}
.concept2-name-title {
  padding-bottom: 4px;
}
.concept2-display-name {
  font-size: 1.65rem;
  font-weight: 800;
  color: #ffffff;
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 4px 0;
  line-height: 1.2;
}
.concept2-handle {
  font-size: 0.95rem;
  color: #94a3b8;
  font-weight: 500;
  margin: 0;
}
.concept2-action-btns {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.concept2-bio {
  font-size: 1.05rem;
  line-height: 1.65;
  color: #e2e8f0;
  margin: 0 0 18px 0;
}
.concept2-meta-strip {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
  font-size: 0.88rem;
  color: #94a3b8;
  padding-top: 14px;
  border-top: 1px solid rgba(255,255,255,0.08);
}
.concept2-meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
}
.concept2-pinned-post {
  margin-top: 24px;
  background: rgba(234, 88, 12, 0.08);
  border: 1px solid rgba(234, 88, 12, 0.3);
  border-radius: 16px;
  padding: 20px 24px;
}
.concept2-pinned-tag {
  font-size: 0.8rem;
  font-weight: 800;
  color: #ea580c;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 10px;
}
@media (max-width: 768px) {
  .concept2-card-container {
    margin-top: -60px;
    padding: 0 14px;
  }
  .concept2-profile-card {
    padding: 20px 16px;
  }
  .concept2-top-row {
    flex-direction: column;
    align-items: flex-start;
  }
  .concept2-identity {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  .concept2-avatar-lg {
    width: 88px;
    height: 88px;
    margin-top: -44px;
  }
  .concept2-action-btns {
    width: 100%;
    flex-direction: column;
  }
  .concept2-action-btns .btn {
    width: 100%;
    justify-content: center;
    text-align: center;
  }
}

/* ============================================================
   CONCEPT 3 STYLES: Split Screen Pro Headline + Dispatch Card
   ============================================================ */
.concept3-split-grid {
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  gap: 36px;
  align-items: center;
  margin-top: 10px;
}
.concept3-dispatch-card {
  background: rgba(17, 24, 39, 0.92);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 22px;
  padding: 24px;
  box-shadow: 0 20px 48px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(234, 88, 12, 0.35);
  position: relative;
  overflow: hidden;
}
.concept3-dispatch-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #ea580c, #f59e0b, #ea580c);
}
.concept3-card-status-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  margin-bottom: 18px;
}
.concept3-live-indicator {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.78rem;
  font-weight: 700;
  color: #22c55e;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: rgba(34, 197, 94, 0.12);
  padding: 4px 10px;
  border-radius: 9999px;
  border: 1px solid rgba(34, 197, 94, 0.3);
}
.concept3-profile-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}
.concept3-avatar {
  width: 78px;
  height: 78px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #ea580c;
  box-shadow: 0 4px 14px rgba(234, 88, 12, 0.4);
  flex-shrink: 0;
}
.concept3-owner-name {
  font-size: 1.35rem;
  font-weight: 800;
  color: #ffffff;
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  line-height: 1.2;
}
.concept3-owner-title {
  font-size: 0.86rem;
  color: #cbd5e1;
  margin: 3px 0 0 0;
}
.concept3-quote-box {
  background: rgba(255, 255, 255, 0.04);
  border-left: 3px solid #ea580c;
  padding: 12px 14px;
  border-radius: 0 10px 10px 0;
  font-size: 0.88rem;
  line-height: 1.5;
  color: #e2e8f0;
  margin-bottom: 18px;
  font-style: italic;
}
.concept3-stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 20px;
  text-align: center;
}
.concept3-stat-item {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: 10px 4px;
}
.concept3-stat-num {
  font-size: 1.15rem;
  font-weight: 800;
  color: #ffffff;
}
.concept3-stat-lbl {
  font-size: 0.7rem;
  color: #94a3b8;
  margin-top: 2px;
}
.concept3-card-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
@media (max-width: 960px) {
  .concept3-split-grid {
    grid-template-columns: 1fr;
    gap: 28px;
  }
}
</style>
`;

// Helper: SVG Verified checkmark
const verifiedSvg = `
<svg class="verified-check-svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" title="Verified Local Business Owner">
  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
</svg>`;

// ============================================================
// BUILD VERSION 1: The Verified Operator Card in Hero
// ============================================================
function buildVersion1() {
  let html = baseHtml;

  // 1. Update robots and canonical
  html = html.replace(
    /<meta name="robots"[^>]*>/i,
    `<meta name="robots" content="noindex, nofollow">`
  );
  html = html.replace(
    /<link rel="canonical"[^>]*>/i,
    `<link rel="canonical" href="https://www.mmjunk.com/preview-1">`
  );
  html = html.replace(
    /<title>.*?<\/title>/i,
    `<title>[Preview 1: Operator Badge] M&amp;M Junk Removal</title>`
  );

  // 2. Inject preview styles right before </head>
  html = html.replace('</head>', `${previewSharedStyles}\n</head>`);

  // 3. Inject switcher bar right after <body>
  html = html.replace('<body>', `<body>\n${getSwitcherBar(1)}`);

  // 4. Replace Hero Section
  const heroRegex = /<section class="hero" id="hero">[\s\S]*?<\/section>/;
  const newHeroHtml = `
    <section class="hero" id="hero">
      <picture class="hero__picture">
        <source media="(max-width: 768px)" srcset="/assets/images/team-hero-mobile.webp" width="320" height="426">
        <img class="hero__bg" 
             src="/assets/images/team-hero.webp" 
             alt="M&amp;M Junk Removal Team and Truck Fleet in Pierce &amp; South King County" 
             width="1920" height="1080" 
             fetchpriority="high" decoding="sync">
      </picture>
      <div class="hero__overlay"></div>

      <div class="container hero__content">
        
        <!-- OPERATOR PROFILE BADGE (Concept 1) -->
        <div class="operator-profile-badge">
          <div class="operator-avatar-box">
            <img class="operator-avatar-img" 
                 src="/assets/images/martin-silchuk-avatar.webp" 
                 alt="Martin Silchuk - Owner &amp; Lead Operator of M&amp;M Junk Removal" 
                 width="82" height="82">
            <div class="operator-status-indicator pulse-online" title="On Duty Today"></div>
          </div>
          <div class="operator-badge-info">
            <div class="operator-badge-header">
              <h2 class="operator-badge-name">Martin Silchuk</h2>
              ${verifiedSvg}
              <span class="live-pulse" style="margin-left: 4px;"></span>
              <span style="font-size: 0.78rem; font-weight: 700; color: #22c55e;">AVAILABLE TODAY</span>
            </div>
            <div class="operator-badge-role">
              <span>Owner &amp; Lead Operator</span>
              <span>•</span>
              <span>Pierce &amp; South King County (Est. 2007)</span>
            </div>
            <div class="operator-chips-bar">
              <span class="operator-chip operator-chip--gold">★ 5.0 (258+ Google &amp; Yelp Reviews)</span>
              <span class="operator-chip">Zero Franchise Overhead</span>
              <span class="operator-chip" style="color: #ea580c; font-weight: 800;">10% Rate Guarantee</span>
            </div>
          </div>
          <div class="operator-badge-actions">
            <a href="tel:2538867724" class="btn btn--outline-light btn--sm" aria-label="Call Martin directly">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
              (253) 886-7724
            </a>
          </div>
        </div>

        <div class="hero__eyebrow">
          <span>★</span> 19+ Years Serving WA (Founded 2007 by Martin Silchuk) • BBB AAA+ • Expertise.com Top Pick
        </div>

        <h1 class="hero__title">
          Fast, Friendly &amp; Fair-Priced Junk Removal in <span>Pierce &amp; South King County</span>
        </h1>

        <p class="hero__subtitle">
          "We Haul Junk to the Dump" — Fast, friendly, and fair-priced hauling by owner Martin Silchuk. Zero franchise overhead, upfront volume rates, and we match &amp; beat any licensed competitor's price by 10%!
        </p>

        <!-- Direct Booking & Dispatch Actions -->
        <div class="hero__cta-group" style="margin: 28px 0 32px 0;">
          <a href="https://amzy.me/?utm_content=4" target="_blank" rel="noopener noreferrer" onclick="gtag_report_conversion();" class="btn btn--primary btn--xl">
            <svg width="20" height="20" style="width:20px;height:20px;min-width:20px;flex-shrink:0;" viewBox="0 0 24 24" fill="currentColor"><path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2zm-7 5h5v5h-5z"/></svg>
            Book Online via AMZY in 30 Sec ↗
          </a>
          <a href="tel:2538867724" class="btn btn--outline-light btn--xl" aria-label="Call (253) 886-7724 for rapid dispatch">
            <svg width="20" height="20" style="width:20px;height:20px;min-width:20px;flex-shrink:0;" viewBox="0 0 24 24" fill="currentColor"><path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
            Call Dispatch: (253) 886-7724
          </a>
        </div>

        <div class="hero__badges">
          <div class="hero-badge">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/></svg>
            Licensed &amp; Insured (WA UBI Active)
          </div>
          <div class="hero-badge">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"/></svg>
            Privately Owned (Founded 2007)
          </div>
          <div class="hero-badge">
            <span style="font-weight:900; color:#ea580c;">10%</span>
            Rate Guarantee
          </div>
          <a href="#reviews" class="hero-badge" style="text-decoration:none; color:inherit;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
            258+ Verified Reviews (234 Google • 24 Yelp)
          </a>
          <div class="hero-badge">
            <span style="font-weight:800; color:#22c55e;">AAA+</span>
            Rated by BBB
          </div>
        </div>

      </div>
    </section>
  `;

  return html.replace(heroRegex, newHeroHtml);
}

// ============================================================
// BUILD VERSION 2: The Social Media Profile Page & Bio Feed
// ============================================================
function buildVersion2() {
  let html = baseHtml;

  // 1. Update robots and canonical
  html = html.replace(
    /<meta name="robots"[^>]*>/i,
    `<meta name="robots" content="noindex, nofollow">`
  );
  html = html.replace(
    /<link rel="canonical"[^>]*>/i,
    `<link rel="canonical" href="https://www.mmjunk.com/preview-2">`
  );
  html = html.replace(
    /<title>.*?<\/title>/i,
    `<title>[Preview 2: Social Profile] M&amp;M Junk Removal</title>`
  );

  // 2. Inject preview styles right before </head>
  html = html.replace('</head>', `${previewSharedStyles}\n</head>`);

  // 3. Inject switcher bar right after <body>
  html = html.replace('<body>', `<body>\n${getSwitcherBar(2)}`);

  // 4. Replace Hero Section
  const heroRegex = /<section class="hero" id="hero">[\s\S]*?<\/section>/;
  const newHeroHtml = `
    <section class="concept2-hero-wrap" id="hero">
      <!-- COVER BANNER (Truck Fleet & Mt Rainier Pacific Northwest Backdrop) -->
      <div class="concept2-cover">
        <img src="/assets/images/team-hero.webp" 
             alt="M&amp;M Junk Removal Fleet Cover Banner" 
             width="1920" height="1080" 
             fetchpriority="high">
        <div class="concept2-cover-overlay"></div>
      </div>

      <!-- SOCIAL PROFILE CONTAINER (Overlapping Cover) -->
      <div class="concept2-card-container">
        <div class="concept2-profile-card">
          <div class="concept2-top-row">
            <div class="concept2-identity">
              <img class="concept2-avatar-lg" 
                   src="/assets/images/martin-silchuk-avatar.webp" 
                   alt="Martin Silchuk Profile Picture" 
                   width="114" height="114">
              <div class="concept2-name-title">
                <h1 class="concept2-display-name">
                  Martin Silchuk
                  ${verifiedSvg}
                </h1>
                <p class="concept2-handle">
                  @mmjunk • Founder &amp; Lead Operator • Est. 2007
                </p>
              </div>
            </div>

            <!-- Social Action Bar -->
            <div class="concept2-action-btns">
              <a href="https://amzy.me/?utm_content=4" target="_blank" rel="noopener noreferrer" onclick="gtag_report_conversion();" class="btn btn--primary btn--md">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2zm-7 5h5v5h-5z"/></svg>
                Book in 30 Sec (AMZY) ↗
              </a>
              <a href="tel:2538867724" class="btn btn--outline-light btn--md" aria-label="Call Martin Silchuk directly">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
                Call: (253) 886-7724
              </a>
            </div>
          </div>

          <!-- Creator Bio -->
          <p class="concept2-bio">
            <strong>"We Haul Junk to the Dump"</strong> — Fast, friendly, and honest junk removal across Pierce &amp; South King County. When you call, you deal directly with me. Zero franchise overhead, upfront volume pricing, and we match &amp; beat any licensed competitor's price by 10%!
          </p>

          <!-- Social Meta Bar -->
          <div class="concept2-meta-strip">
            <div class="concept2-meta-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#ea580c"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"/></svg>
              <span>Pierce &amp; South King County, WA</span>
            </div>
            <div class="concept2-meta-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#38bdf8"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/></svg>
              <span>Licensed &amp; Insured (UBI Active)</span>
            </div>
            <a href="#reviews" class="concept2-meta-item" style="color: inherit; text-decoration: none;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#f59e0b"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
              <span><strong>258+ Verified Reviews</strong> (5.0 ★ Google &amp; Yelp)</span>
            </a>
            <div class="concept2-meta-item">
              <span class="live-pulse"></span>
              <span style="color: #22c55e; font-weight: 700;">Trucks on Standby Now</span>
            </div>
          </div>

          <!-- PINNED POST (The Core Commercial Offer) -->
          <div class="concept2-pinned-post">
            <div class="concept2-pinned-tag">
              📌 Pinned Offer • 10% Rate Match Guarantee
            </div>
            <div style="font-size: 1.15rem; font-weight: 700; color: #ffffff; margin-bottom: 6px;">
              Fast, Friendly &amp; Fair-Priced Junk Removal in 25 Local Communities
            </div>
            <div style="font-size: 0.92rem; color: #cbd5e1; line-height: 1.5; margin-bottom: 14px;">
              Don't pay corporate franchise markups of 20% to 40%. Get instant upfront pricing with AMZY or call Martin directly for rapid same-day dispatch.
            </div>
            <div style="display: flex; gap: 12px; flex-wrap: wrap;">
              <a href="https://amzy.me/?utm_content=4" target="_blank" rel="noopener noreferrer" class="btn btn--primary btn--sm">
                Get Instant Quote &amp; Schedule ↗
              </a>
              <a href="#pricing-matrix" class="btn btn--outline-light btn--sm">
                View Upfront Rate Matrix ↓
              </a>
            </div>
          </div>

        </div>
      </div>
    </section>
  `;

  return html.replace(heroRegex, newHeroHtml);
}

// ============================================================
// BUILD VERSION 3: Split-Screen Pro Headline + Dispatch Console
// ============================================================
function buildVersion3() {
  let html = baseHtml;

  // 1. Update robots and canonical
  html = html.replace(
    /<meta name="robots"[^>]*>/i,
    `<meta name="robots" content="noindex, nofollow">`
  );
  html = html.replace(
    /<link rel="canonical"[^>]*>/i,
    `<link rel="canonical" href="https://www.mmjunk.com/preview-3">`
  );
  html = html.replace(
    /<title>.*?<\/title>/i,
    `<title>[Preview 3: Split Console] M&amp;M Junk Removal</title>`
  );

  // 2. Inject preview styles right before </head>
  html = html.replace('</head>', `${previewSharedStyles}\n</head>`);

  // 3. Inject switcher bar right after <body>
  html = html.replace('<body>', `<body>\n${getSwitcherBar(3)}`);

  // 4. Replace Hero Section
  const heroRegex = /<section class="hero" id="hero">[\s\S]*?<\/section>/;
  const newHeroHtml = `
    <section class="hero" id="hero" style="min-height: unset; padding: 40px 0 60px;">
      <picture class="hero__picture">
        <source media="(max-width: 768px)" srcset="/assets/images/team-hero-mobile.webp" width="320" height="426">
        <img class="hero__bg" 
             src="/assets/images/team-hero.webp" 
             alt="M&amp;M Junk Removal Team and Truck Fleet" 
             width="1920" height="1080" 
             fetchpriority="high" decoding="sync">
      </picture>
      <div class="hero__overlay" style="opacity: 0.92;"></div>

      <div class="container hero__content" style="max-width: 1200px;">
        <div class="concept3-split-grid">
          
          <!-- LEFT COLUMN: Headline & High-Converting Value Prop -->
          <div>
            <div class="hero__eyebrow">
              <span>★</span> Locally Owned &amp; Operated Since 2007 • BBB AAA+
            </div>

            <h1 class="hero__title" style="font-size: clamp(2rem, 4.2vw, 2.9rem); line-height: 1.15; margin-bottom: 16px;">
              Fast, Friendly &amp; Fair-Priced Junk Removal in <span>Pierce &amp; South King County</span>
            </h1>

            <p class="hero__subtitle" style="margin-bottom: 24px; font-size: 1.05rem;">
              "We Haul Junk to the Dump" — Save 10% compared to corporate franchises. Instant online estimates, upfront flat rates, zero hidden fees, and certified eco-sorting across 25 local communities.
            </p>

            <div class="hero__cta-group" style="margin: 0 0 28px 0;">
              <a href="https://amzy.me/?utm_content=4" target="_blank" rel="noopener noreferrer" onclick="gtag_report_conversion();" class="btn btn--primary btn--xl">
                <svg width="20" height="20" style="width:20px;height:20px;min-width:20px;flex-shrink:0;" viewBox="0 0 24 24" fill="currentColor"><path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2zm-7 5h5v5h-5z"/></svg>
                Book Online via AMZY in 30 Sec ↗
              </a>
              <a href="tel:2538867724" class="btn btn--outline-light btn--xl" aria-label="Call (253) 886-7724">
                <svg width="20" height="20" style="width:20px;height:20px;min-width:20px;flex-shrink:0;" viewBox="0 0 24 24" fill="currentColor"><path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
                Call: (253) 886-7724
              </a>
            </div>

            <div class="hero__badges">
              <div class="hero-badge">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/></svg>
                Licensed &amp; Insured
              </div>
              <div class="hero-badge">
                <span style="font-weight:900; color:#ea580c;">10%</span>
                Rate Guarantee
              </div>
              <div class="hero-badge">
                <span style="font-weight:800; color:#22c55e;">AAA+</span>
                BBB Accredited
              </div>
            </div>
          </div>

          <!-- RIGHT COLUMN: Martin's Direct Dispatch Console Card -->
          <div>
            <div class="concept3-dispatch-card">
              <div class="concept3-card-status-bar">
                <div class="concept3-live-indicator">
                  <span class="live-pulse"></span>
                  <span>Direct Dispatch Active</span>
                </div>
                <div style="font-size: 0.8rem; color: #94a3b8; font-weight: 500;">
                  Pierce &amp; South King Co.
                </div>
              </div>

              <div class="concept3-profile-header">
                <img class="concept3-avatar" 
                     src="/assets/images/martin-silchuk-avatar.webp" 
                     alt="Martin Silchuk - Owner &amp; Operator" 
                     width="78" height="78">
                <div>
                  <h2 class="concept3-owner-name">
                    Martin Silchuk
                    ${verifiedSvg}
                  </h2>
                  <p class="concept3-owner-title">Owner &amp; Lead Operator • Est. 2007</p>
                </div>
              </div>

              <div class="concept3-quote-box">
                "I personally oversee every route and price quote. No franchise royalties, no call center runaround. We match and beat any licensed competitor's price by 10%."
              </div>

              <div class="concept3-stats-row">
                <div class="concept3-stat-item">
                  <div class="concept3-stat-num" style="color: #ea580c;">19+</div>
                  <div class="concept3-stat-lbl">Years in WA</div>
                </div>
                <div class="concept3-stat-item">
                  <div class="concept3-stat-num" style="color: #fbbf24;">258+</div>
                  <div class="concept3-stat-lbl">5★ Reviews</div>
                </div>
                <div class="concept3-stat-item">
                  <div class="concept3-stat-num" style="color: #22c55e;">10%</div>
                  <div class="concept3-stat-lbl">Rate Beat</div>
                </div>
              </div>

              <div class="concept3-card-actions">
                <a href="tel:2538867724" class="btn btn--primary btn--md" style="width: 100%; justify-content: center;">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
                  Call Martin: (253) 886-7724
                </a>
                <a href="https://amzy.me/?utm_content=4" target="_blank" rel="noopener noreferrer" onclick="gtag_report_conversion();" class="btn btn--outline-light btn--sm" style="width: 100%; justify-content: center;">
                  Instant 30-Sec AMZY Schedule ↗
                </a>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  `;

  return html.replace(heroRegex, newHeroHtml);
}

// Build and save each version
const v1 = buildVersion1();
const v2 = buildVersion2();
const v3 = buildVersion3();

// Write to both root and public directories
const outputs = [
  { dir: 'preview-1', content: v1 },
  { dir: 'preview-2', content: v2 },
  { dir: 'preview-3', content: v3 }
];

outputs.forEach(({ dir, content }) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), content, 'utf8');

  const pubDir = path.join('public', dir);
  if (!fs.existsSync(pubDir)) fs.mkdirSync(pubDir, { recursive: true });
  fs.writeFileSync(path.join(pubDir, 'index.html'), content, 'utf8');

  console.log(`Generated ${dir}/index.html and public/${dir}/index.html`);
});

console.log('All 3 preview pages built successfully!');
